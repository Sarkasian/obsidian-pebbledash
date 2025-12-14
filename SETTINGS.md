# Pebbledash Settings System

This document explains the settings cascade system used by the Pebbledash plugin for Obsidian.

## Overview

Pebbledash uses a **three-tier settings cascade** that allows for flexible configuration at different levels:

1. **Vault Settings** (global defaults)
2. **Dashboard Settings** (per-dashboard overrides)
3. **Tile Settings** (per-tile overrides)

Settings at each level override the level above, while inheriting values that aren't explicitly set.

## Settings Cascade

```
┌─────────────────────────────────────┐
│        Vault Settings               │  ← Configured in plugin settings
│  (Settings → Pebbledash Dashboards) │
└──────────────────┬──────────────────┘
                   │ inherits from
                   ▼
┌─────────────────────────────────────┐
│      Dashboard Settings             │  ← Stored in .dash file YAML
│   (Right-click → Dashboard settings)│
└──────────────────┬──────────────────┘
                   │ inherits from
                   ▼
┌─────────────────────────────────────┐
│         Tile Settings               │  ← Stored in tile meta
│    (Right-click → Tile settings)    │
└─────────────────────────────────────┘
```

## Vault Settings

These are the global defaults for all dashboards in your vault. Access them via **Settings → Pebbledash Dashboards**.

### Layout Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `minTileWidth` | number | 10 | Minimum tile width as percentage |
| `minTileHeight` | number | 10 | Minimum tile height as percentage |
| `maxTileWidth` | number | 100 | Maximum tile width as percentage |
| `maxTileHeight` | number | 100 | Maximum tile height as percentage |

### Appearance Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `gutter` | number | 4 | Gap between tiles in pixels |
| `borderWidth` | number | 1 | Tile border width in pixels |
| `borderStyle` | string | 'solid' | Border style: 'solid', 'dashed', 'dotted', 'none' |
| `borderColor` | string | 'var(--background-modifier-border)' | CSS color value |

### Behavior Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `showHeaders` | boolean | true | Show filename headers on tiles |
| `showEmbedLink` | boolean | true | Show "Open link" button on embeds |
| `linkBehavior` | string | 'new-tab' | What happens when clicking links |
| `scrollBehavior` | string | 'clip' | How to handle content overflow |
| `interactionMode` | string | 'always' | When content is interactive |

### Animation Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `animationEnabled` | boolean | true | Enable tile transition animations |
| `animationDuration` | number | 200 | Animation duration in milliseconds |

### Nested Dashboard Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `seamlessNested` | boolean | false | Remove borders from nested dashboards |

### Resize Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `redistribute` | boolean | false | Redistribute space equally when shift+dragging |

## Dashboard Settings

Dashboard-level settings override vault defaults for a specific dashboard. They are stored in the `.dash` file's YAML header.

### Accessing Dashboard Settings

- **Edit mode**: Click the gear icon in the toolbar
- **Any mode**: Right-click any tile → **Dashboard settings...**

### Storage Format

```yaml
settings:
  gutter: 8
  showHeaders: false
  linkBehavior: replace-tile
  border:
    width: 2
    style: dashed
    color: '#ff0000'
  animation:
    enabled: true
    duration: 300
  seamlessNested: true
  cssclass: my-custom-dashboard

version: 2
tiles:
  # ... tile definitions
```

### Available Dashboard Settings

All vault settings can be overridden at the dashboard level, plus:

| Setting | Type | Description |
|---------|------|-------------|
| `cssclass` | string | Custom CSS class for styling this dashboard |
| `border.width` | number | Border width override |
| `border.style` | string | Border style override |
| `border.color` | string | Border color override |
| `animation.enabled` | boolean | Animation enabled override |
| `animation.duration` | number | Animation duration override |

## Tile Settings

Tile-level settings override both vault and dashboard defaults for a specific tile. They are stored in the tile's `meta` object.

### Accessing Tile Settings

Right-click any tile → **Tile settings...**

### Storage Format

