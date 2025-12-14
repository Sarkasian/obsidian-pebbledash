import { Plugin, TFile, TFolder } from 'obsidian';
import type { PebbledashSettings } from './types';
import { DEFAULT_SETTINGS, DASHBOARD_VIEW_TYPE, DASH_EXTENSION } from './constants';
import { PebbledashSettingTab } from './settings';
import { DashboardView } from './DashboardView';
import { createDashFile } from './yamlAdapter';
import { createDashEmbedFactory } from './dashEmbed';
import { FileTracker } from './fileTracker';
import type { WidgetFactory, WidgetRegistry } from './widgets';

export default class PebbledashPlugin extends Plugin {
  settings: PebbledashSettings = DEFAULT_SETTINGS;
  fileTracker: FileTracker | null = null;
  
  /**
   * Registry of external widget factories registered by other plugins.
   * Use registerWidget() to add widgets.
   */
  private externalWidgets: WidgetRegistry = {};

  async onload(): Promise<void> {
    await this.loadSettings();

    // Register the dashboard view type
    this.registerView(
      DASHBOARD_VIEW_TYPE,
      (leaf) => new DashboardView(leaf, this)
    );

    // Register .dash file extension
    this.registerExtensions([DASH_EXTENSION], DASHBOARD_VIEW_TYPE);

    // Register .dash embed factory for embedding dashboards in tiles/notes
    // Uses internal Obsidian API - types defined in obsidian-internal.d.ts
    if (this.app.embedRegistry?.embedByExtension) {
      this.app.embedRegistry.embedByExtension[DASH_EXTENSION] = createDashEmbedFactory(this);
    }

    // Add ribbon icon to create new dashboard
    this.addRibbonIcon('layout-dashboard', 'Create new dashboard', async () => {
      await this.createNewDashboard();
    });

    // Add command: Create new dashboard
    this.addCommand({
      id: 'create-dashboard',
      name: 'Create new dashboard',
      callback: async () => {
        await this.createNewDashboard();
      },
    });

    // Add command: Toggle edit mode (when dashboard is active)
    this.addCommand({
      id: 'toggle-edit-mode',
      name: 'Toggle dashboard edit mode',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(DashboardView);
        if (view) {
          if (!checking) {
            view.toggleMode();
          }
          return true;
        }
        return false;
      },
    });

