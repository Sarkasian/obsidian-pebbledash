/**
 * Centralized setting definitions for DRY configuration.
 * 
 * This file defines all settings in one place, avoiding duplication across:
 * - Plugin settings tab (settings.ts)
 * - Dashboard settings modal (DashboardSettingsModal.ts)
 * - Tile settings modal (TileSettingsModal.ts)
 */

import type { LinkBehavior, ScrollBehavior, InteractionMode } from './types';

/**
 * Generic setting definition
 */
export interface SettingDefinition<T> {
  /** Setting name (displayed to user) */
  name: string;
  /** Description of what the setting does */
  description: string;
  /** Default value */
  defaultValue: T;
}

/**
 * Numeric setting with range constraints
 */
export interface NumericSettingDefinition extends SettingDefinition<number> {
  type: 'number';
  min: number;
  max: number;
  step: number;
}

/**
 * Boolean toggle setting
 */
export interface BooleanSettingDefinition extends SettingDefinition<boolean> {
  type: 'boolean';
}

/**
 * Dropdown setting with predefined options
 */
export interface DropdownSettingDefinition<T extends string> extends SettingDefinition<T> {
  type: 'dropdown';
  options: Array<{ value: T; label: string }>;
}

/**
 * Text input setting
 */
export interface TextSettingDefinition extends SettingDefinition<string> {
  type: 'text';
  placeholder?: string;
}

// ============================================
// Layout Settings
// ============================================

export const MIN_TILE_WIDTH: NumericSettingDefinition = {
  type: 'number',
  name: 'Minimum tile width',
  description: 'Minimum width for tiles as a percentage',
  defaultValue: 10,
  min: 1,
  max: 50,
  step: 1,
};

export const MIN_TILE_HEIGHT: NumericSettingDefinition = {
  type: 'number',
  name: 'Minimum tile height',
  description: 'Minimum height for tiles as a percentage',
  defaultValue: 10,
  min: 1,
  max: 50,
  step: 1,
};

export const MAX_TILE_WIDTH: NumericSettingDefinition = {
  type: 'number',
  name: 'Maximum tile width',
  description: 'Maximum width for tiles as a percentage',
  defaultValue: 100,
  min: 50,
  max: 100,
  step: 5,
};

export const MAX_TILE_HEIGHT: NumericSettingDefinition = {
  type: 'number',
  name: 'Maximum tile height',
  description: 'Maximum height for tiles as a percentage',
  defaultValue: 100,
  min: 50,
  max: 100,
  step: 5,
};

export const GUTTER: NumericSettingDefinition = {
  type: 'number',
  name: 'Gutter',
  description: 'Gap between tiles in pixels',
  defaultValue: 4,
  min: 0,
  max: 20,
  step: 1,
};

// ============================================
// Border Settings
// ============================================

export const BORDER_WIDTH: NumericSettingDefinition = {
  type: 'number',
  name: 'Border width',
  description: 'Tile border width in pixels',
  defaultValue: 1,
  min: 0,
  max: 5,
  step: 1,
};

export const BORDER_STYLE: DropdownSettingDefinition<'solid' | 'dashed' | 'dotted' | 'none'> = {
  type: 'dropdown',
  name: 'Border style',
  description: 'Style of tile borders',
  defaultValue: 'solid',
  options: [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'none', label: 'None' },
  ],
};

export const BORDER_COLOR: TextSettingDefinition = {
  type: 'text',
  name: 'Border color',
  description: 'Color of tile borders (CSS color value)',
  defaultValue: 'var(--background-modifier-border)',
  placeholder: 'var(--background-modifier-border)',
};

// ============================================
// Behavior Settings
// ============================================

export const SHOW_HEADERS: BooleanSettingDefinition = {
  type: 'boolean',
  name: 'Show tile headers',
  description: 'Show headers with title on tiles by default',
  defaultValue: true,
};

export const SHOW_EMBED_LINK: BooleanSettingDefinition = {
  type: 'boolean',
  name: 'Show embed link button',
  description: 'Show the "Open link" button (maximize icon) on embedded content',
  defaultValue: false,
};

export const SCROLL_BEHAVIOR: DropdownSettingDefinition<ScrollBehavior> = {
  type: 'dropdown',
  name: 'Content overflow',
  description: 'How to handle content that exceeds tile size',
  defaultValue: 'clip',
  options: [
    { value: 'scroll', label: 'Scroll' },
    { value: 'clip', label: 'Clip (hide overflow)' },
    { value: 'fit', label: 'Fit (scale to fit)' },
  ],
};