```yaml
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 50
    height: 100
    meta:
      widgetType: embedded
      contentRef: Notes/MyNote.md
      showHeader: false
      linkBehavior: replace-dashboard
      scrollBehavior: scroll
      background: 'var(--background-secondary)'
      padding: '16px'
    constraints:
      minWidth: 20
      minHeight: 30
      maxWidth: 80
      maxHeight: 90
      lockedZones:
        - left
        - top
```

### Available Tile Settings

**Content Settings:**

| Setting | Type | Description |
|---------|------|-------------|
| `widgetType` | string | 'empty' or 'embedded' |
| `contentRef` | string | Path to the file to display |

**Appearance Overrides:**

| Setting | Type | Description |
|---------|------|-------------|
| `showHeader` | boolean | Show/hide header for this tile |
| `showEmbedLink` | boolean | Show/hide the "Open link" button |
| `background` | string | Custom CSS background value |
| `padding` | string | Custom CSS padding value |

**Behavior Overrides:**

| Setting | Type | Description |
|---------|------|-------------|
| `linkBehavior` | string | Link click behavior for this tile |
| `scrollBehavior` | string | Content overflow handling |
| `seamlessNested` | boolean | Seamless mode for nested dashboard |

### Tile Constraints

Constraints control tile sizing and resize behavior:

| Constraint | Type | Description |
|------------|------|-------------|
| `minWidth` | number | Minimum width as percentage |
| `minHeight` | number | Minimum height as percentage |
| `maxWidth` | number | Maximum width as percentage |
| `maxHeight` | number | Maximum height as percentage |
| `lockedZones` | string[] | Edges that cannot be resized: 'top', 'right', 'bottom', 'left' |

## Link Behavior Options

| Value | Description |
|-------|-------------|
| `new-tab` | Opens links in a new Obsidian tab (default) |
| `replace-dashboard` | Navigates away from the dashboard to the linked file |
| `replace-tile` | Replaces the tile's content with the linked file |

## Scroll Behavior Options

| Value | Description |
|-------|-------------|
| `scroll` | Content scrolls within the tile |
| `clip` | Content is clipped (hidden overflow) - default |
| `fit` | Content scales to fit the tile |

## Interaction Mode Options

| Value | Description |
|-------|-------------|
| `always` | Content is always interactive |
| `double-click` | Content becomes interactive on double-click |
| `never` | Content is never interactive |

## Settings Resolution

When determining the effective value for a setting, the plugin uses this resolution order:

```typescript
function resolveEffectiveSetting<T>(
  vaultValue: T,
  dashboardValue: T | undefined,
  tileValue: T | undefined
): T {
  // Tile setting takes precedence
  if (tileValue !== undefined) return tileValue;
  // Dashboard setting is second
  if (dashboardValue !== undefined) return dashboardValue;
  // Fall back to vault default
  return vaultValue;
}
```

## CSS Variables

The plugin applies CSS variables to the dashboard container based on resolved settings:

```css
.pebbledash-dashboard {
  --pebbledash-gutter: 4px;
  --pebbledash-border-width: 1px;
  --pebbledash-border-style: solid;
  --pebbledash-border-color: var(--background-modifier-border);
}
```

These can be used in CSS snippets for custom styling:

```css
/* Custom snippet to override gutter */
.my-custom-dashboard {
  --pebbledash-gutter: 12px;
}
```

## Best Practices

1. **Start with vault defaults** - Configure sensible defaults that work for most dashboards
2. **Override sparingly** - Only set dashboard/tile overrides when needed
3. **Use CSS classes** - For complex visual customization, use `cssclass` with CSS snippets
4. **Document custom settings** - If you use specific settings for a reason, document it in the dashboard

## Programmatic Access

For plugin developers, the settings resolution logic is available in `settingsResolver.ts`:

```typescript
import { 
  resolveEffectiveTileSettings,
  resolveEffectiveDashboardConfig 
} from './settingsResolver';

// Get resolved dashboard config (vault + dashboard cascade)
const dashConfig = resolveEffectiveDashboardConfig(
  vaultSettings,
  dashboardSettings
);

// Get resolved tile settings (vault + dashboard + tile cascade)
const tileSettings = resolveEffectiveTileSettings(
  vaultSettings,
  dashboardSettings,
  tileMeta
);
```

