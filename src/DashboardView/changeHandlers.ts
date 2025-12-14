/**
 * Change handlers for DashboardView.
 * Handles dashboard state changes and synchronization between model and file.
 */

import type { DashFile, DashTile, Snapshot } from '../types';
import { snapshotToDashFile } from '../yamlAdapter';

/**
 * Handle dashboard model state changes.
 * Synchronizes the pebbledash model state with the dash file.
 * 
 * @param dashboard - The pebbledash BaseDashboard instance
 * @param currentDashFile - Current dash file state
 * @param onUpdate - Callback with the updated dash file
 */
export function handleDashboardChange(
  dashboard: { getModel(): { createSnapshot(): Snapshot } },
  currentDashFile: DashFile,
  onUpdate: (newDashFile: DashFile) => void
): void {
  // Update dash file from model state
  const model = dashboard.getModel();
  const snapshot = model.createSnapshot();
  
  // Convert snapshot to dashFile, preserving existing meta from our dashFile
  const newDashFile = snapshotToDashFile(snapshot, currentDashFile.settings);
  
  // For each tile, preserve existing meta from dashFile if available
  // This ensures content references aren't lost during layout changes
  for (const tile of newDashFile.tiles) {
    const existingTile = currentDashFile.tiles.find(t => t.id === tile.id);
    if (existingTile?.meta) {
      tile.meta = existingTile.meta;
    } else if (!tile.meta) {
      tile.meta = { widgetType: 'empty' };
    }
  }
  
  onUpdate(newDashFile);
}

/**
 * Merge tile metadata from source to destination.
 * Used when layout changes to preserve content references.
 * 
 * @param destTiles - Destination tiles (from snapshot)
 * @param srcTiles - Source tiles (current dash file)
 * @returns Merged tiles with preserved metadata
 */
export function mergeTileMetadata(
  destTiles: DashTile[],
  srcTiles: DashTile[]
): DashTile[] {
  return destTiles.map(tile => {
    const existingTile = srcTiles.find(t => t.id === tile.id);
    if (existingTile?.meta) {
      return { ...tile, meta: existingTile.meta };
    }
    if (!tile.meta) {
      return { ...tile, meta: { widgetType: 'empty' } };
    }
    return tile;
  });
}

/**
 * Check if two tile arrays have the same layout (ignoring metadata).
 * Useful for determining if a re-render is needed.
 */
export function hasSameLayout(tilesA: DashTile[], tilesB: DashTile[]): boolean {
  if (tilesA.length !== tilesB.length) return false;
  
  for (const tileA of tilesA) {
    const tileB = tilesB.find(t => t.id === tileA.id);
    if (!tileB) return false;
    
    if (
      tileA.x !== tileB.x ||
      tileA.y !== tileB.y ||
      tileA.width !== tileB.width ||
      tileA.height !== tileB.height
    ) {
      return false;
    }
  }
  
  return true;
}

