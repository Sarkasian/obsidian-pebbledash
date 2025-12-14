/**
 * Settings resolution functions for the three-tier cascade:
 * Vault defaults → Dashboard defaults → Tile overrides
 * 
 * See SETTINGS.md for complete documentation.
 */

import type {
  PebbledashSettings,
  DashboardSettings,
  ObsidianTileMeta,
  LinkBehavior,
  ScrollBehavior,
  WidgetType,
  InteractionMode,
} from './types';
import type { PartialExtendedConfig } from '@pebbledash/core';

/**
 * Effective settings resolved for a specific tile.
 * All values are guaranteed to be defined (no undefined).
 */
export interface EffectiveTileSettings {
  /** Whether to show the tile header */
  showHeader: boolean;
  /** Link click behavior */
  linkBehavior: LinkBehavior;
  /** Content overflow behavior */
  scrollBehavior: ScrollBehavior;
  /** Interaction mode for tile content */
  interactionMode: InteractionMode;
  /** Custom background CSS */
  background?: string;
  /** Custom padding CSS */
  padding?: string;
  /** Widget type for rendering */
  widgetType: WidgetType;
  /** Content reference (file path, embed syntax) */
  contentRef?: string;
  /** Whether nested dashboards should appear seamless */
  seamlessNested: boolean;
  /** Whether to show the embed link button (maximize icon) */
  showEmbedLink: boolean;
}

/**
 * Effective dashboard-level config (vault + dashboard cascade).
 * Used for configuring pebbledash core and CSS variables.
 */
export interface EffectiveDashboardConfig {
  /** Minimum tile dimensions (%) - structured for pebbledash core */
  minTile: { width: number; height: number };
  /** Maximum tile dimensions (%) */
  maxTileWidth: number;
  maxTileHeight: number;
  /** Gap between tiles (px) */
  gutter: number;
  /** Border configuration */
  border: {
    width: number;
    style: 'solid' | 'dashed' | 'dotted' | 'none';
    color: string;
  };
  /** Animation configuration */
  animation: {
    enabled: boolean;
    duration: number;
  };
  /** Default show headers for this dashboard */
  showHeaders: boolean;
  /** Default link behavior for this dashboard */
  linkBehavior: LinkBehavior;
  /** Default scroll behavior for this dashboard */
  scrollBehavior: ScrollBehavior;
  /** Default seamless nested dashboards for this dashboard */
  seamlessNested: boolean;
  /** Default show embed link button for this dashboard */
  showEmbedLink: boolean;
  /** Whether to redistribute equally when using Shift+drag */
  redistributeEqually: boolean;
  /** CSS class for dashboard container */
  cssclass?: string;
}

/**
 * Resolve effective tile settings by cascading:
 * tile meta → dashboard settings → vault settings
 * 
 * @param vaultSettings - Vault-level plugin settings (always complete)
 * @param dashboardSettings - Dashboard-level settings (optional, sparse)
 * @param tileMeta - Tile-level metadata (optional, sparse)
 * @returns Complete effective settings for the tile
 */
export function resolveEffectiveTileSettings(
  vaultSettings: PebbledashSettings,
  dashboardSettings: DashboardSettings | undefined,
  tileMeta: ObsidianTileMeta | undefined
): EffectiveTileSettings {
  return {
    // Cascade: tile → dashboard → vault
    showHeader: tileMeta?.showHeader
      ?? dashboardSettings?.showHeaders
      ?? vaultSettings.showHeaders,

    linkBehavior: tileMeta?.linkBehavior
      ?? dashboardSettings?.linkBehavior
      ?? vaultSettings.linkBehavior,

    scrollBehavior: tileMeta?.scrollBehavior
      ?? dashboardSettings?.scrollBehavior
      ?? vaultSettings.scrollBehavior,

    interactionMode: tileMeta?.interactionMode
      ?? dashboardSettings?.interactionMode
      ?? vaultSettings.interactionMode,

    seamlessNested: tileMeta?.seamlessNested
      ?? dashboardSettings?.seamlessNested
      ?? vaultSettings.seamlessNested,

    showEmbedLink: tileMeta?.showEmbedLink
      ?? dashboardSettings?.showEmbedLink
      ?? vaultSettings.showEmbedLink,

    // Tile-only settings (no cascade from higher levels)
    background: tileMeta?.background,
    padding: tileMeta?.padding,
    widgetType: tileMeta?.widgetType ?? 'empty',
    contentRef: tileMeta?.contentRef,
  };
}

/**
 * Resolve effective dashboard config by cascading:
 * dashboard settings → vault settings
 * 
 * @param vaultSettings - Vault-level plugin settings (always complete)
 * @param dashboardSettings - Dashboard-level settings (optional, sparse)
 * @returns Complete effective config for the dashboard
 */
