/**
 * Settings operations for DashboardView.
 * Handles opening and saving dashboard and tile settings.
 */

import { App, Notice } from 'obsidian';
import type { BaseDashboard } from '@pebbledash/renderer-dom';
import type { TileId, DashFile, ObsidianTileMeta, PebbledashSettings, DashboardSettings, TileConstraints } from '../types';
import { DashboardSettingsModal, TileSettingsModal } from '../modals';
import {
  resolveEffectiveDashboardConfig,
  applyCssVariables,
  type EffectiveDashboardConfig,
} from '../settingsResolver';

/**
 * Context needed for settings operations
 */
export interface SettingsOperationsContext {
  app: App;
  dashFile: DashFile | null;
  vaultSettings: PebbledashSettings;
  dashboard: BaseDashboard | null;
  dashboardContainer: HTMLElement | null;
  effectiveDashboardConfig: EffectiveDashboardConfig | null;
  mode: 'view' | 'edit';
  editSubMode: 'insert' | 'resize';
  onDashFileUpdate: (dashFile: DashFile) => void;
  onConfigUpdate: (config: EffectiveDashboardConfig) => void;
  refreshAllWidgets: () => void;
  updateWidgetForTile: (tileId: string, meta: ObsidianTileMeta) => void;
  requestSave: () => void;
  openFilePicker: (tileId: TileId) => void;
}

/**
 * Open the dashboard settings modal
 */
export function openDashboardSettings(ctx: SettingsOperationsContext): void {
  if (!ctx.dashFile) return;

  new DashboardSettingsModal(ctx.app, {
    settings: ctx.dashFile.settings || {},
    vaultSettings: ctx.vaultSettings,
    onSave: (settings: DashboardSettings) => {
      if (!ctx.dashFile) return;
      
      // Create updated dash file
      const updatedDashFile = { ...ctx.dashFile };
      
      // Update dashboard settings
      if (Object.keys(settings).length > 0) {
        updatedDashFile.settings = settings;
      } else {
        delete updatedDashFile.settings;
      }
      
      ctx.onDashFileUpdate(updatedDashFile);
      
      // Re-apply CSS variables
      if (ctx.dashboardContainer) {
        const newConfig = resolveEffectiveDashboardConfig(
          ctx.vaultSettings,
          updatedDashFile.settings
        );
        applyCssVariables(ctx.dashboardContainer, newConfig);
        ctx.onConfigUpdate(newConfig);
      }
      
      // Refresh all widgets to pick up new default settings
      ctx.refreshAllWidgets();
      
      // Save the file
      ctx.requestSave();
      new Notice('Dashboard settings saved');
    },
  }).open();
}

/**
 * Open the tile settings modal
 */
export function openTileSettings(ctx: SettingsOperationsContext, tileId: TileId): void {
  if (!ctx.dashFile) return;

  const tile = ctx.dashFile.tiles.find(t => t.id === tileId);
  if (!tile) return;

  new TileSettingsModal(ctx.app, {
    tileId,
    meta: tile.meta || { widgetType: 'empty' },
    constraints: tile.constraints,
    vaultSettings: ctx.vaultSettings,
    dashboardSettings: ctx.dashFile.settings,
    onSave: (meta: ObsidianTileMeta, constraints?: TileConstraints) => {
      if (!ctx.dashFile) return;
      
      const tileIndex = ctx.dashFile.tiles.findIndex(t => t.id === tileId);
      if (tileIndex === -1) return;
      
      // Create updated dash file
      const updatedDashFile = { ...ctx.dashFile };
      const updatedTiles = [...updatedDashFile.tiles];
      
      // Update tile meta
      updatedTiles[tileIndex] = {
        ...updatedTiles[tileIndex],
        meta,
      };
      
      // Update tile constraints
      if (constraints && Object.keys(constraints).length > 0) {
        updatedTiles[tileIndex].constraints = constraints;
      } else {
        delete updatedTiles[tileIndex].constraints;
      }
      
      updatedDashFile.tiles = updatedTiles;
      ctx.onDashFileUpdate(updatedDashFile);
      
      // Apply constraints to pebbledash ConfigManager
      if (ctx.dashboard) {
        const configManager = ctx.dashboard.getModel().getConfigManager();
        if (constraints && Object.keys(constraints).length > 0) {
          configManager.setTileConstraints(tileId, constraints);
        } else {
          configManager.clearTileConstraints(tileId);
        }
        
        // Rebuild overlays to reflect new locked zones
        if (ctx.mode === 'edit') {
          ctx.dashboard.setMode(ctx.editSubMode);
        }
      }
      
      // Update the widget
      ctx.updateWidgetForTile(tileId as string, meta);
      
      // Save the file
      ctx.requestSave();
      new Notice('Tile settings saved');
    },
    onSelectContent: () => {
      // Open file picker
      ctx.openFilePicker(tileId);
    },
  }).open();
}

