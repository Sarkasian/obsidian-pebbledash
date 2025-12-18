/**
 * File operations for DashboardView.
 * Handles file picking, content assignment, and tile content management.
 */

import { TFile, Notice } from 'obsidian';
import type { App } from 'obsidian';
import type { TileId, ObsidianTileMeta } from '../types';
import type { DashFile } from '../types';
import { serializeDashFile } from '../yamlAdapter';
import { FileSuggestModal } from '../modals';

/**
 * Context needed for file operations
 */
export interface FileOperationsContext {
  app: App;
  file: TFile | null;
  dashFile: DashFile | null;
  dashboard: { getModel(): { updateTile(id: TileId, data: { meta: ObsidianTileMeta }): Promise<void> } } | null;
  updateWidgetForTile: (tileId: string, meta: ObsidianTileMeta) => void;
  skipNextRefresh: boolean;
}

/**
 * Open the file picker modal for selecting tile content
 */
export function openFilePicker(
  ctx: FileOperationsContext,
  tileId: TileId,
  onSelect?: (file: TFile) => void
): void {
  new FileSuggestModal(ctx.app, {
    onChoose: (file: TFile) => {
      if (onSelect) {
        onSelect(file);
      } else {
        // Default behavior: set as embedded content
        void setTileContent(ctx, tileId, file.path, 'embedded');
      }
    },
  }).open();
}

/**
 * Set content for a tile
 */
export async function setTileContent(
  ctx: FileOperationsContext,
  tileId: TileId,
  contentRef: string,
  widgetType: string
): Promise<void> {
  if (!ctx.dashFile) {
    return;
  }

  // Find and update the tile in our dashFile
  const tiles = ctx.dashFile.tiles;
  const tileIndex = tiles.findIndex(t => t.id === tileId);
  
  if (tileIndex === -1) {
    return;
  }

  // Create the new meta
  const newMeta: ObsidianTileMeta = {
    ...tiles[tileIndex].meta,
    widgetType: widgetType as 'empty' | 'embedded',
    contentRef,
  };

  // Update dashFile directly - our single source of truth
  tiles[tileIndex].meta = newMeta;

  // SAVE SYNCHRONOUSLY - this prevents race conditions where the file 
  // is reloaded before our changes are persisted
  if (ctx.file) {
    try {
      const yaml = serializeDashFile(ctx.dashFile);
      // Set flag to skip setViewData refresh since we're saving ourselves
      ctx.skipNextRefresh = true;
      await ctx.app.vault.modify(ctx.file, yaml);
    } catch {
      new Notice('Failed to save dashboard');
    }
  }

  // Update pebbledash model for history support (optional, may fail)
  if (ctx.dashboard) {
    try {
      const model = ctx.dashboard.getModel();
      await model.updateTile(tileId, { meta: newMeta as any });
    } catch {
      // Non-critical - model update failed but file is saved
    }
  }
  
  // Manually update the widget since pebbledash may not re-render for meta-only changes
  ctx.updateWidgetForTile(tileId as string, newMeta);
}

/**
 * Delete a tile from the dashboard
 */
export async function deleteTile(
  dashboard: { getModel(): { deleteTile(id: TileId): Promise<unknown> } } | null,
  tileId: TileId
): Promise<void> {
  if (!dashboard) return;
  
  try {
    const model = dashboard.getModel();
    await model.deleteTile(tileId);
  } catch (error) {
    console.error('Failed to delete tile:', error);
  }
}

