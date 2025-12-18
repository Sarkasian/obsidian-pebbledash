/**
 * File reference tracking for dashboard tiles.
 * 
 * Handles:
 * - Tracking which files are referenced by which dashboards
 * - Updating references when files are renamed
 * - Notifying when referenced files are deleted
 * - Real-time updates when embedded files are modified
 */

import { TFile, TAbstractFile, Vault, EventRef, debounce } from 'obsidian';
import { parseDashFile, serializeDashFile } from './yamlAdapter';
import { DASH_EXTENSION } from './constants';

/**
 * Index of file paths to the dashboard files that reference them
 */
type FileReferenceIndex = Map<string, Set<string>>;

/**
 * Callback for when a file reference changes (rename/delete)
 */
export type FileChangeCallback = (
  dashboardPath: string, 
  oldPath: string, 
  newPath: string | null // null = deleted
) => void;

/**
 * Callback for when a referenced file is modified
 */
export type FileModifyCallback = (
  filePath: string,
  dashboardPaths: string[]
) => void;

/**
 * Tracks file references across all dashboards and handles renames/deletions
 */
export class FileTracker {
  private vault: Vault;
  private index: FileReferenceIndex = new Map();
  private eventRefs: EventRef[] = [];
  private changeCallbacks: Set<FileChangeCallback> = new Set();
  private modifyCallbacks: Set<FileModifyCallback> = new Set();
  
  /**
   * Debounced handler for file modifications.
   * Groups rapid changes to the same file into a single callback.
   */
  private debouncedModifyHandler: (filePath: string) => void;

  constructor(vault: Vault) {
    this.vault = vault;
    
    // Create debounced handler with 500ms delay
    this.debouncedModifyHandler = debounce(
      (filePath: string) => this.notifyModifyCallbacks(filePath),
      500,
      true // leading edge - trigger immediately, then debounce
    );
  }

  /**
   * Start listening for vault events
   */
  start(): void {
    // Listen for file renames
    const renameRef = this.vault.on('rename', (file, oldPath) => {
      this.handleRename(file, oldPath);
    });
    this.eventRefs.push(renameRef);

    // Listen for file deletions
    const deleteRef = this.vault.on('delete', (file) => {
      this.handleDelete(file);
    });
    this.eventRefs.push(deleteRef);

    // Listen for file modifications (for real-time updates)
    const modifyRef = this.vault.on('modify', (file) => {
      this.handleModify(file);
    });
    this.eventRefs.push(modifyRef);
  }

  /**
   * Stop listening for vault events
   */
  stop(): void {
    for (const ref of this.eventRefs) {
      this.vault.offref(ref);
    }
    this.eventRefs = [];
  }

  /**
   * Register a callback for file changes (rename/delete)
   */
  onFileChange(callback: FileChangeCallback): () => void {
    this.changeCallbacks.add(callback);
    return () => this.changeCallbacks.delete(callback);
  }

  /**
   * Register a callback for file modifications.
   * Useful for refreshing embedded content when the source file changes.
   * Callbacks are debounced to avoid excessive updates.
   * 
   * @param callback - Called with the modified file path and list of affected dashboards
   * @returns Cleanup function to unregister the callback
   */
  onFileModify(callback: FileModifyCallback): () => void {
    this.modifyCallbacks.add(callback);
    return () => this.modifyCallbacks.delete(callback);
  }

  /**
   * Index all dashboard files in the vault
   */
  async indexAllDashboards(): Promise<void> {
    this.index.clear();
    
    const dashFiles = this.vault.getFiles().filter(
      f => f.extension === DASH_EXTENSION
    );

    for (const file of dashFiles) {
      await this.indexDashboard(file);
    }
  }

  /**
   * Index a single dashboard file
   */
  async indexDashboard(file: TFile): Promise<void> {
    try {
      const content = await this.vault.read(file);
      const dashFile = parseDashFile(content);
      
      // Clear existing references from this dashboard
      this.clearDashboardFromIndex(file.path);
      
      // Add new references
      for (const tile of dashFile.tiles) {
        const contentRef = tile.meta?.contentRef;
        if (contentRef) {
          this.addReference(contentRef, file.path);
        }
      }
    } catch (error) {
      console.warn(`[FileTracker] Failed to index dashboard ${file.path}:`, error);
    }
  }

  /**
   * Remove a dashboard from the index (e.g., when dashboard is deleted)
   */
  removeDashboard(dashboardPath: string): void {
    this.clearDashboardFromIndex(dashboardPath);
  }

  /**
   * Get all dashboards that reference a file
   */
  getDashboardsReferencing(filePath: string): Set<string> {
    return this.index.get(filePath) ?? new Set();
  }

