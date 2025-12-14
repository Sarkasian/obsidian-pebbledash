/**
 * Dashboard operation context for shared state across view operations.
 * 
 * This module provides a centralized context builder to reduce repetition
 * when passing state to helper functions like save operations, settings modals, etc.
 */

import type { App, TFile } from 'obsidian';
import type { BaseDashboard } from '@pebbledash/renderer-dom';
import type { 
  DashFile, 
  DashboardMode, 
  EditSubMode, 
  TileId, 
  ObsidianTileMeta,
  PebbledashSettings,
} from '../types';
import type { EffectiveDashboardConfig } from '../settingsResolver';
import type { Widget, WidgetRegistry } from '../widgets';

/**
 * Core context for dashboard operations.
 * Contains the essential state needed for most operations.
 */
export interface DashboardCoreContext {
  /** Obsidian App instance */
  app: App;
  /** Current dashboard file (may be null for unsaved dashboards) */
  file: TFile | null;
  /** Parsed dashboard data */
  dashFile: DashFile | null;
  /** Original serialized data for dirty checking */
  originalDashFileData: string;
}

/**
 * Extended context with callbacks for mutating operations.
 */
export interface DashboardMutationContext extends DashboardCoreContext {
  /** Callback when dash file is updated */
  onDashFileChange: (dashFile: DashFile) => void;
  /** Callback to reinitialize the dashboard */
  onReinitialize: () => void;
  /** Callback to set the view mode */
  setMode: (mode: DashboardMode) => void;
}

/**
 * Context for settings operations.
 */
export interface DashboardSettingsContext extends DashboardCoreContext {
  /** Vault-level plugin settings */
  vaultSettings: PebbledashSettings;
  /** The BaseDashboard instance */
  dashboard: BaseDashboard | null;
  /** Container element for the dashboard */
  dashboardContainer: HTMLElement | null;
  /** Resolved effective config */
  effectiveDashboardConfig: EffectiveDashboardConfig | null;
  /** Current view mode */
  mode: DashboardMode;
  /** Current edit sub-mode */
  editSubMode: EditSubMode;
  /** Callback when dash file is updated */
  onDashFileUpdate: (dashFile: DashFile) => void;
  /** Callback when effective config is updated */
  onConfigUpdate: (config: EffectiveDashboardConfig) => void;
  /** Refresh all widgets */
  refreshAllWidgets: () => void;
  /** Update a specific widget */
  updateWidgetForTile: (tileId: string, meta: ObsidianTileMeta) => void;
  /** Request save (with skip refresh flag) */
  requestSave: () => void;
  /** Open file picker for a tile */
  openFilePicker: (tileId: TileId) => void;
}

/**
 * Context for widget operations.
 */
export interface WidgetBridgeContext {
  /** Obsidian App instance */
  app: App;
  /** Parent component for Obsidian lifecycle */
  component: any; // Component type from obsidian
  /** Parsed dashboard data */
  dashFile: DashFile | null;
  /** Vault-level settings */
  settings: PebbledashSettings;
  /** Widget registry */
  widgetRegistry: WidgetRegistry;
  /** Map of active widget instances */
  activeWidgets: Map<string, Widget>;
}

/**
 * Context for widget lifecycle operations.
 */
export interface WidgetLifecycleContext extends WidgetBridgeContext {
  /** Dashboard container element */
  dashboardContainer: HTMLElement | null;
}

/**
 * Context for file content operations.
 */
export interface FileOperationContext {
  /** Obsidian App instance */
  app: App;
  /** Current file */
  file: TFile | null;
  /** Dashboard data */
  dashFile: DashFile | null;
  /** Dashboard instance */
  dashboard: BaseDashboard;
  /** Update widget callback */
  updateWidgetForTile: (tileId: string, meta: ObsidianTileMeta) => void;
  /** Skip next refresh flag */
  skipNextRefresh: boolean;
}

/**
 * Context for context menu operations.
 */
export interface ContextMenuContext {
  /** Obsidian App instance */
  app: App;
  /** Tile being operated on */
  tileId: TileId;
  /** Mouse event that triggered the menu */
  event: MouseEvent;
  /** Current view mode */
  mode: DashboardMode;
  /** Current edit sub-mode */
  editSubMode: EditSubMode;
  /** Dashboard data */
  dashFile: DashFile | null;
  /** Dashboard instance */
  dashboard: BaseDashboard | null;
  /** Active widgets map */
  activeWidgets: Map<string, Widget>;
}

/**
 * Callbacks for context menu actions.
 */
export interface ContextMenuCallbacks {
  setMode: (mode: DashboardMode) => void;
  setEditSubMode: (subMode: EditSubMode) => void;
  saveAndExit: () => void;
  confirmDiscard: () => void;
  saveAs: () => void;
  openDashboardSettings: () => void;
  openTileSettings: (tileId: TileId) => void;
  openFilePicker: (tileId: TileId) => void;
  deleteTile: (tileId: TileId) => void;
}

/**
 * Build a core context from a DashboardView instance.
 * This is the minimal context needed for basic operations.
 */
export function buildCoreContext(
  app: App,
  file: TFile | null,
  dashFile: DashFile | null,
  originalDashFileData: string
): DashboardCoreContext {
  return {
    app,
    file,
    dashFile,
    originalDashFileData,
  };
}

/**
 * Extend a core context with mutation callbacks.
 */
export function extendWithMutationCallbacks(
  core: DashboardCoreContext,
  onDashFileChange: (dashFile: DashFile) => void,
  onReinitialize: () => void,
  setMode: (mode: DashboardMode) => void
): DashboardMutationContext {
  return {
    ...core,
    onDashFileChange,
    onReinitialize,
    setMode,
  };
}

