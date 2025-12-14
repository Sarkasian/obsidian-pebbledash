# External Widget API

This document describes how external Obsidian plugins can create custom widgets for Pebbledash dashboards.

## Overview

Pebbledash supports custom widgets registered by external plugins. This allows other plugins to extend dashboard functionality with specialized visualizations, interactive components, or integrations with other services.

## Quick Start

### Basic Widget Registration

In your plugin's `onload()` method:

```typescript
import { Plugin } from 'obsidian';

// Type definitions (optional but recommended)
interface WidgetContext {
  tileId: string;
  element: HTMLElement;
  meta: Record<string, unknown>;
  app: App;
  component: Component;
  settings: unknown;
  effectiveSettings: unknown;
  onContentChange?: (contentRef: string) => void;
}

interface Widget {
  mount(): void | Promise<void>;
  unmount(): void;
  update?(newMeta: Record<string, unknown>): void | Promise<void>;
  setLocked?(locked: boolean): void;
  toggleLocked?(): void;
  isLocked?(): boolean;
}

type WidgetFactory = (ctx: WidgetContext) => Widget;

export default class MyPlugin extends Plugin {
  async onload() {
    // Get Pebbledash plugin instance
    const pebbledash = this.app.plugins.getPlugin('obsidian-pebbledash');
    
    if (pebbledash) {
      // Register a custom widget
      const unregister = pebbledash.registerWidget('my-widget', (ctx) => ({
        mount() {
          ctx.element.createEl('div', { 
            cls: 'my-widget',
            text: 'Hello from my widget!' 
          });
        },
        unmount() {
          ctx.element.empty();
        },
      }));
      
      // Store the cleanup function for onunload
      this.register(unregister);
    }
  }
}
```

## API Reference

### `registerWidget(widgetType, factory)`

Register a single widget factory.

**Parameters:**
- `widgetType` (string): Unique identifier for the widget type (e.g., `'my-chart'`)
- `factory` (WidgetFactory): Function that creates widget instances

**Returns:** `() => void` - Cleanup function to unregister the widget

**Example:**
```typescript
const unregister = pebbledash.registerWidget('countdown', (ctx) => ({
  mount() {
    const target = new Date(ctx.meta.targetDate as string);
    // ... render countdown
  },
  unmount() {
    ctx.element.empty();
  },
}));
```

### `registerWidgets(widgets)`

Register multiple widget factories at once.

**Parameters:**
- `widgets` (Record<string, WidgetFactory>): Object mapping widget types to factories

**Returns:** `() => void` - Cleanup function to unregister all widgets

**Example:**
```typescript
const unregister = pebbledash.registerWidgets({
  'my-chart': createChartWidget,
  'my-table': createTableWidget,
  'my-counter': createCounterWidget,
});
```

## WidgetContext

The context object passed to widget factories:

| Property | Type | Description |
|----------|------|-------------|
| `tileId` | `string` | Unique tile identifier |
| `element` | `HTMLElement` | DOM element to render into |
| `meta` | `Record<string, unknown>` | Tile metadata (includes custom properties) |
| `app` | `App` | Obsidian App instance |
| `component` | `Component` | Parent component for lifecycle management |
| `settings` | `PebbledashSettings` | Plugin vault-level settings |
| `dashboardSettings` | `DashboardSettings` | Dashboard-level settings (optional) |
| `effectiveSettings` | `EffectiveTileSettings` | Resolved settings (vault → dashboard → tile) |
| `onContentChange` | `(contentRef: string) => void` | Callback to change tile content |

### Using `meta` for Custom Data

Store widget-specific configuration in the tile's `meta`:

```yaml
# In .dash file
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 50
    height: 50
    meta:
      widgetType: my-chart
      chartType: bar
      dataSource: sales-data.json
      colors:
        - "#ff0000"
        - "#00ff00"
```

