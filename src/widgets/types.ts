import type { App, Component } from 'obsidian';
import type { TileId, ObsidianTileMeta, PebbledashSettings, DashboardSettings } from '../types';
import type { EffectiveTileSettings } from '../settingsResolver';

/**
 * Context passed to widget factories
 */
export interface WidgetContext {
  /** Unique tile identifier */
  tileId: TileId;
  /** DOM element to render widget content into */
  element: HTMLElement;
  /** Tile metadata containing content reference and settings */
  meta: ObsidianTileMeta;
  /** Obsidian App instance */
  app: App;
  /** Parent Obsidian component for lifecycle management */
  component: Component;
  /** Plugin settings (vault-level defaults) */
  settings: PebbledashSettings;
  /** Dashboard-level settings (optional) */
  dashboardSettings?: DashboardSettings;
  /** Resolved effective settings for this tile (vault → dashboard → tile cascade) */
  effectiveSettings: EffectiveTileSettings;
  /** Callback to request tile content change */
  onContentChange?: (contentRef: string) => void;
}

/**
 * Widget instance returned by factory
 */
export interface Widget {
  /** Mount the widget - render initial content */
  mount(): void | Promise<void>;
  /** Unmount the widget - clean up resources */
  unmount(): void;
  /** Update the widget with new metadata (optional) */
  update?(newMeta: ObsidianTileMeta): void | Promise<void>;
  /** Set locked/editing state (optional - for editable widgets) */
  setLocked?(locked: boolean): void;
  /** Toggle locked/editing state (optional - for editable widgets) */
  toggleLocked?(): void;
  /** Check if widget is locked (optional - for editable widgets) */
  isLocked?(): boolean;
}

/**
 * Factory function to create widget instances
 */
export type WidgetFactory = (ctx: WidgetContext) => Widget;

/**
 * Registry of widget factories by type
 */
export type WidgetRegistry = Record<string, WidgetFactory>;

