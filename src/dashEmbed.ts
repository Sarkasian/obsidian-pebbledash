import { TFile, Component } from 'obsidian';
import { BaseDashboard } from '@pebbledash/renderer-dom';
import type PebbledashPlugin from './main';
import type { Widget } from './widgets/types';
import { parseDashFile, dashFileToSnapshot } from './yamlAdapter';
import { resolveEffectiveDashboardConfig, applyCssVariables, resolveEffectiveTileSettings } from './settingsResolver';
import { getWidgetFactory, builtInWidgets } from './widgets';
import type { ObsidianTileMeta } from './types';
import type { EmbedComponent } from './obsidian-internal';

// Maximum nesting depth to prevent infinite recursion
const MAX_DEPTH = 3;

// Track current depth globally for nested embeds
let currentEmbedDepth = 0;

/**
 * Dash file embed component that extends Obsidian's Component for lifecycle management
 */
class DashEmbedComponent extends Component implements EmbedComponent {
  containerEl: HTMLElement;
  file: TFile;
  private plugin: PebbledashPlugin;
  private app: any;
  private depth: number;
  private dashboard: BaseDashboard | null = null;
  private nestedWidgets: Map<string, Widget> = new Map();
  private dashboardContainer: HTMLElement | null = null;
  private isLoaded = false;

  constructor(
    plugin: PebbledashPlugin,
    app: any,
    containerEl: HTMLElement,
    file: TFile,
    depth: number
  ) {
    super();
    this.plugin = plugin;
    this.app = app;
    this.containerEl = containerEl;
    this.file = file;
    this.depth = depth;
  }

  async loadFile() {
    if (this.isLoaded) return;
    this.isLoaded = true;

    // Check depth limit
    if (this.depth >= MAX_DEPTH) {
      this.renderDepthLimitError();
      return;
    }

    try {
      // Read and parse the dashboard file
      const content = await this.app.vault.read(this.file);
      const dashFile = parseDashFile(content);
      const snapshot = dashFileToSnapshot(dashFile);

      // Create container for the dashboard
      this.containerEl.empty();
      this.containerEl.addClass('pebbledash-dash-embed');
      
      // Check if we're in seamless mode (parent tile has the seamless class)
      const tileContent = this.containerEl.closest('.ud-tile-content');
      const isSeamless = tileContent?.classList.contains('pebbledash-seamless-nested');
      
      if (isSeamless) {
        this.containerEl.addClass('pebbledash-seamless');
      }
      
      this.dashboardContainer = this.containerEl.createDiv({ cls: 'pebbledash-nested-dashboard' });

      // Resolve config and apply CSS variables
      const nestedConfig = resolveEffectiveDashboardConfig(
        this.plugin.settings,
        dashFile.settings
      );
      
      // Always apply CSS variables to ensure proper gutter/border styling
      // In seamless mode, nested tiles should look like parent tiles
      applyCssVariables(this.dashboardContainer, nestedConfig);

      // Increment depth for nested widgets
      currentEmbedDepth = this.depth + 1;

      // Create the nested dashboard (view-only, no overlays)
      this.dashboard = new BaseDashboard({
        container: this.dashboardContainer,
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
        },
        widgets: this.createNestedWidgetFactories(dashFile, this.depth + 1),
      });

      await this.dashboard.mount();

      // Remove ALL inline styles that conflict with our CSS gutter/styling rules
      // BaseDashboard's DomRenderer sets these inline, which prevents CSS from working
      
      // Remove inline styles from .ud-tile elements
      const nestedTiles = this.dashboardContainer.querySelectorAll('.ud-tile');
      nestedTiles.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.removeProperty('overflow');
        htmlEl.style.removeProperty('background');
      });
      
      // Remove inline styles from .ud-tile-content elements
      const nestedTileContents = this.dashboardContainer.querySelectorAll('.ud-tile-content');
      nestedTileContents.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.removeProperty('inset');
        htmlEl.style.removeProperty('overflow');
      });

      // Reset depth after mounting
      currentEmbedDepth = this.depth;
    } catch (error) {
      console.error('DashEmbed: Failed to load dashboard:', error);
      this.renderError(`Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`);
      currentEmbedDepth = this.depth;
    }
  }

  onload() {
    // Called after loadFile, can be used for additional setup
  }

  onunload() {
    // Unmount all nested widgets
    this.nestedWidgets.forEach(widget => widget.unmount());
    this.nestedWidgets.clear();

    // Unmount dashboard
    if (this.dashboard) {
      this.dashboard.unmount();
      this.dashboard = null;
    }

    this.dashboardContainer = null;
    this.isLoaded = false;
  }

  private renderError(message: string) {
    this.containerEl.empty();
    const errorEl = this.containerEl.createDiv({ cls: 'pebbledash-widget-error' });
    errorEl.createDiv({ cls: 'pebbledash-error-icon', text: '📊' });
    errorEl.createDiv({ cls: 'pebbledash-error-message', text: message });
  }

  private renderDepthLimitError() {
    this.containerEl.empty();
    const errorEl = this.containerEl.createDiv({ cls: 'pebbledash-depth-limit' });
    errorEl.createDiv({ cls: 'pebbledash-error-icon', text: '⚠️' });
    errorEl.createDiv({ cls: 'pebbledash-error-message', text: 'Maximum nesting depth reached' });
    errorEl.createDiv({ cls: 'pebbledash-error-hint', text: `Dashboards can only be nested ${MAX_DEPTH} levels deep` });
  }

  /**
   * Create widget factories for the nested dashboard.
   */
  private createNestedWidgetFactories(dashFile: any, _newDepth: number): Record<string, (ctx: any) => any> {
    const nestedWidgets = this.nestedWidgets;
    const plugin = this.plugin;
    const app = this.app;

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
      const nestedWidgetCtx: import('./widgets/types').WidgetContext = {
        tileId: widgetCtx.tileId as import('./types').TileId,
        element: widgetCtx.element,
        meta: tileMeta,
        app,
        component: new Component(),
        settings: plugin.settings,
        dashboardSettings: dashFile.settings,
        effectiveSettings,
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
}

/**
 * Creates an embed factory for .dash files.
 * This factory is registered with Obsidian's embedRegistry to enable
 * embedding dashboards in tiles and notes.
 */
export function createDashEmbedFactory(plugin: PebbledashPlugin) {
  return function dashEmbedFactory(
    ctx: { app: any; containerEl: HTMLElement; linktext?: string; sourcePath: string },
    file: TFile,
    _subpath: string
  ): EmbedComponent {
    const { app, containerEl } = ctx;
    const depth = currentEmbedDepth;

    return new DashEmbedComponent(plugin, app, containerEl, file, depth);
  };
}
