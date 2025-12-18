/**
 * Widget helper functions for DashboardView.
 * Handles mounting, unmounting, and updating widgets.
 */

import type { App, Component } from 'obsidian';
import type { TileId, ObsidianTileMeta, PebbledashSettings, DashFile } from '../types';
import type { WidgetRegistry, Widget, WidgetContext } from '../widgets';
import { getWidgetFactory } from '../widgets';
import { resolveEffectiveTileSettings } from '../settingsResolver';

/**
 * Context needed for widget operations
 */
export interface WidgetHelpersContext {
  app: App;
  component: Component;
  dashFile: DashFile | null;
  settings: PebbledashSettings;
  widgetRegistry: WidgetRegistry;
  activeWidgets: Map<string, Widget>;
  dashboardContainer: HTMLElement | null;
}

/**
 * Update the widget for a specific tile (unmount old, mount new)
 */
export function updateWidgetForTile(
  ctx: WidgetHelpersContext,
  tileId: string,
  meta: ObsidianTileMeta
): void {
  const { app, component, dashFile, settings, widgetRegistry, activeWidgets, dashboardContainer } = ctx;
  
  // Unmount existing widget
  const existingWidget = activeWidgets.get(tileId);
  if (existingWidget) {
    existingWidget.unmount();
    activeWidgets.delete(tileId);
  }
  
  // Find tile element
  const selector = `[data-tile-id="${tileId}"]`;
  const tileEl = dashboardContainer?.querySelector(selector);
  
  if (tileEl) {
    const contentEl = tileEl.querySelector('.ud-tile-content') as HTMLElement || tileEl as HTMLElement;
    contentEl.empty();
    
    // Create and mount new widget
    const widgetType = meta.widgetType ?? 'empty';
    const factory = getWidgetFactory(widgetRegistry, widgetType);
    
    // Resolve effective settings for this tile
    const effectiveSettings = resolveEffectiveTileSettings(
      settings,
      dashFile?.settings,
      meta
    );
    
    const widgetCtx: WidgetContext = {
      tileId: tileId as TileId,
      element: contentEl,
      meta,
      app,
      component,
      settings,
      dashboardSettings: dashFile?.settings,
      effectiveSettings,
    };
    
    const newWidget = factory(widgetCtx);
    newWidget.mount();
    activeWidgets.set(tileId, newWidget);
  }
}

/**
 * Refresh all widgets to pick up updated settings
 */
export function refreshAllWidgets(ctx: WidgetHelpersContext): void {
  if (!ctx.dashFile) return;
  
  for (const tile of ctx.dashFile.tiles) {
    updateWidgetForTile(ctx, tile.id as string, tile.meta || { widgetType: 'empty' });
  }
}

/**
 * Unmount all active widgets
 */
export function unmountAllWidgets(activeWidgets: Map<string, Widget>): void {
  activeWidgets.forEach(widget => widget.unmount());
  activeWidgets.clear();
}

/**
 * Refresh embedded content for tiles that reference a specific file.
 * Called when a referenced file is modified to update the display.
 */
export function refreshEmbeddedContentForFile(
  dashFile: DashFile | null,
  activeWidgets: Map<string, Widget>,
  filePath: string
): void {
  if (!dashFile) return;

  // Find tiles that reference the modified file
  const affectedTiles = dashFile.tiles.filter(
    tile => tile.meta?.contentRef === filePath
  );

  // Refresh each affected widget
  for (const tile of affectedTiles) {
    const widget = activeWidgets.get(tile.id as string);
    if (widget?.update) {
      // Trigger widget update to refresh content
      widget.update(tile.meta || { widgetType: 'empty' });
    }
  }
}