export function resolveEffectiveDashboardConfig(
  vaultSettings: PebbledashSettings,
  dashboardSettings: DashboardSettings | undefined
): EffectiveDashboardConfig {
  return {
    // Layout (vault only, no dashboard override for min/max tile size)
    minTile: {
      width: vaultSettings.minTileWidth,
      height: vaultSettings.minTileHeight,
    },
    maxTileWidth: vaultSettings.maxTileWidth,
    maxTileHeight: vaultSettings.maxTileHeight,

    // Gutter (dashboard can override)
    gutter: dashboardSettings?.gutter ?? vaultSettings.gutter,

    // Border (dashboard can override individual properties)
    border: {
      width: dashboardSettings?.border?.width ?? vaultSettings.borderWidth,
      style: dashboardSettings?.border?.style ?? vaultSettings.borderStyle,
      color: dashboardSettings?.border?.color ?? vaultSettings.borderColor,
    },

    // Animation (dashboard can override individual properties)
    animation: {
      enabled: dashboardSettings?.animation?.enabled ?? vaultSettings.animationEnabled,
      duration: dashboardSettings?.animation?.duration ?? vaultSettings.animationDuration,
    },

    // Behavior defaults (dashboard can override)
    showHeaders: dashboardSettings?.showHeaders ?? vaultSettings.showHeaders,
    linkBehavior: dashboardSettings?.linkBehavior ?? vaultSettings.linkBehavior,
    scrollBehavior: dashboardSettings?.scrollBehavior ?? vaultSettings.scrollBehavior,
    seamlessNested: dashboardSettings?.seamlessNested ?? vaultSettings.seamlessNested,
    showEmbedLink: dashboardSettings?.showEmbedLink ?? vaultSettings.showEmbedLink,
    redistributeEqually: dashboardSettings?.redistributeEqually ?? vaultSettings.redistributeEqually,

    // Dashboard-only settings
    cssclass: dashboardSettings?.cssclass,
  };
}

/**
 * Build pebbledash core config from resolved dashboard config.
 * Maps obsidian-pebbledash settings to @pebbledash/core ExtendedConfig format.
 * 
 * @param vaultSettings - Vault-level plugin settings
 * @param dashboardSettings - Dashboard-level settings (optional)
 * @returns Partial config for pebbledash core
 */
export function buildCoreConfig(
  vaultSettings: PebbledashSettings,
  dashboardSettings: DashboardSettings | undefined
): PartialExtendedConfig {
  const config = resolveEffectiveDashboardConfig(vaultSettings, dashboardSettings);

  return {
    minTile: config.minTile,
    gutter: config.gutter,
    border: {
      width: config.border.width,
      style: config.border.style,
      color: config.border.color,
    },
    animation: {
      enabled: config.animation.enabled,
      duration: config.animation.duration,
      easing: 'ease-out', // Core default
    },
    tileDefaults: {
      minWidth: config.minTile.width,
      minHeight: config.minTile.height,
      maxWidth: config.maxTileWidth,
      maxHeight: config.maxTileHeight,
    },
  };
}

/**
 * Apply CSS variables to a dashboard container based on resolved config.
 * These variables are used by styles.css for visual consistency.
 * 
 * Note: This function is intentionally kept in obsidian-pebbledash rather than
 * @pebbledash/renderer-dom because:
 * 1. These CSS variables are specific to the Obsidian plugin's settings cascade
 * 2. The variable names (--pebbledash-*) are application-specific
 * 3. The renderer-dom has its own CSS variable system (--ud-*) for core theming
 * 
 * Consumer applications should define their own CSS variable bridges based on
 * their settings systems.
 * 
 * @param container - Dashboard container element
 * @param config - Resolved dashboard config
 */
export function applyCssVariables(
  container: HTMLElement,
  config: EffectiveDashboardConfig
): void {
  container.style.setProperty('--pebbledash-gutter', `${config.gutter}px`);
  container.style.setProperty('--pebbledash-border-width', `${config.border.width}px`);
  container.style.setProperty('--pebbledash-border-style', config.border.style);
  container.style.setProperty('--pebbledash-border-color', config.border.color);
  
  // Set animation duration to 0 when animations are disabled
  const animationDuration = config.animation.enabled ? config.animation.duration : 0;
  container.style.setProperty('--pebbledash-animation-duration', `${animationDuration}ms`);

  // Add cssclass if specified
  if (config.cssclass) {
    container.classList.add(config.cssclass);
  }
}

/**
 * Apply tile-specific styles (background, padding) to a widget container.
 * 
 * @param element - Widget container element
 * @param settings - Effective tile settings
 */
export function applyTileStyles(
  element: HTMLElement,
  settings: EffectiveTileSettings
): void {
  if (settings.background) {
    element.style.background = settings.background;
  }
  if (settings.padding) {
    element.style.padding = settings.padding;
  }
}

/**
 * Get the CSS overflow value for a scroll behavior setting.
 * 
 * @param scrollBehavior - The scroll behavior setting
 * @returns CSS overflow value
 */
export function getOverflowStyle(scrollBehavior: ScrollBehavior): string {
  switch (scrollBehavior) {
    case 'scroll':
      return 'auto';
    case 'clip':
      return 'hidden';
    case 'fit':
      return 'hidden'; // fit uses object-fit: contain instead
    default:
      return 'hidden';
  }
}

// Note: createTileHeader has been moved to widgets/helpers.ts
// Re-export for backwards compatibility
export { createTileHeader } from './widgets/helpers';