    // Add command: Switch to insert sub-mode
    this.addCommand({
      id: 'insert-mode',
      name: 'Dashboard: Insert mode',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(DashboardView);
        if (view && view.getMode() === 'edit') {
          if (!checking) {
            view.setEditSubMode('insert');
          }
          return true;
        }
        return false;
      },
    });

    // Add command: Switch to resize sub-mode
    this.addCommand({
      id: 'resize-mode',
      name: 'Dashboard: Resize mode',
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(DashboardView);
        if (view && view.getMode() === 'edit') {
          if (!checking) {
            view.setEditSubMode('resize');
          }
          return true;
        }
        return false;
      },
    });

    // Add file menu item for creating dashboards in folders
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle('New dashboard')
              .setIcon('layout-dashboard')
              .onClick(async () => {
                await this.createNewDashboard(file.path);
              });
          });
        }
      })
    );

    // Add settings tab
    this.addSettingTab(new PebbledashSettingTab(this.app, this));

    // Initialize file tracker for rename/delete tracking
    this.fileTracker = new FileTracker(this.app.vault);
    this.fileTracker.start();
    
    // Register callback for file modifications to refresh embedded content
    this.fileTracker.onFileModify((filePath, dashboardPaths) => {
      // Find open dashboard views that embed the modified file
      for (const dashboardPath of dashboardPaths) {
        this.app.workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE).forEach(leaf => {
          const view = leaf.view as DashboardView;
          if (view.file?.path === dashboardPath) {
            // Refresh widgets that embed the modified file
            view.refreshEmbeddedContent?.(filePath);
          }
        });
      }
    });
    
    // Index all dashboards once the vault is ready
    this.app.workspace.onLayoutReady(async () => {
      await this.fileTracker?.indexAllDashboards();
    });
  }

  onunload(): void {
    // Stop file tracker
    this.fileTracker?.stop();
    this.fileTracker = null;

    // Unregister .dash embed factory
    // Uses internal Obsidian API - types defined in obsidian-internal.d.ts
    if (this.app.embedRegistry?.embedByExtension?.[DASH_EXTENSION]) {
      delete this.app.embedRegistry.embedByExtension[DASH_EXTENSION];
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /**
   * Create a new dashboard file
   */
  async createNewDashboard(folderPath?: string): Promise<void> {
    // Determine the folder - handle empty string as root
    let folder = folderPath;
    if (folder === undefined) {
      const newFileParent = this.app.fileManager.getNewFileParent('');
      folder = newFileParent?.path ?? '';
    }
    
    // Generate a unique filename
    const baseName = 'Dashboard';
    const fullPath = this.getUniqueFilePath(folder, baseName);

    try {
      // Create the file
      const file = await createDashFile(this.app.vault, fullPath);

      // Open the file
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      const { Notice } = require('obsidian');
      new Notice(`Failed to create dashboard: ${error}`);
    }
  }

  /**
   * Generate a unique file path by appending numbers if needed
   */
  private getUniqueFilePath(folder: string, baseName: string): string {
    let counter = 0;
    let fullPath: string;
    
    do {
      const suffix = counter === 0 ? '' : ` ${counter}`;
      const fileName = `${baseName}${suffix}.${DASH_EXTENSION}`;
      
      // Construct path - handle empty folder (root)
      if (folder && folder !== '/') {
        fullPath = `${folder}/${fileName}`;
      } else {
        fullPath = fileName;
      }
      
      counter++;
    } while (this.app.vault.getAbstractFileByPath(fullPath));
    
    return fullPath;
  }

  /**
   * Open a dashboard file in a new leaf
   */
  async openDashboard(file: TFile): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
  }

  /**
   * Register a custom widget factory for use in dashboards.
   * 
   * External plugins can call this method to add custom widget types
   * that can be used in .dash files.
   * 
   * @param widgetType - Unique identifier for the widget type (e.g., 'my-chart')
   * @param factory - Factory function that creates widget instances
   * @returns A cleanup function to unregister the widget
   * 
   * @example
   * ```ts
   * // In your plugin's onload():
   * const pebbledash = this.app.plugins.getPlugin('obsidian-pebbledash');
   * if (pebbledash) {
   *   const unregister = pebbledash.registerWidget('my-chart', (ctx) => ({
   *     mount() { ctx.element.textContent = 'My Chart'; },
   *     unmount() { ctx.element.empty(); },
   *   }));
   *   
   *   // Optionally store unregister for cleanup in onunload()
   *   this.register(unregister);
   * }
   * ```
   */
  registerWidget(widgetType: string, factory: WidgetFactory): () => void {
    if (this.externalWidgets[widgetType]) {
      console.warn(`Pebbledash: Widget type '${widgetType}' is already registered. Overwriting.`);
    }
    
    this.externalWidgets[widgetType] = factory;
    
    // Notify any open dashboard views to refresh their widget registries
    this.app.workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE).forEach(leaf => {
      const view = leaf.view as DashboardView;
      view.refreshWidgetRegistry?.();
    });
    
    // Return cleanup function
    return () => {
      delete this.externalWidgets[widgetType];
    };
  }

  /**
   * Register multiple widget factories at once.
   * 
   * @param widgets - Object mapping widget type names to factory functions
   * @returns A cleanup function to unregister all widgets
   * 
   * @example
   * ```ts
   * const unregister = pebbledash.registerWidgets({
   *   'my-chart': createChartWidget,
   *   'my-table': createTableWidget,
   * });
   * ```
   */
  registerWidgets(widgets: WidgetRegistry): () => void {
    const unregisterFns = Object.entries(widgets).map(([type, factory]) => 
      this.registerWidget(type, factory)
    );
    
    return () => {
      unregisterFns.forEach(fn => fn());
    };
  }

  /**
   * Get the registry of external widgets.
   * Used internally by DashboardView to build the full widget registry.
   */
  getExternalWidgets(): WidgetRegistry {
    return { ...this.externalWidgets };
  }
}
