/**
 * YAML Adapter for Dashboard Files
 * 
 * This module handles serialization/deserialization of .dash files
 * and conversion between the plugin's DashFile format and pebbledash's Snapshot format.
 * 
 * @module yamlAdapter
 */

import * as yaml from 'js-yaml';
import type { Vault, TFile } from 'obsidian';
import type { DashFile, DashTile } from './types';
import type { Snapshot, SnapshotV2, TileSnapshot } from '@pebbledash/core';

/**
 * Parse a .dash file content string into a DashFile object.
 * 
 * Handles malformed or empty content gracefully by returning an empty dashboard.
 * 
 * @param content - The YAML string content of a .dash file
 * @returns Parsed DashFile object with guaranteed structure
 * 
 * @example
 * ```ts
 * const content = await vault.read(file);
 * const dashFile = parseDashFile(content);
 * console.log(dashFile.tiles.length);
 * ```
 */
export function parseDashFile(content: string): DashFile {
  const parsed = yaml.load(content) as DashFile;
  
  // Ensure we have a valid structure
  if (!parsed || typeof parsed !== 'object') {
    return createEmptyDashFile();
  }
  
  // Ensure version is set
  if (!parsed.version) {
    parsed.version = 2;
  }
  
  // Ensure tiles array exists
  if (!Array.isArray(parsed.tiles)) {
    parsed.tiles = [];
  }
  
  return parsed;
}

/**
 * Serialize a DashFile object to a YAML string.
 * 
 * @param dashFile - The dashboard file object to serialize
 * @returns YAML string representation suitable for saving to a .dash file
 * 
 * @example
 * ```ts
 * const yaml = serializeDashFile(dashFile);
 * await vault.modify(file, yaml);
 * ```
 */
export function serializeDashFile(dashFile: DashFile): string {
  return yaml.dump(dashFile, {
    indent: 2,
    lineWidth: -1, // Don't wrap lines
    noRefs: true,  // Don't use YAML references
    sortKeys: false,
  });
}

/**
 * Create an empty dashboard file structure with a single full-size empty tile.
 * 
 * @returns A new DashFile with default structure
 * 
 * @example
 * ```ts
 * const newDash = createEmptyDashFile();
 * // newDash has version 2 and one 100x100 empty tile
 * ```
 */
export function createEmptyDashFile(): DashFile {
  return {
    version: 2,
    tiles: [
      {
        id: 'tile-1' as any,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        meta: {
          widgetType: 'empty',
        },
      },
    ],
  };
}

/**
 * Convert a DashFile to pebbledash's SnapshotV2 format.
 * 
 * This is used when initializing the pebbledash model from a loaded dashboard file.
 * The snapshot can be passed to `DashboardModel.restoreSnapshot()`.
 * 
 * @param dashFile - The dashboard file to convert
 * @returns A SnapshotV2 object compatible with pebbledash
 * 
 * @example
 * ```ts
 * const dashFile = await loadDashFile(vault, file);
 * const snapshot = dashFileToSnapshot(dashFile);
 * await model.restoreSnapshot(snapshot);
 * ```
 */
export function dashFileToSnapshot(dashFile: DashFile): SnapshotV2 {
  // Build settings object, only including fields that are fully specified
  let settings: SnapshotV2['settings'] = undefined;
  if (dashFile.settings) {
    const s = dashFile.settings;
    settings = {};
    
    if (s.gutter !== undefined) {
      settings.gutter = s.gutter;
    }
    
    // Only include border if all required fields are present
    if (s.border && s.border.width !== undefined && s.border.style && s.border.color) {
      settings.border = {
        width: s.border.width,
        style: s.border.style,
        color: s.border.color,
      };
    }
    
    // Only include animation if all required fields are present
    if (s.animation && s.animation.enabled !== undefined && s.animation.duration !== undefined) {
      settings.animation = {
        enabled: s.animation.enabled,
        duration: s.animation.duration,
        easing: 'ease-out', // Default easing since DashboardSettings doesn't include it
      };
    }
    
    // If no settings were actually set, don't include the settings object
    if (Object.keys(settings).length === 0) {
      settings = undefined;
    }
  }

  return {
    version: 2,
    tiles: dashFile.tiles.map(tile => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      locked: tile.locked,
      meta: tile.meta as Record<string, unknown>,
      constraints: tile.constraints,
    })),
    settings,
  };
}

/**
 * Convert a pebbledash Snapshot to DashFile format.
 * 
 * This is used when saving the current model state back to a .dash file.
 * Existing dashboard settings can be preserved by passing them.
 * 
 * @param snapshot - The pebbledash snapshot to convert
 * @param existingSettings - Optional existing dashboard settings to preserve
 * @returns A DashFile object ready for serialization
 * 
 * @example
 * ```ts
 * const snapshot = model.createSnapshot();
 * const dashFile = snapshotToDashFile(snapshot, currentDashFile.settings);
 * await saveDashFile(vault, file, dashFile);
 * ```
 */
export function snapshotToDashFile(
  snapshot: Snapshot,
  existingSettings?: DashFile['settings']
): DashFile {
  const tiles = snapshot.tiles.map((tile: TileSnapshot) => ({
    id: tile.id,
    x: tile.x,
    y: tile.y,
    width: tile.width,
    height: tile.height,
    locked: tile.locked,
    meta: tile.meta as DashTile['meta'],
    constraints: tile.constraints,
  }));

  return {
    settings: existingSettings,
    version: 2,
    tiles,
  };
}

/**
 * Load and parse a dashboard file from the Obsidian vault.
 * 
 * @param vault - The Obsidian vault instance
 * @param file - The TFile reference to the .dash file
 * @returns Promise resolving to the parsed DashFile
 * @throws If the file cannot be read
 * 
 * @example
 * ```ts
 * const dashFile = await loadDashFile(this.app.vault, file);
 * ```
 */
export async function loadDashFile(vault: Vault, file: TFile): Promise<DashFile> {
  const content = await vault.read(file);
  return parseDashFile(content);
}

/**
 * Save a dashboard file to the Obsidian vault.
 * 
 * @param vault - The Obsidian vault instance
 * @param file - The TFile reference to save to
 * @param dashFile - The dashboard data to save
 * @throws If the file cannot be written
 * 
 * @example
 * ```ts
 * await saveDashFile(this.app.vault, file, dashFile);
 * ```
 */
export async function saveDashFile(
  vault: Vault,
  file: TFile,
  dashFile: DashFile
): Promise<void> {
  const content = serializeDashFile(dashFile);
  await vault.modify(file, content);
}

/**
 * Create a new dashboard file in the Obsidian vault.
 * 
 * Creates a new .dash file with an empty dashboard structure.
 * 
 * @param vault - The Obsidian vault instance
 * @param path - The path where the file should be created (including .dash extension)
 * @returns Promise resolving to the created TFile
 * @throws If the file cannot be created (e.g., already exists, invalid path)
 * 
 * @example
 * ```ts
 * const file = await createDashFile(this.app.vault, 'Dashboards/my-dashboard.dash');
 * ```
 */
export async function createDashFile(
  vault: Vault,
  path: string
): Promise<TFile> {
  const dashFile = createEmptyDashFile();
  const content = serializeDashFile(dashFile);
  return await vault.create(path, content);
}
