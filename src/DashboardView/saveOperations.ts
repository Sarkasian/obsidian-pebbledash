/**
 * Save operations for DashboardView.
 * Handles saving, discarding, and save-as functionality.
 */

import { Notice, TFile, App } from 'obsidian';
import type { DashFile } from '../types';
import { serializeDashFile, parseDashFile } from '../yamlAdapter';
import { ConfirmModal, SaveAsModal } from '../modals';
import { DASH_EXTENSION } from '../constants';

/**
 * Context needed for save operations
 */
export interface SaveOperationsContext {
  app: App;
  file: TFile | null;
  dashFile: DashFile | null;
  originalDashFileData: string;
  onDashFileChange: (dashFile: DashFile) => void;
  onReinitialize: () => void;
  setMode: (mode: 'view' | 'edit') => void;
}

/**
 * Save changes and exit edit mode
 */
export function saveAndExit(ctx: SaveOperationsContext): void {
  if (ctx.dashFile) {
    // Update original data since save is automatic via requestSave
    ctx.onDashFileChange(ctx.dashFile);
  }
  ctx.setMode('view');
  new Notice('Dashboard saved');
}

/**
 * Show confirmation dialog before discarding changes
 */
export function confirmDiscard(
  ctx: SaveOperationsContext,
  onConfirm: () => void
): void {
  new ConfirmModal(ctx.app, {
    title: 'Discard changes?',
    message: 'Are you sure you want to discard all changes made to this dashboard? This cannot be undone.',
    confirmText: 'Discard',
    cancelText: 'Cancel',
    onConfirm,
  }).open();
}

/**
 * Discard changes and exit edit mode
 */
export function discardAndExit(ctx: SaveOperationsContext): void {
  // Revert to original data
  if (ctx.originalDashFileData) {
    const reverted = parseDashFile(ctx.originalDashFileData);
    ctx.onDashFileChange(reverted);
    ctx.onReinitialize();
  }
  ctx.setMode('view');
  new Notice('Changes discarded');
}

/**
 * Save dashboard as a new file
 */
export function saveAs(ctx: SaveOperationsContext): void {
  if (!ctx.dashFile || !ctx.file) return;
  
  // Get the folder path
  const folder = ctx.file.parent?.path ?? '';
  
  // Generate a suggested filename
  const baseName = ctx.file.basename + ' copy';
  let counter = 1;
  let fileName = `${baseName}.${DASH_EXTENSION}`;
  let defaultPath = folder ? `${folder}/${fileName}` : fileName;
  
  while (ctx.app.vault.getAbstractFileByPath(defaultPath)) {
    fileName = `${baseName} ${counter}.${DASH_EXTENSION}`;
    defaultPath = folder ? `${folder}/${fileName}` : fileName;
    counter++;
  }
  
  new SaveAsModal(ctx.app, {
    defaultPath,
    onSave: async (path: string) => {
      // Ensure it has the correct extension
      let finalPath = path;
      if (!finalPath.endsWith(`.${DASH_EXTENSION}`)) {
        finalPath = `${finalPath}.${DASH_EXTENSION}`;
      }
      
      try {
        // Check if file already exists
        if (ctx.app.vault.getAbstractFileByPath(finalPath)) {
          new Notice(`File already exists: ${finalPath}`);
          return;
        }
        
        // Create the new file with current content
        const content = serializeDashFile(ctx.dashFile!);
        const newFile = await ctx.app.vault.create(finalPath, content);
        
        // Open the new file
        const leaf = ctx.app.workspace.getLeaf(false);
        await leaf.openFile(newFile);
        
        new Notice(`Saved as ${newFile.path}`);
      } catch (error) {
        console.error('Failed to save as:', error);
        new Notice(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  }).open();
}