Access in widget:
```typescript
const factory: WidgetFactory = (ctx) => ({
  mount() {
    const chartType = ctx.meta.chartType as string;
    const dataSource = ctx.meta.dataSource as string;
    const colors = ctx.meta.colors as string[];
    // ... render chart
  },
  unmount() {
    ctx.element.empty();
  },
});
```

## Widget Interface

### Required Methods

#### `mount(): void | Promise<void>`

Called when the widget should render. Create DOM elements and set up event listeners.

```typescript
mount() {
  this.container = ctx.element.createEl('div', { cls: 'my-widget' });
  this.container.addEventListener('click', this.handleClick);
}
```

#### `unmount(): void`

Called when the widget should clean up. Remove event listeners and clear DOM.

```typescript
unmount() {
  this.container?.removeEventListener('click', this.handleClick);
  ctx.element.empty();
}
```

### Optional Methods

#### `update(newMeta): void | Promise<void>`

Called when tile metadata changes. Update rendering without full remount.

```typescript
update(newMeta) {
  if (newMeta.dataSource !== this.currentDataSource) {
    this.loadData(newMeta.dataSource as string);
  }
}
```

#### `setLocked(locked): void`

Called when edit mode changes. Use to enable/disable interaction.

```typescript
setLocked(locked) {
  this.interactive = !locked;
  this.container?.classList.toggle('locked', locked);
}
```

#### `toggleLocked(): void`

Toggle the locked state (convenience method).

#### `isLocked(): boolean`

Return current locked state.

## Complete Example: Chart Widget

```typescript
import { Plugin, App, Component } from 'obsidian';

interface ChartWidgetMeta {
  widgetType: 'my-chart';
  chartType: 'bar' | 'line' | 'pie';
  dataFile?: string;
  title?: string;
}

interface WidgetContext {
  tileId: string;
  element: HTMLElement;
  meta: ChartWidgetMeta;
  app: App;
  component: Component;
}

function createChartWidget(ctx: WidgetContext) {
  let container: HTMLElement | null = null;
  let chart: unknown = null; // Your chart library instance
  let locked = true;
  
  const loadData = async () => {
    if (!ctx.meta.dataFile) return [];
    const file = ctx.app.vault.getAbstractFileByPath(ctx.meta.dataFile);
    if (!file) return [];
    const content = await ctx.app.vault.read(file as TFile);
    return JSON.parse(content);
  };
  
  const renderChart = async () => {
    const data = await loadData();
    
    // Clear existing
    if (container) container.empty();
    
    // Create structure
    const wrapper = container!.createEl('div', { cls: 'chart-widget' });
    
    if (ctx.meta.title) {
      wrapper.createEl('h3', { 
        cls: 'chart-title',
        text: ctx.meta.title 
      });
    }
    
    const chartEl = wrapper.createEl('div', { cls: 'chart-container' });
    
    // Initialize chart library (example with Chart.js)
    // chart = new Chart(chartEl, { type: ctx.meta.chartType, data });
  };
  
  return {
    async mount() {
      container = ctx.element.createEl('div', { cls: 'my-chart-widget' });
      await renderChart();
    },
    
    unmount() {
      // Clean up chart library
      // if (chart) chart.destroy();
      chart = null;
      container?.remove();
      container = null;
    },
    
    async update(newMeta: ChartWidgetMeta) {
      if (newMeta.dataFile !== ctx.meta.dataFile ||
          newMeta.chartType !== ctx.meta.chartType) {
        Object.assign(ctx.meta, newMeta);
        await renderChart();
      }
    },
    
    setLocked(isLocked: boolean) {
      locked = isLocked;
      container?.classList.toggle('chart-locked', isLocked);
    },
    
    isLocked() {
      return locked;
    },
  };
}

export default class ChartPlugin extends Plugin {
  async onload() {
    const pebbledash = this.app.plugins.getPlugin('obsidian-pebbledash');
    
    if (pebbledash) {
      this.register(
        pebbledash.registerWidget('my-chart', createChartWidget)
      );
    }
  }
}
```

