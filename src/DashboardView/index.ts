/**
 * Dashboard view - Custom view for .dash files
 * 
 * This module is the main entry point for the dashboard view.
 * Helper modules provide separated concerns:
 * - `toolbar.ts` - Edit mode toolbar UI
 * - `contextMenu.ts` - Right-click context menus
 * - `widgetBridge.ts` - Widget factory integration
 * - `fileOperations.ts` - File picking and content assignment
 * - `changeHandlers.ts` - State synchronization utilities
 * - `saveOperations.ts` - Save, discard, and save-as operations
 * - `settingsOperations.ts` - Dashboard and tile settings
 * - `widgetHelpers.ts` - Widget lifecycle management
 */

import { TextFileView, WorkspaceLeaf, TFile } from 'obsidian';
import { BaseDashboard } from '@pebbledash/renderer-dom';
import type PebbledashPlugin from '../main';
import type { DashFile, DashboardMode, EditSubMode, TileId, ObsidianTileMeta } from '../types';
import { DASHBOARD_VIEW_TYPE, CSS } from '../constants';
import { parseDashFile, serializeDashFile, dashFileToSnapshot } from '../yamlAdapter';
import { createWidgetRegistry } from '../widgets';
import type { WidgetRegistry, Widget } from '../widgets';
import { FileSuggestModal } from '../modals';
import {
  resolveEffectiveDashboardConfig,
  applyCssVariables,
  type EffectiveDashboardConfig,
} from '../settingsResolver';
import { buildEditToolbar, type ToolbarCallbacks } from './toolbar';
import { showTileContextMenu, type TileContextMenuCallbacks } from './contextMenu';
import { createPebbledashWidgetFactories, type WidgetBridgeContext } from './widgetBridge';
import { setTileContent, deleteTile } from './fileOperations';
import { handleDashboardChange } from './changeHandlers';
import { saveAndExit, confirmDiscard, discardAndExit, saveAs } from './saveOperations';
import { openDashboardSettings, openTileSettings } from './settingsOperations';
import {
  updateWidgetForTile as updateWidgetForTileHelper,
  refreshAllWidgets as refreshAllWidgetsHelper,
  unmountAllWidgets,
  refreshEmbeddedContentForFile,
} from './widgetHelpers';
import type { 
  DashboardMutationContext, 
  DashboardSettingsContext,
} from './operationContext';

/**
 * Custom view for .dash files
 */
export class DashboardView extends TextFileView {
  plugin: PebbledashPlugin;
  
  // Dashboard state
  private dashFile: DashFile | null = null;
  private originalDashFileData: string = '';
  private dashboard: BaseDashboard | null = null;
  public mode: DashboardMode = 'view';
  private editSubMode: EditSubMode = 'insert';
  
  // UI elements
  private dashboardContainer: HTMLElement | null = null;
  private editToolbar: HTMLElement | null = null;
  
  // Widget management
  private widgetRegistry: WidgetRegistry;
  private activeWidgets: Map<string, Widget> = new Map();
  
  // Flags
  private pendingInit = false;
  private skipNextRefresh = false;
  
  // Subscriptions
  private modelUnsubscribe: (() => void) | null = null;
  