export const LINK_BEHAVIOR: DropdownSettingDefinition<LinkBehavior> = {
  type: 'dropdown',
  name: 'Link behavior',
  description: 'What happens when clicking links inside tiles',
  defaultValue: 'new-tab',
  options: [
    { value: 'new-tab', label: 'Open in new tab' },
    { value: 'replace-dashboard', label: 'Navigate away from dashboard' },
    { value: 'replace-tile', label: 'Replace tile content' },
  ],
};

export const INTERACTION_MODE: DropdownSettingDefinition<InteractionMode> = {
  type: 'dropdown',
  name: 'Content interaction',
  description: 'When to allow interacting with tile content (links, editing)',
  defaultValue: 'double-click',
  options: [
    { value: 'always', label: 'Always' },
    { value: 'double-click', label: 'After double-clicking tile' },
    { value: 'never', label: 'Never (view only)' },
  ],
};

// ============================================
// Animation Settings
// ============================================

export const ANIMATION_ENABLED: BooleanSettingDefinition = {
  type: 'boolean',
  name: 'Enable animations',
  description: 'Animate tile transitions',
  defaultValue: true,
};

export const ANIMATION_DURATION: NumericSettingDefinition = {
  type: 'number',
  name: 'Animation duration',
  description: 'Duration of animations in milliseconds',
  defaultValue: 200,
  min: 0,
  max: 500,
  step: 50,
};

// ============================================
// Nested Dashboard Settings
// ============================================

export const SEAMLESS_NESTED: BooleanSettingDefinition = {
  type: 'boolean',
  name: 'Seamless nested dashboards',
  description: 'Make nested dashboards blend seamlessly into parent (no border/padding)',
  defaultValue: false,
};

// ============================================
// Resize Settings
// ============================================

export const REDISTRIBUTE_EQUALLY: BooleanSettingDefinition = {
  type: 'boolean',
  name: 'Redistribute equally',
  description: 'When using Shift+drag to redistribute tiles, shrink all affected tiles proportionally instead of shrinking first tile to minimum',
  defaultValue: false,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Format the inherited value description for modal settings
 */
export function formatInheritedDesc(
  settingName: string,
  dashboardValue: unknown,
  vaultValue: unknown
): string {
  if (dashboardValue !== undefined) {
    return `Inherited from dashboard: ${formatValue(dashboardValue)}`;
  }
  return `Inherited from vault: ${formatValue(vaultValue)}`;
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'on' : 'off';
  }
  return String(value);
}

/**
 * Get the effective inherited value (dashboard takes precedence over vault)
 */
export function getInheritedValue<T>(dashboardValue: T | undefined, vaultValue: T): T {
  return dashboardValue ?? vaultValue;
}

/**
 * Format vault default description for settings
 */
export function vaultDefaultDesc(setting: SettingDefinition<unknown>, vaultValue?: unknown): string {
  const value = vaultValue ?? setting.defaultValue;
  return `${setting.description} (vault default: ${formatValue(value)})`;
}

// ============================================
// Grouped Exports for Easy Import
// ============================================

export const LAYOUT_SETTINGS = {
  minTileWidth: MIN_TILE_WIDTH,
  minTileHeight: MIN_TILE_HEIGHT,
  maxTileWidth: MAX_TILE_WIDTH,
  maxTileHeight: MAX_TILE_HEIGHT,
  gutter: GUTTER,
} as const;

export const BORDER_SETTINGS = {
  width: BORDER_WIDTH,
  style: BORDER_STYLE,
  color: BORDER_COLOR,
} as const;

export const BEHAVIOR_SETTINGS = {
  showHeaders: SHOW_HEADERS,
  showEmbedLink: SHOW_EMBED_LINK,
  scrollBehavior: SCROLL_BEHAVIOR,
  linkBehavior: LINK_BEHAVIOR,
  interactionMode: INTERACTION_MODE,
} as const;

export const ANIMATION_SETTINGS = {
  enabled: ANIMATION_ENABLED,
  duration: ANIMATION_DURATION,
} as const;

export const ALL_SETTINGS = {
  ...LAYOUT_SETTINGS,
  ...BORDER_SETTINGS,
  ...BEHAVIOR_SETTINGS,
  ...ANIMATION_SETTINGS,
  seamlessNested: SEAMLESS_NESTED,
  redistributeEqually: REDISTRIBUTE_EQUALLY,
} as const;

