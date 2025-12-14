import type { WidgetRegistry, WidgetFactory } from './types';
import { createEmptyWidget } from './EmptyWidget';
import { createEmbeddedLeafWidget } from './EmbeddedLeafWidget';

export type { Widget, WidgetContext, WidgetFactory, WidgetRegistry } from './types';
export { createEmbeddedLeafWidget } from './EmbeddedLeafWidget';
export { createTileHeader, getFilenameWithoutExtension, getFileExtension } from './helpers';

/**
 * Built-in widget factories
 * 
 * 'embedded' - Uses Obsidian's native embedRegistry to render any file type.
 *              This includes .dash files via the custom embed factory registered in main.ts.
 * 'empty' - Placeholder widget for tiles without content
 */
export const builtInWidgets: WidgetRegistry = {
  empty: createEmptyWidget,
  embedded: createEmbeddedLeafWidget,
};

/**
 * Create a widget registry with built-in widgets and any custom widgets
 */
export function createWidgetRegistry(customWidgets?: WidgetRegistry): WidgetRegistry {
  return {
    ...builtInWidgets,
    ...customWidgets,
  };
}

/**
 * Get widget factory by type, falling back to empty widget
 */
export function getWidgetFactory(
  registry: WidgetRegistry,
  widgetType: string
): WidgetFactory {
  return registry[widgetType] ?? registry['empty'] ?? createEmptyWidget;
}

