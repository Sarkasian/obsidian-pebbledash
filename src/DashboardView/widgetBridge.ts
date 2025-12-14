/**
 * Widget bridge - connects pebbledash widgets to Obsidian widgets
 */

import type { App, Component } from 'obsidian';
import type { TileId, DashFile, ObsidianTileMeta, PebbledashSettings } from '../types';
import type { WidgetRegistry, Widget, WidgetContext } from '../widgets';
import { getWidgetFactory } from '../widgets';
import { resolveEffectiveTileSettings } from '../settingsResolver';

/**
 * Context for creating widget bridges
 */
export interface WidgetBridgeContext {
  app: App;
  component: Component;
  dashFile: DashFile | null;
  settings: PebbledashSettings;
  widgetRegistry: WidgetRegistry;
  activeWidgets: Map<string, Widget>;
}

/**
 * Create a single widget bridge instance
 */
export function createWidgetBridgeInstance(
  ctx: WidgetBridgeContext,
  pebbledashCtx: { tileId: string; element: HTMLElement; meta?: Record<string, unknown> }
): { mount: () => void; unmount: () => void; update: (newMeta: Record<string, unknown>) => void } {
  const { app, component, dashFile, settings, widgetRegistry, activeWidgets } = ctx;
  
  // Get meta directly from dashFile - our single source of truth
  const tile = dashFile?.tiles.find(t => t.id === pebbledashCtx.tileId);
  const meta = (tile?.meta ?? { widgetType: 'empty' }) as ObsidianTileMeta;
  const widgetType = meta.widgetType ?? 'empty';
  
  // Get the appropriate widget factory from our registry
  const factory = getWidgetFactory(widgetRegistry, widgetType);
  
  // Resolve effective settings for this tile (vault → dashboard → tile cascade)
  const effectiveSettings = resolveEffectiveTileSettings(
    settings,
    dashFile?.settings,
    meta
  );
  
  // Create widget context for Obsidian
  const widgetCtx: WidgetContext = {
    tileId: pebbledashCtx.tileId as TileId,
    element: pebbledashCtx.element,
    meta,
    app,
    component,
    settings,
    dashboardSettings: dashFile?.settings,
    effectiveSettings,
  };

  // Create the widget
  const widget = factory(widgetCtx);

  return {
    mount() {
      widget.mount();
      activeWidgets.set(pebbledashCtx.tileId, widget);
    },
    unmount() {
      widget.unmount();
      activeWidgets.delete(pebbledashCtx.tileId);
    },
    update(newMeta: Record<string, unknown>) {
      if (widget.update) {
        widget.update(newMeta as unknown as ObsidianTileMeta);
      }
    },
  };
}

/**
 * Create pebbledash widget factories that bridge to Obsidian widgets.
 * 
 * All widget types use the same bridge factory which looks up the actual
 * widget implementation from the Obsidian widget registry based on the
 * tile's meta.widgetType property.
 */
export function createPebbledashWidgetFactories(
  ctx: WidgetBridgeContext
): Record<string, (pebbledashCtx: { tileId: string; element: HTMLElement; meta?: Record<string, unknown> }) => any> {
  const createWidgetBridge = (pebbledashCtx: { tileId: string; element: HTMLElement; meta?: Record<string, unknown> }) => {
    return createWidgetBridgeInstance(ctx, pebbledashCtx);
  };

  // Register the bridge for 'default' plus all known widget types from the registry.
  // The renderer looks up widgets by their meta.widgetType, so we need to register
  // a factory for each possible type (empty, embedded, plus any external widgets).
  const factories: Record<string, typeof createWidgetBridge> = {
    default: createWidgetBridge,
  };
  
  // Add entry for each widget type in the Obsidian registry
  for (const widgetType of Object.keys(ctx.widgetRegistry)) {
    factories[widgetType] = createWidgetBridge;
  }
  
  return factories;
}