  // Resolved dashboard configuration
  private effectiveDashboardConfig: EffectiveDashboardConfig | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: PebbledashPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.widgetRegistry = createWidgetRegistry(plugin.getExternalWidgets());
  }

  /**
   * Refresh the widget registry to include newly registered external widgets.
   */
  refreshWidgetRegistry(): void {
    this.widgetRegistry = createWidgetRegistry(this.plugin.getExternalWidgets());
    // Re-initialize dashboard to pick up new widgets
    if (this.dashboard && this.dashFile) {
      this.initializeDashboard();
    }
  }

  /**
   * Refresh embedded content for tiles that reference a specific file.
   */
  refreshEmbeddedContent(filePath: string): void {
    refreshEmbeddedContentForFile(this.dashFile, this.activeWidgets, filePath);
  }

  getViewType(): string {
    return DASHBOARD_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.file?.basename ?? 'Dashboard';
  }

  getIcon(): string {
    return 'layout-dashboard';
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass(CSS.container);
    
    this.dashboardContainer = contentEl.createDiv({ cls: 'pebbledash-dashboard' });
    
    // Event handlers
    const handleSelectContent = (e: Event) => {
      const tileId = (e as CustomEvent).detail?.tileId;
      if (tileId) this.openFilePicker(tileId as TileId);
    };
    contentEl.addEventListener('pebbledash:select-content', handleSelectContent);
    this.register(() => contentEl.removeEventListener('pebbledash:select-content', handleSelectContent));
    
    const handleSetContent = (e: Event) => {
      const { tileId, contentRef, widgetType } = (e as CustomEvent).detail ?? {};
      if (tileId && contentRef) {
        this.handleSetTileContent(tileId as TileId, contentRef, widgetType || 'embedded');
      }
    };
    contentEl.addEventListener('pebbledash:set-content', handleSetContent);
    this.register(() => contentEl.removeEventListener('pebbledash:set-content', handleSetContent));
    
    if (this.pendingInit && this.dashFile) {
      this.pendingInit = false;
      this.initializeDashboard();
    }
  }

  async onClose(): Promise<void> {
    this.cleanup();
  }

  getViewData(): string {
    if (!this.dashFile) return '';
    return serializeDashFile(this.dashFile);
  }

  setViewData(data: string, clear: boolean): void {
    if (clear) this.cleanup();
    
    this.originalDashFileData = data;
    this.dashFile = parseDashFile(data);
    
    if (!clear && this.dashboard) {
      if (this.skipNextRefresh) {
        this.skipNextRefresh = false;
        return;
      }
      
      for (const tile of this.dashFile.tiles) {
        const meta = (tile.meta ?? { widgetType: 'empty' }) as ObsidianTileMeta;
        this.updateWidgetForTile(tile.id as string, meta);
      }
      return;
    }
    
    if (this.dashboardContainer) {
      this.initializeDashboard();
    } else {
      this.pendingInit = true;
    }
  }

  clear(): void {
    this.cleanup();
    this.dashFile = null;
    this.dashboardContainer = null;
  }

  public toggleMode(): void {
    this.setMode(this.mode === 'view' ? 'edit' : 'view');
  }

  public setMode(mode: DashboardMode): void {
    this.mode = mode;
    
    if (this.contentEl) {
      this.contentEl.toggleClass(CSS.containerViewMode, mode === 'view');
      this.contentEl.toggleClass(CSS.containerEditMode, mode === 'edit');
    }

    if (this.dashboard) {
      if (mode === 'view') {
        this.dashboard.setMode('insert');
        this.dashboardContainer?.addClass('pebbledash-locked');
        this.removeEditToolbar();
      } else {
        this.dashboardContainer?.removeClass('pebbledash-locked');
        this.dashboard.setMode(this.editSubMode);
        this.rebuildEditToolbar();
      }
    }
  }

  public setEditSubMode(subMode: EditSubMode): void {
    this.editSubMode = subMode;
    
    if (this.dashboard && this.mode === 'edit') {
      this.dashboard.setMode(subMode);
      this.rebuildEditToolbar();
    }
  }

  public getMode(): DashboardMode {
    return this.mode;
  }

  public getEditSubMode(): EditSubMode {
    return this.editSubMode;
  }

  // ==================== Private Methods ====================

  private rebuildEditToolbar(): void {
    this.removeEditToolbar();
    if (!this.dashboardContainer) return;
    
    const callbacks: ToolbarCallbacks = {
      onInsertMode: () => this.setEditSubMode('insert'),
      onResizeMode: () => this.setEditSubMode('resize'),
      onUndo: () => this.dashboard?.getModel()?.undo(),
      onRedo: () => this.dashboard?.getModel()?.redo(),
      onSaveAndExit: () => this.handleSaveAndExit(),
      onDiscard: () => this.handleConfirmDiscard(),
      onSaveAs: () => this.handleSaveAs(),
      onSettings: () => this.handleOpenDashboardSettings(),
    };
    
    this.editToolbar = buildEditToolbar(callbacks, this.editSubMode);
    this.dashboardContainer.appendChild(this.editToolbar);
  }

  private removeEditToolbar(): void {
    if (this.editToolbar) {
      this.editToolbar.remove();
      this.editToolbar = null;
    }
  }

  // ==================== Context Builders ====================
  
  /**
   * Build the mutation context used by save/discard operations.
   */
  private buildMutationContext(): DashboardMutationContext {
    return {
      app: this.app,
      file: this.file,
      dashFile: this.dashFile,
      originalDashFileData: this.originalDashFileData,
      onDashFileChange: (df) => {
        this.dashFile = df;
        this.originalDashFileData = serializeDashFile(df);
      },
      onReinitialize: () => this.initializeDashboard(),
      setMode: (mode) => this.setMode(mode),
    };
  }

  /**
   * Build the settings context used by settings modals.
   */
  private buildSettingsContext(): DashboardSettingsContext {
    return {
      app: this.app,
      file: this.file,
      dashFile: this.dashFile,
      originalDashFileData: this.originalDashFileData,
      vaultSettings: this.plugin.settings,
      dashboard: this.dashboard,
      dashboardContainer: this.dashboardContainer,
      effectiveDashboardConfig: this.effectiveDashboardConfig,
      mode: this.mode,
      editSubMode: this.editSubMode,
      onDashFileUpdate: (df) => { this.dashFile = df; },
      onConfigUpdate: (cfg) => { this.effectiveDashboardConfig = cfg; },
      refreshAllWidgets: () => this.refreshAllWidgets(),
      updateWidgetForTile: (id, meta) => this.updateWidgetForTile(id, meta),
      requestSave: () => { this.skipNextRefresh = true; this.requestSave(); },
      openFilePicker: (id) => this.openFilePicker(id),
    };
  }

  // ==================== Operation Handlers ====================

  // Delegate to saveOperations
  private handleSaveAndExit(): void {
    saveAndExit(this.buildMutationContext());
  }

  private handleConfirmDiscard(): void {
    const ctx = this.buildMutationContext();
    confirmDiscard(ctx, () => discardAndExit(ctx));
  }

  private handleSaveAs(): void {
    saveAs(this.buildMutationContext());
  }

  // Delegate to settingsOperations
  private handleOpenDashboardSettings(): void {
    openDashboardSettings(this.buildSettingsContext());
  }

  private handleOpenTileSettings(tileId: TileId): void {
    openTileSettings(this.buildSettingsContext(), tileId);
  }

  private async initializeDashboard(): Promise<void> {
    if (!this.dashFile || !this.dashboardContainer) return;

    this.cleanupDashboard();

    this.effectiveDashboardConfig = resolveEffectiveDashboardConfig(
      this.plugin.settings,
      this.dashFile.settings
    );
    
    applyCssVariables(this.dashboardContainer, this.effectiveDashboardConfig);

    const snapshot = dashFileToSnapshot(this.dashFile);

    const widgetBridgeCtx: WidgetBridgeContext = {
      app: this.app,
      component: this,
      dashFile: this.dashFile,
      settings: this.plugin.settings,
      widgetRegistry: this.widgetRegistry,
      activeWidgets: this.activeWidgets,
    };

    this.dashboard = new BaseDashboard({
      container: this.dashboardContainer,
      defaults: {
        minTile: this.effectiveDashboardConfig.minTile,
        epsilon: 1e-6,
      },
      initialLayout: { tiles: snapshot.tiles },
      features: {
        overlays: true,
        keyboard: true,
        startMode: 'insert',
        keyboardUndoRedo: true,
      },
      resizeConfig: {
        redistributeEqually: this.effectiveDashboardConfig.redistributeEqually,
      },
      widgets: createPebbledashWidgetFactories(widgetBridgeCtx),
      onTileContextMenu: (tileId, event) => {
        this.handleTileContextMenu(tileId as unknown as TileId, event);
      },
      onHistoryChange: () => {},
      onTileClick: () => {},
    });

    await this.dashboard.mount();
    
    const model = this.dashboard.getModel();
    this.modelUnsubscribe = model.subscribe(() => this.onDashboardChange());

    const configManager = model.getConfigManager();
    for (const tile of this.dashFile.tiles) {
      if (tile.constraints && Object.keys(tile.constraints).length > 0) {
        configManager.setTileConstraints(tile.id, tile.constraints);
      }
    }

    this.setMode(this.mode);
  }

  private handleTileContextMenu(tileId: TileId, event: MouseEvent): void {
    const callbacks: TileContextMenuCallbacks = {
      setMode: (mode) => this.setMode(mode),
      setEditSubMode: (subMode) => this.setEditSubMode(subMode),
      saveAndExit: () => this.handleSaveAndExit(),
      confirmDiscard: () => this.handleConfirmDiscard(),
      saveAs: () => this.handleSaveAs(),
      openDashboardSettings: () => this.handleOpenDashboardSettings(),
      openTileSettings: (id) => this.handleOpenTileSettings(id),
      openFilePicker: (id) => this.openFilePicker(id),
      deleteTile: (id) => this.handleDeleteTile(id),
    };

    showTileContextMenu({
      app: this.app,
      tileId,
      event,
      mode: this.mode,
      editSubMode: this.editSubMode,
      dashFile: this.dashFile,
      dashboard: this.dashboard,
      activeWidgets: this.activeWidgets,
    }, callbacks);
  }

  private openFilePicker(tileId: TileId): void {
    new FileSuggestModal(this.app, {
      onChoose: (file: TFile) => {
        this.handleSetTileContent(tileId, file.path, 'embedded');
      },
    }).open();
  }

  private async handleSetTileContent(
    tileId: TileId,
    contentRef: string,
    widgetType: string
  ): Promise<void> {
    this.skipNextRefresh = true;
    await setTileContent(
      {
        app: this.app,
        file: this.file,
        dashFile: this.dashFile,
        dashboard: this.dashboard as any,
        updateWidgetForTile: (id, meta) => this.updateWidgetForTile(id, meta),
        skipNextRefresh: this.skipNextRefresh,
      },
      tileId,
      contentRef,
      widgetType
    );
  }

  private updateWidgetForTile(tileId: string, meta: ObsidianTileMeta): void {
    updateWidgetForTileHelper(
      {
        app: this.app,
        component: this,
        dashFile: this.dashFile,
        settings: this.plugin.settings,
        widgetRegistry: this.widgetRegistry,
        activeWidgets: this.activeWidgets,
        dashboardContainer: this.dashboardContainer,
      },
      tileId,
      meta
    );
  }

  private refreshAllWidgets(): void {
    refreshAllWidgetsHelper({
      app: this.app,
      component: this,
      dashFile: this.dashFile,
      settings: this.plugin.settings,
      widgetRegistry: this.widgetRegistry,
      activeWidgets: this.activeWidgets,
      dashboardContainer: this.dashboardContainer,
    });
  }

  private async handleDeleteTile(tileId: TileId): Promise<void> {
    await deleteTile(this.dashboard, tileId);
  }

  private onDashboardChange(): void {
    if (!this.dashboard || !this.dashFile) return;

    handleDashboardChange(
      this.dashboard,
      this.dashFile,
      (newDashFile) => {
        this.dashFile = newDashFile;
        this.skipNextRefresh = true;
        this.requestSave();
      }
    );
  }

  private cleanupDashboard(): void {
    unmountAllWidgets(this.activeWidgets);

    if (this.modelUnsubscribe) {
      this.modelUnsubscribe();
      this.modelUnsubscribe = null;
    }

    if (this.dashboard) {
      this.dashboard.unmount();
      this.dashboard = null;
    }

    if (this.dashboardContainer) {
      this.dashboardContainer.empty();
    }
  }

  private cleanup(): void {
    this.cleanupDashboard();
    this.removeEditToolbar();
  }
}
