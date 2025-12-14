import { TFile, Component } from 'obsidian';
import { BaseDashboard } from '@pebbledash/renderer-dom';
import type PebbledashPlugin from './main';
import type { Widget } from './widgets/types';
import { parseDashFile, dashFileToSnapshot } from './yamlAdapter';
import { resolveEffectiveDashboardConfig, applyCssVariables, resolveEffectiveTileSettings } from './settingsResolver';
import { getWidgetFactory, builtInWidgets } from './widgets';
import type { ObsidianTileMeta } from './types';

// Maximum nesting depth to prevent infinite recursion
const MAX_DEPTH = 3;

// Track current depth globally for nested embeds
let currentEmbedDepth = 0;

/**
 * Creates an embed factory for .dash files.
 * This factory is registered with Obsidian's embedRegistry to enable
 * embedding dashboards in tiles and notes.
 */
export function createDashEmbedFactory(plugin: PebbledashPlugin) {
  return function dashEmbedFactory(
    ctx: { app: any; containerEl: HTMLElement; linktext: string; sourcePath: string },
    file: TFile,
    subpath: string
  ) {
    const { app, containerEl } = ctx;
    let dashboard: BaseDashboard | null = null;
    let nestedWidgets: Map<string, Widget> = new Map();
    let dashboardContainer: HTMLElement | null = null;
    let isLoaded = false;
    const depth = currentEmbedDepth;

    // Create the embed object that Obsidian expects
    const embed = {
      containerEl,
      file,

      async loadFile() {
        if (isLoaded) return;
        isLoaded = true;

        // Check depth limit
        if (depth >= MAX_DEPTH) {
          renderDepthLimitError();
          return;
        }

        try {
          // Read and parse the dashboard file
          const content = await app.vault.read(file);
          const dashFile = parseDashFile(content);
          const snapshot = dashFileToSnapshot(dashFile);

          // Create container for the dashboard
          containerEl.empty();
          containerEl.addClass('pebbledash-dash-embed');
          
          // Check if we're in seamless mode (parent tile has the seamless class)
          const tileContent = containerEl.closest('.ud-tile-content');
          const isSeamless = tileContent?.classList.contains('pebbledash-seamless-nested');
          
          if (isSeamless) {
            containerEl.addClass('pebbledash-seamless');
          }
          
          dashboardContainer = containerEl.createDiv({ cls: 'pebbledash-nested-dashboard' });

          // Resolve config and apply CSS variables
          const nestedConfig = resolveEffectiveDashboardConfig(
            plugin.settings,
            dashFile.settings
          );
          
          // Always apply CSS variables to ensure proper gutter/border styling
          // In seamless mode, nested tiles should look like parent tiles
          applyCssVariables(dashboardContainer, nestedConfig);

          // Increment depth for nested widgets
          currentEmbedDepth = depth + 1;

          // Create the nested dashboard (view-only, no overlays)
          dashboard = new BaseDashboard({
            container: dashboardContainer,
            defaults: {
              minTile: nestedConfig.minTile,
              epsilon: 1e-6,
            },
            initialLayout: {
              tiles: snapshot.tiles,
            },
            features: {
              overlays: false,  // No editing controls in nested dashboards
              keyboard: false,
              startMode: 'resize',
              keyboardUndoRedo: false,
            },
            widgets: createNestedWidgetFactories(dashFile, depth + 1),
          });

          await dashboard.mount();

          // Remove ALL inline styles that conflict with our CSS gutter/styling rules
          // BaseDashboard's DomRenderer sets these inline, which prevents CSS from working
          
          // Remove inline styles from .ud-tile elements
          const nestedTiles = dashboardContainer.querySelectorAll('.ud-tile');
          nestedTiles.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.removeProperty('overflow');
            htmlEl.style.removeProperty('background');
          });
          
          // Remove inline styles from .ud-tile-content elements
          const nestedTileContents = dashboardContainer.querySelectorAll('.ud-tile-content');
          nestedTileContents.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.removeProperty('inset');
            htmlEl.style.removeProperty('overflow');
          });

          // Reset depth after mounting
          currentEmbedDepth = depth;
        } catch (error) {
          console.error('DashEmbed: Failed to load dashboard:', error);
          renderError(`Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`);
          currentEmbedDepth = depth;
        }
      },

      load() {
        // Called after loadFile, can be used for additional setup
      },

      unload() {
        // Unmount all nested widgets
        nestedWidgets.forEach(widget => widget.unmount());
        nestedWidgets.clear();

        // Unmount dashboard
        if (dashboard) {
          dashboard.unmount();
          dashboard = null;
        }

        dashboardContainer = null;
        isLoaded = false;
      },
    };

    function renderError(message: string) {
      containerEl.empty();
      const errorEl = containerEl.createDiv({ cls: 'pebbledash-widget-error' });
      errorEl.createDiv({ cls: 'pebbledash-error-icon', text: '📊' });
      errorEl.createDiv({ cls: 'pebbledash-error-message', text: message });
    }

    function renderDepthLimitError() {
      containerEl.empty();
      const errorEl = containerEl.createDiv({ cls: 'pebbledash-depth-limit' });
      errorEl.createDiv({ cls: 'pebbledash-error-icon', text: '⚠️' });
      errorEl.createDiv({ cls: 'pebbledash-error-message', text: 'Maximum nesting depth reached' });
      errorEl.createDiv({ cls: 'pebbledash-error-hint', text: `Dashboards can only be nested ${MAX_DEPTH} levels deep` });
    }

    /**
     * Create widget factories for the nested dashboard.
     */
    function createNestedWidgetFactories(dashFile: any, newDepth: number): Record<string, (ctx: any) => any> {
      const createNestedWidget = (widgetCtx: { tileId: string; element: HTMLElement; meta?: Record<string, unknown> }) => {
        // Get meta from the parsed dashFile
        const tile = dashFile.tiles.find((t: any) => t.id === widgetCtx.tileId);
        const tileMeta = (tile?.meta ?? { widgetType: 'empty' }) as ObsidianTileMeta;
        const widgetType = tileMeta.widgetType ?? 'empty';

        const factory = getWidgetFactory(builtInWidgets, widgetType);

        // Resolve effective settings for this tile
        const effectiveSettings = resolveEffectiveTileSettings(
          plugin.settings,
          dashFile.settings,
          tileMeta
        );

        // Create widget context
        const nestedWidgetCtx = {
          tileId: widgetCtx.tileId,
          element: widgetCtx.element,
          meta: tileMeta,
          app,
          component: new Component(),
          settings: plugin.settings,
          dashboardSettings: dashFile.settings,
          effectiveSettings,
          depth: newDepth,
        };

        const widget = factory(nestedWidgetCtx);

        return {
          mount() {
            widget.mount();
            nestedWidgets.set(widgetCtx.tileId, widget);
          },
          unmount() {
            widget.unmount();
            nestedWidgets.delete(widgetCtx.tileId);
          },
          update(newMeta: Record<string, unknown>) {
            if (widget.update) {
              widget.update(newMeta as any);
            }
          },
        };
      };

      return {
        default: createNestedWidget,
        empty: createNestedWidget,
        embedded: createNestedWidget,
      };
    }

    return embed;
  };
}