  /**
   * Handle file rename event
   */
  private async handleRename(file: TAbstractFile, oldPath: string): Promise<void> {
    if (!(file instanceof TFile)) return;

    // Check if a dashboard file was renamed
    if (file.extension === DASH_EXTENSION) {
      // Update index: move all references from old path to new path
      this.updateDashboardPath(oldPath, file.path);
      return;
    }

    // Check if a referenced file was renamed
    const referencingDashboards = this.index.get(oldPath);
    if (!referencingDashboards || referencingDashboards.size === 0) return;

    // Update all dashboards that reference this file
    for (const dashboardPath of referencingDashboards) {
      await this.updateDashboardReferences(dashboardPath, oldPath, file.path);
      
      // Notify callbacks
      for (const callback of this.changeCallbacks) {
        callback(dashboardPath, oldPath, file.path);
      }
    }

    // Update index
    this.index.delete(oldPath);
    for (const dashboardPath of referencingDashboards) {
      this.addReference(file.path, dashboardPath);
    }
  }

  /**
   * Handle file delete event
   */
  private handleDelete(file: TAbstractFile): void {
    if (!(file instanceof TFile)) return;

    // Check if a dashboard was deleted
    if (file.extension === DASH_EXTENSION) {
      this.clearDashboardFromIndex(file.path);
      return;
    }

    // Check if a referenced file was deleted
    const referencingDashboards = this.index.get(file.path);
    if (!referencingDashboards || referencingDashboards.size === 0) return;

    // Notify callbacks - they'll handle showing error state
    for (const dashboardPath of referencingDashboards) {
      for (const callback of this.changeCallbacks) {
        callback(dashboardPath, file.path, null); // null = deleted
      }
    }

    // Remove from index
    this.index.delete(file.path);
  }

  /**
   * Handle file modify event
   */
  private handleModify(file: TAbstractFile): void {
    if (!(file instanceof TFile)) return;
    
    // Skip dashboard files - they have their own handling
    if (file.extension === DASH_EXTENSION) return;

    // Check if this file is referenced by any dashboards
    const referencingDashboards = this.index.get(file.path);
    if (!referencingDashboards || referencingDashboards.size === 0) return;

    // Use debounced handler to batch rapid changes
    this.debouncedModifyHandler(file.path);
  }

  /**
   * Notify modify callbacks (called via debounced handler)
   */
  private notifyModifyCallbacks(filePath: string): void {
    const referencingDashboards = this.index.get(filePath);
    if (!referencingDashboards || referencingDashboards.size === 0) return;

    const dashboardPaths = Array.from(referencingDashboards);
    for (const callback of this.modifyCallbacks) {
      callback(filePath, dashboardPaths);
    }
  }

  /**
   * Update references in a dashboard file
   */
  private async updateDashboardReferences(
    dashboardPath: string,
    oldFilePath: string,
    newFilePath: string
  ): Promise<void> {
    const dashboardFile = this.vault.getAbstractFileByPath(dashboardPath);
    if (!(dashboardFile instanceof TFile)) return;

    try {
      const content = await this.vault.read(dashboardFile);
      const dashFile = parseDashFile(content);
      
      let modified = false;
      for (const tile of dashFile.tiles) {
        if (tile.meta?.contentRef === oldFilePath) {
          tile.meta.contentRef = newFilePath;
          modified = true;
        }
      }

      if (modified) {
        const newContent = serializeDashFile(dashFile);
        await this.vault.modify(dashboardFile, newContent);
      }
    } catch (error) {
      console.error(`[FileTracker] Failed to update dashboard ${dashboardPath}:`, error);
    }
  }

  /**
   * Add a reference to the index
   */
  private addReference(filePath: string, dashboardPath: string): void {
    let refs = this.index.get(filePath);
    if (!refs) {
      refs = new Set();
      this.index.set(filePath, refs);
    }
    refs.add(dashboardPath);
  }

  /**
   * Clear all references from a dashboard
   */
  private clearDashboardFromIndex(dashboardPath: string): void {
    for (const [, dashboards] of this.index) {
      dashboards.delete(dashboardPath);
    }
    // Clean up empty entries
    for (const [filePath, dashboards] of this.index) {
      if (dashboards.size === 0) {
        this.index.delete(filePath);
      }
    }
  }

  /**
   * Update dashboard path in index when dashboard is renamed
   */
  private updateDashboardPath(oldPath: string, newPath: string): void {
    for (const [, dashboards] of this.index) {
      if (dashboards.has(oldPath)) {
        dashboards.delete(oldPath);
        dashboards.add(newPath);
      }
    }
  }
}

