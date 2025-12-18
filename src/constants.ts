import type { PebbledashSettings } from './types';
import { DEFAULT_INTERACTIVE_SELECTORS } from './settingDefinitions';

/**
 * Plugin ID
 */
export const PLUGIN_ID = 'obsidian-pebbledash';

/**
 * Dashboard file extension
 */
export const DASH_EXTENSION = 'dash';

/**
 * View type for dashboard files
 */
export const DASHBOARD_VIEW_TYPE = 'pebbledash-dashboard-view';

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS: PebbledashSettings = {
  minTileWidth: 10,
  minTileHeight: 10,
  maxTileWidth: 100,
  maxTileHeight: 100,
  gutter: 4,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--background-modifier-border)',
  showHeaders: true,
  scrollBehavior: 'clip',  // Default to clip, not scroll
  linkBehavior: 'new-tab',
  interactionMode: 'double-click',  // Default to double-click to interact
  animationEnabled: true,
  animationDuration: 200,
  seamlessNested: true,  // Nested dashboards have borders by default
  showEmbedLink: false,  // Hide embed link button by default
  redistributeEqually: false,  // First tile shrinks to minimum before chain continues
  interactiveSelectors: DEFAULT_INTERACTIVE_SELECTORS, // CSS selectors for interactive elements in embeds
};

/**
 * CSS class names used in JavaScript code.
 * 
 * These classes are actively referenced in code. Additional classes
 * may exist in styles.css for pure CSS styling purposes.
 */
export const CSS = {
  // Container classes - used to style view/edit modes
  container: 'pebbledash-container',
  containerViewMode: 'pebbledash-view-mode',
  containerEditMode: 'pebbledash-edit-mode',
  
  // Tile header classes - used by widget helpers
  tileHeader: 'pebbledash-tile-header',
  tileHeaderTitle: 'pebbledash-tile-header-title',
  tileHeaderActions: 'pebbledash-tile-header-actions',
  
  // Widget classes - used for widget containers
  widget: 'pebbledash-widget',
  widgetEmpty: 'pebbledash-widget-empty',
  widgetError: 'pebbledash-widget-error',
} as const;

/**
 * CSS class names from @pebbledash/renderer-dom.
 * These are used in styles.css to style pebbledash elements.
 * Listed here for documentation purposes.
 */
export const PEBBLEDASH_CSS = {
  tile: 'ud-tile',
  edge: 'ud-edge',
  edgeVertical: 'ud-edge-vertical',
  edgeHorizontal: 'ud-edge-horizontal',
  boundary: 'ud-boundary',
} as const;

/**
 * CSS custom properties (variables) used for theming and layout.
 * These are defined in styles.css and can be overridden by themes/snippets.
 * 
 * Layout variables (set dynamically via settingsResolver.ts):
 * - --pebbledash-gutter: Gap between tiles (px)
 * - --pebbledash-border-width: Tile border width (px)
 * - --pebbledash-border-style: Tile border style
 * - --pebbledash-border-color: Tile border color
 * - --pebbledash-animation-duration: Transition animation duration (ms)
 * 
 * Spacing variables (internal):
 * - --pebbledash-content-padding: Default content padding
 * - --pebbledash-header-padding: Header padding
 * - --pebbledash-border-radius: Tile border radius
 * 
 * Z-index layering (internal):
 * - --pebbledash-z-edge: Edge overlays (10)
 * - --pebbledash-z-boundary: Boundary highlights (12)
 * - --pebbledash-z-overlay: General overlays (20)
 * - --pebbledash-z-editing-indicator: Editing state indicator (60)
 * - --pebbledash-z-toolbar: Edit mode toolbar (100)
 */
export const CSS_VARIABLES = {
  gutter: '--pebbledash-gutter',
  borderWidth: '--pebbledash-border-width',
  borderStyle: '--pebbledash-border-style',
  borderColor: '--pebbledash-border-color',
  animationDuration: '--pebbledash-animation-duration',
} as const;