## Best Practices

### 1. Always Clean Up

```typescript
unmount() {
  // Remove event listeners
  this.element?.removeEventListener('click', this.handler);
  
  // Cancel timers/intervals
  if (this.intervalId) clearInterval(this.intervalId);
  
  // Clean up resources
  this.chart?.destroy();
  
  // Clear DOM
  ctx.element.empty();
}
```

### 2. Handle Missing Data Gracefully

```typescript
mount() {
  const dataSource = ctx.meta.dataSource;
  if (!dataSource) {
    ctx.element.createEl('div', {
      cls: 'widget-error',
      text: 'No data source configured'
    });
    return;
  }
  // ... load and render
}
```

### 3. Use Obsidian's Component System

```typescript
mount() {
  // Register for automatic cleanup on component unload
  ctx.component.registerEvent(
    ctx.app.workspace.on('file-open', (file) => {
      // Handle file open
    })
  );
}
```

### 4. Support Dark/Light Themes

```css
.my-widget {
  color: var(--text-normal);
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
}
```

### 5. Respect Edit Mode

```typescript
setLocked(locked) {
  this.locked = locked;
  if (!locked) {
    // In edit mode - disable interactions, show drag handles
    this.disableInteraction();
  } else {
    // In view mode - enable full interaction
    this.enableInteraction();
  }
}
```

### 6. Type-Safe Meta Access

```typescript
interface MyWidgetMeta {
  widgetType: 'my-widget';
  title?: string;
  refreshInterval?: number;
}

function createMyWidget(ctx: WidgetContext) {
  const meta = ctx.meta as MyWidgetMeta;
  const title = meta.title ?? 'Default Title';
  const interval = meta.refreshInterval ?? 60000;
  // ...
}
```

## Using Custom Widgets in .dash Files

Once registered, use your widget by setting `widgetType` in the tile meta:

```yaml
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 50
    height: 50
    meta:
      widgetType: my-chart
      chartType: bar
      dataFile: data/sales.json
      title: Monthly Sales
```

## Debugging

Enable console logging during development:

```typescript
mount() {
  console.log('MyWidget mounting', { tileId: ctx.tileId, meta: ctx.meta });
  // ...
}

unmount() {
  console.log('MyWidget unmounting', { tileId: ctx.tileId });
  // ...
}
```

## Plugin Availability

Check if Pebbledash is available before registering:

```typescript
async onload() {
  // Wait for plugins to be ready
  this.app.workspace.onLayoutReady(() => {
    const pebbledash = this.app.plugins.getPlugin('obsidian-pebbledash');
    
    if (!pebbledash) {
      console.warn('Pebbledash not found. Widget features unavailable.');
      return;
    }
    
    // Register widgets
    this.register(
      pebbledash.registerWidget('my-widget', createMyWidget)
    );
  });
}
```

## TypeScript Definitions

For full TypeScript support, add these type definitions to your plugin:

```typescript
// types/pebbledash.d.ts
declare module 'obsidian' {
  interface App {
    plugins: {
      getPlugin(id: 'obsidian-pebbledash'): PebbledashPlugin | null;
    };
  }
}

interface PebbledashPlugin {
  registerWidget(type: string, factory: WidgetFactory): () => void;
  registerWidgets(widgets: Record<string, WidgetFactory>): () => void;
}

interface WidgetContext {
  tileId: string;
  element: HTMLElement;
  meta: Record<string, unknown>;
  app: App;
  component: Component;
  settings: Record<string, unknown>;
  effectiveSettings: Record<string, unknown>;
  onContentChange?: (contentRef: string) => void;
}

interface Widget {
  mount(): void | Promise<void>;
  unmount(): void;
  update?(newMeta: Record<string, unknown>): void | Promise<void>;
  setLocked?(locked: boolean): void;
  toggleLocked?(): void;
  isLocked?(): boolean;
}

type WidgetFactory = (ctx: WidgetContext) => Widget;
```

