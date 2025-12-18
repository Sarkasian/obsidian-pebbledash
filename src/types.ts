import type { TileId, SnapshotV1, Snapshot, TileSnapshot, PartialExtendedConfig, TileConstraints } from '@pebbledash/core';

// Re-export snapshot types from @pebbledash/core
export type { Snapshot, SnapshotV1, TileSnapshot };

/**
 * Tile metadata specific to obsidian-pebbledash.
 * Extends Record<string, unknown> for compatibility with pebbledash's TileSnapshot.meta
 */
export interface ObsidianTileMeta {
  /** Widget type for rendering this tile */
  widgetType: WidgetType;
  /** Reference to content (file path, embed syntax, etc.) */
  contentRef?: string;
  /** Whether to show the tile header */
  showHeader?: boolean;
  /** Link click behavior override */
  linkBehavior?: LinkBehavior;
  /** Content overflow behavior override */
  scrollBehavior?: ScrollBehavior;
  /** Interaction mode override for this tile */
  interactionMode?: InteractionMode;
  /** Custom background color/style */
  background?: string;
  /** Custom padding */
  padding?: string;
  /** Whether nested dashboards should appear seamless (no border/padding) */
  seamlessNested?: boolean;
  /** Whether to show the embed link button (maximize icon) */
  showEmbedLink?: boolean;
  /** Index signature for compatibility with Record<string, unknown> */
  [key: string]: unknown;
}

/**
 * Built-in widget types
 * 
 * Note: .dash files are rendered via the embedRegistry (registered in main.ts),
 * so they work automatically with the 'embedded' widget type.
 */
export type WidgetType = 
  | 'empty'
  | 'embedded';  // Uses Obsidian's embedRegistry (supports all file types including .dash)

/**
 * Link click behavior options
 */
export type LinkBehavior = 
  | 'new-tab'
  | 'replace-dashboard'
  | 'replace-tile';

/**
 * Content overflow behavior options
 */
export type ScrollBehavior = 
  | 'scroll'
  | 'clip'
  | 'fit';

/**
 * Interaction mode for tile content
 * - 'always': Links and editing always work
 * - 'double-click': Must double-click to enable interaction
 * - 'never': Pure view mode, no interaction
 */
export type InteractionMode = 
  | 'always'
  | 'double-click'
  | 'never';

/**
 * Dashboard-level settings stored in .dash file
 */
export interface DashboardSettings {
  /** CSS class to apply to dashboard container */
  cssclass?: string;
  /** Gap between tiles in pixels */
  gutter?: number;
  /** Border configuration */
  border?: {
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted' | 'none';
    color?: string;
  };
  /** Animation configuration */
  animation?: {
    enabled?: boolean;
    duration?: number;
  };
  /** Default link behavior for this dashboard */
  linkBehavior?: LinkBehavior;
  /** Default header visibility for this dashboard */
  showHeaders?: boolean;
  /** Default scroll behavior for this dashboard */
  scrollBehavior?: ScrollBehavior;
  /** Default interaction mode for this dashboard */
  interactionMode?: InteractionMode;
  /** Whether nested dashboards should appear seamless by default */
  seamlessNested?: boolean;
  /** Whether to show the embed link button (maximize icon) by default */
  showEmbedLink?: boolean;
  /** Whether to redistribute equally when using Shift+drag */
  redistributeEqually?: boolean;
}

/**
 * Complete .dash file structure
 */
export interface DashFile {
  /** Dashboard-level settings */
  settings?: DashboardSettings;
  /** Pebbledash snapshot version */
  version: 1;
  /** Tile definitions */
  tiles: DashTile[];
}

/**
 * Tile definition in .dash file (extends pebbledash TileSnapshot)
 */
export interface DashTile {
  /** Tile unique identifier */
  id: TileId;
  /** X position (0-100 percent) */
  x: number;
  /** Y position (0-100 percent) */
  y: number;
  /** Width (0-100 percent) */
  width: number;
  /** Height (0-100 percent) */
  height: number;
  /** Whether tile is locked */
  locked?: boolean;
  /** Tile metadata with obsidian-specific fields */
  meta?: ObsidianTileMeta;
  /** Per-tile constraint overrides */
  constraints?: TileConstraints;
}

/**
 * Plugin settings (vault-level defaults)
 */
export interface PebbledashSettings {
  /** Minimum tile width (%) */
  minTileWidth: number;
  /** Minimum tile height (%) */
  minTileHeight: number;
  /** Maximum tile width (%) */
  maxTileWidth: number;
  /** Maximum tile height (%) */
  maxTileHeight: number;
  /** Gap between tiles (px) */
  gutter: number;
  /** Border width (px) */
  borderWidth: number;
  /** Border style */
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  /** Border color */
  borderColor: string;
  /** Show tile headers by default */
  showHeaders: boolean;
  /** Default scroll behavior */
  scrollBehavior: ScrollBehavior;
  /** Default link behavior */
  linkBehavior: LinkBehavior;
  /** Interaction mode for tile content */
  interactionMode: InteractionMode;
  /** Enable animations */
  animationEnabled: boolean;
  /** Animation duration (ms) */
  animationDuration: number;
  /** Whether nested dashboards should appear seamless by default */
  seamlessNested: boolean;
  /** Whether to show the embed link button (maximize icon) by default */
  showEmbedLink: boolean;
  /** Whether to redistribute equally when using Shift+drag (applies to all tiles proportionally) */
  redistributeEqually: boolean;
  /** CSS selectors for interactive elements that should receive clicks in the embedded content */
  interactiveSelectors: string;
}

/**
 * Dashboard mode
 */
export type DashboardMode = 'view' | 'edit';

/**
 * Edit sub-mode
 */
export type EditSubMode = 'insert' | 'resize';

/**
 * Re-export pebbledash types for convenience
 */
export type { TileId, PartialExtendedConfig, TileConstraints };

