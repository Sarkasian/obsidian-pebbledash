# obsidian-pebbledash Plugin Specification

A dashboarding plugin for Obsidian that displays vault content in resizable tiles, powered by the pebbledash layout engine.

## Table of Contents

- [Overview](#overview)
- [File Format](#file-format)
- [Modes](#modes)
- [Widget System](#widget-system)
- [Tile Content Assignment](#tile-content-assignment)
- [Link Handling](#link-handling)
- [File Reference Tracking](#file-reference-tracking)
- [Dashboard Nesting](#dashboard-nesting)
- [Settings Hierarchy](#settings-hierarchy)
- [Commands and UI Entry Points](#commands-and-ui-entry-points)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Real-time Updates](#real-time-updates)
- [CSS Customization](#css-customization)
- [Mobile Support](#mobile-support)
- [File Structure](#file-structure)
- [Implementation Phases](#implementation-phases)

---

## Overview

obsidian-pebbledash enables users to create dashboard views within Obsidian, displaying vault content (notes, images, embeds, and more) in a grid of resizable tiles. The plugin leverages the `@pebbledash/core` layout engine for tile management and provides Obsidian-specific rendering through a custom widget system.

### Key Features

- Display any Obsidian content in dashboard tiles
- Resizable, rearrangeable tile layouts
- View mode for consumption, Edit mode for layout changes
- Tiered settings (vault → dashboard → tile)
- Real-time updates when source content changes
- Full mobile support

---

## File Format

### Extension

Dashboard files use the `.dash` extension.

### Content Structure

Files contain pure YAML (no Obsidian frontmatter). The schema includes:

```yaml
# Dashboard-level settings (optional, overrides vault defaults)
settings:
  cssclass: "my-dashboard-theme"
  gutter: 8
  border:
    width: 1
    style: solid
    color: "#e0e0e0"
  animation:
    enabled: true
    duration: 200
  linkBehavior: "new-tab"  # "new-tab" | "replace-dashboard" | "replace-tile"
  showHeaders: true

# Tile layout (from pebbledash snapshot format)
version: 2
tiles:
  - id: "tile-1"
    x: 0
    y: 0
    width: 50
    height: 50
    meta:
      widgetType: "embedded"
      contentRef: "Notes/Welcome.md"
      showHeader: true
      linkBehavior: "new-tab"  # Per-tile override
    constraints:
      minWidth: 20
      minHeight: 20
  - id: "tile-2"
    x: 50
    y: 0
    width: 50
    height: 50
    meta:
      widgetType: "embedded"
      contentRef: "Assets/photo.png"
      showHeader: false
```

### Storage Location

- Dashboards can be stored anywhere in the vault (same as regular notes)
- Excluded from Obsidian's graph view

---

## Modes

### View Mode (Default)

- Tiles are static and cannot be resized or rearranged
- Content is displayed and interactive (scrollable, links clickable)
- No editing controls visible
- This is the mode users see when opening a dashboard

### Edit Mode

Edit mode contains two sub-modes, toggled via a toolbar control:

#### Insert Sub-mode

- Hover over tile edges to see insertion points
- Click an edge to split the adjacent tile and create a new empty tile
- Cursor shows "copy" indicator on edges
- Follows pebbledash demo interaction pattern

#### Resize Sub-mode

- Hover over tile edges to see resize handles
- Drag edges to resize tiles
- Cursor shows "ew-resize" or "ns-resize" indicators
- Disabled edges (cannot resize further) show "not-allowed" cursor

### Mode Toggle

- Toolbar button or command to switch between View and Edit modes
- Within Edit mode, toggle between Insert and Resize sub-modes
- Keyboard shortcut available (user-configurable)

---

## Widget System

### Architecture

Widgets are responsible for rendering tile content. Each widget type is a factory function that receives context and returns lifecycle methods:

```typescript
interface WidgetContext {
  tileId: string;
  element: HTMLElement;  // Container to render into
  meta: TileMeta;        // Tile metadata including contentRef
  app: App;              // Obsidian App instance
}

interface Widget {
  mount(): void | Promise<void>;
  unmount(): void;
  update?(newMeta: TileMeta): void | Promise<void>;
}

type WidgetFactory = (ctx: WidgetContext) => Widget;
```

### Built-in Widgets

| Widget Type | Description | Content Ref Format |
|-------------|-------------|-------------------|
| `embedded` | Native Obsidian embeds via embedRegistry (supports all file types including .md, images, PDFs, canvas, and .dash files) | File path: `"Notes/MyNote.md"` |
| `empty` | Empty placeholder (for new tiles) | None |

> **Note:** The `embedded` widget leverages Obsidian's native embed registry, which automatically handles all file types that Obsidian can display. This includes markdown, images, PDFs, canvas files, audio/video, and even nested dashboards (.dash files via the custom embed factory registered by the plugin).

### Widget API for External Plugins

Other plugins can register custom widgets:

```typescript
// In another plugin's onload()
const pebbledash = this.app.plugins.getPlugin('obsidian-pebbledash');
if (pebbledash) {
  pebbledash.registerWidget('calendar', (ctx) => {
    return {
      mount() {
        // Render calendar into ctx.element
      },
      unmount() {
        // Clean up
      }
    };
  });
}
```

### Widget Selection

- Widget type is stored in `tile.meta.widgetType`
- If not specified, defaults to `"empty"` for new tiles
- Content reference stored in `tile.meta.contentRef`

---

## Tile Content Assignment

When a new tile is created (via split/insert), it starts as an empty placeholder. Users can assign content through multiple methods:

### Context Menu (Right-click)

- "Set content..." opens file picker modal
- "Tile settings..." opens tile configuration modal

### Drag and Drop

- Drag files from Obsidian's file explorer onto an empty tile
- Widget type is auto-detected from file extension
- Also works for dragging onto existing tiles (replaces content)

### Double-click

- Double-clicking an empty tile opens the file picker modal
- Quick way to assign content

---

## Link Handling

When a user clicks a link inside tile content (e.g., `[[Other Note]]`), the behavior is configurable:

### Options

| Behavior | Description |
|----------|-------------|
| `new-tab` | Open linked note in a new tab (dashboard stays open) |
| `replace-dashboard` | Navigate away from dashboard to the linked note |
| `replace-tile` | Replace the current tile's content with the linked note |

### Configuration Levels

1. **Vault default**: Set in plugin settings
2. **Dashboard override**: Set in `.dash` file `settings.linkBehavior`
3. **Tile override**: Set in `tile.meta.linkBehavior`

### Default

`new-tab` - keeps the dashboard open while allowing navigation

---

## File Reference Tracking

### Rename Tracking

- When a file referenced by a tile is renamed, the dashboard automatically updates
- Uses Obsidian's `vault.on('rename')` event
- Updates all dashboards that reference the renamed file

### Deleted File Handling

- If a referenced file is deleted, the tile shows an error placeholder
- Error displays: "File not found: `original/path/to/file.md`"
- User can reassign content via context menu or drag & drop

### Implementation

- Maintain an index of file → dashboard references
- Update index when dashboards are loaded/saved
- Listen to vault events for rename/delete

---

## Dashboard Nesting

Dashboards can embed other dashboards as tiles (recursive embedding). This is handled automatically by the `embedded` widget type using Obsidian's embed registry.

### Usage

```yaml
tiles:
  - id: "tile-1"
    meta:
      widgetType: "embedded"
      contentRef: "Dashboards/SubDashboard.dash"
```

### Cycle Detection

- Before rendering, check for circular references
- If cycle detected, show error: "Circular dashboard reference detected"
- Prevent infinite recursion

### Nested Dashboard Behavior

- Nested dashboards render in View mode only (no editing)
- Scrollable if content exceeds tile size
- Click-through to open nested dashboard in full view (configurable)

---

## Settings Hierarchy

Settings cascade from vault → dashboard → tile, with more specific levels overriding general ones.

### Vault-level Settings (Plugin Settings Tab)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `minTileWidth` | number | 10 | Minimum tile width (%) |
| `minTileHeight` | number | 10 | Minimum tile height (%) |
| `maxTileWidth` | number | 100 | Maximum tile width (%) |
| `maxTileHeight` | number | 100 | Maximum tile height (%) |
| `gutter` | number | 4 | Gap between tiles (px) |
| `borderWidth` | number | 1 | Tile border width (px) |
| `borderStyle` | string | "solid" | Border style |
| `borderColor` | string | "var(--background-modifier-border)" | Border color |
| `showHeaders` | boolean | true | Show tile headers by default |
| `defaultScrollBehavior` | string | "scroll" | Content overflow handling |
| `linkBehavior` | string | "new-tab" | Default link click behavior |
| `animationEnabled` | boolean | true | Enable animations |
| `animationDuration` | number | 200 | Animation duration (ms) |

### Dashboard-level Settings

Stored in the `.dash` file under `settings:`. Same options as vault-level, overrides vault defaults for that specific dashboard.

### Tile-level Settings

Stored in `tile.meta`. Available overrides:

| Setting | Description |
|---------|-------------|
| `showHeader` | Show/hide header for this tile |
| `linkBehavior` | Link click behavior for this tile |
| `scrollBehavior` | Overflow handling for this tile |
| `background` | Custom background color/style |
| `padding` | Custom padding |
| `constraints.minWidth` | Minimum width for this tile |
| `constraints.maxWidth` | Maximum width for this tile |
| `constraints.minHeight` | Minimum height for this tile |
| `constraints.maxHeight` | Maximum height for this tile |

---

## Commands and UI Entry Points

### Commands (Command Palette)

| Command ID | Name | Description |
|------------|------|-------------|
| `pebbledash:create-dashboard` | Create new dashboard | Creates a new .dash file |
| `pebbledash:toggle-edit-mode` | Toggle edit mode | Switch between View and Edit modes |
| `pebbledash:toggle-insert-resize` | Toggle insert/resize | In Edit mode, switch sub-modes |
| `pebbledash:undo` | Undo | Undo last dashboard change |
| `pebbledash:redo` | Redo | Redo last undone change |

### Ribbon Icon

- Icon in left ribbon to create a new dashboard
- Opens file name prompt, then creates and opens the dashboard

### File Explorer Context Menu

- Right-click folder → "New dashboard here"
- Creates dashboard in that folder

### Dashboard Toolbar

When a dashboard is open, show a toolbar with:

- Mode indicator (View / Edit)
- Edit mode toggle button
- Insert/Resize sub-mode toggle (when in Edit mode)
- Undo/Redo buttons
- Settings button (opens dashboard settings)

---

## Keyboard Shortcuts

Default shortcuts (user can override in Obsidian Hotkeys settings):

| Action | Default Shortcut |
|--------|------------------|
| Toggle edit mode | `Ctrl/Cmd + E` (when dashboard focused) |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` or `Ctrl + Y` |
| Delete tile | `Delete` or `Backspace` (when tile selected in Edit mode) |

---

## Real-time Updates

### File Change Detection

- Subscribe to `vault.on('modify')` for file content changes
- When a referenced file changes, trigger widget `update()` method
- Debounce rapid changes (100ms) for performance

### Dashboard Auto-save

- Auto-save dashboard changes after layout modifications
- Debounce saves (500ms) to avoid excessive writes
- Save on window blur / tab switch as backup

### Update Flow

```
File Modified → Check if referenced by any open dashboard
             → Find affected tiles
             → Call widget.update() for each tile
             → Widget re-renders content
```

---

## CSS Customization

### CSS Snippets (Global)

Standard Obsidian CSS snippets affect all dashboards. Target with selectors:

```css
/* All dashboards */
.pebbledash-container { }

/* All tiles */
.pebbledash-tile { }

/* Tile headers */
.pebbledash-tile-header { }

/* Specific widget types */
.pebbledash-widget-markdown { }
.pebbledash-widget-image { }

/* Edit mode indicators */
.pebbledash-container.edit-mode { }
.pebbledash-edge { }
.pebbledash-edge:hover { }
```

### Per-dashboard CSS Class

Set `cssclass` in dashboard settings:

```yaml
settings:
  cssclass: "my-dark-dashboard"
```

This adds the class to the dashboard container, allowing targeted styling:

```css
.my-dark-dashboard .pebbledash-tile {
  background: #1a1a1a;
}
```

---

## Mobile Support

### Full Feature Parity

- View mode: Full support
- Edit mode: Full support with touch-optimized interactions

### Touch Adaptations

- Larger touch targets for resize handles (minimum 44px)
- Long-press for context menu (instead of right-click)
- Pinch-to-zoom disabled on dashboard (to avoid conflicts with resize)
- Touch-friendly mode toggle buttons

### Responsive Behavior

- Minimum tile sizes adapt to screen size
- Consider larger minimums on mobile to ensure usability

---

## File Structure

```
src/
├── main.ts                    # Plugin entry point (lifecycle only)
├── types.ts                   # TypeScript interfaces
├── constants.ts               # Default values, CSS classes
├── settings.ts                # Plugin settings tab
├── settingDefinitions.ts      # Centralized setting definitions
├── settingsResolver.ts        # Settings cascade logic
├── yamlAdapter.ts             # YAML ↔ pebbledash snapshot conversion
├── fileTracker.ts             # Track file renames/deletes
├── dashEmbed.ts               # Nested dashboard embed factory
├── DashboardView/
│   ├── index.ts               # DashboardView class (custom view)
│   ├── toolbar.ts             # Edit mode toolbar
│   ├── contextMenu.ts         # Right-click context menus
│   ├── widgetBridge.ts        # Widget factory bridge
│   ├── fileOperations.ts      # File picking helpers
│   └── changeHandlers.ts      # State sync utilities
├── modals/
│   ├── index.ts               # Modal exports
│   ├── ConfirmModal.ts        # Confirmation dialogs
│   ├── DashboardSettingsModal.ts
│   ├── TileSettingsModal.ts
│   ├── FileSuggestModal.ts
│   ├── FolderSuggestModal.ts
│   ├── SaveAsModal.ts
│   └── settingHelpers.ts      # Shared modal helpers
├── widgets/
│   ├── index.ts               # Widget registry
│   ├── types.ts               # Widget interfaces
│   ├── helpers.ts             # Widget helper functions
│   ├── EmptyWidget.ts         # Placeholder for new tiles
│   ├── EmbeddedLeafWidget.ts  # Re-export from embeddedWidget
│   └── embeddedWidget/        # Embedded content widget
│       ├── index.ts           # Main widget lifecycle
│       ├── linkHandler.ts     # Link click handling
│       ├── editMode.ts        # Edit/preview toggling
│       ├── fitScaling.ts      # Content scaling for fit mode
│       └── embedRenderer.ts   # Native embed rendering
├── utils/
│   └── dragDrop.ts            # Drag & drop utilities
└── __tests__/                 # Unit tests
    └── settingsResolver.test.ts
```

---

## Implementation Status

All core features have been implemented. The phases below reflect the development history.

### Phase 1: Core Plugin Foundation ✅

1. ✅ Register `.dash` file extension with custom view
2. ✅ Implement YAML serialization adapter
3. ✅ Basic dashboard rendering with pebbledash
4. ✅ View/Edit mode toggle
5. ✅ Embedded widget using Obsidian's native embed registry

### Phase 2: Essential Widgets and Interactions ✅

6. ✅ Native embed support for all file types (via embedRegistry)
7. ✅ Tile content assignment (context menu, drag & drop, double-click)
8. ✅ Link handling with configurable behavior
9. ✅ Undo/redo integration

### Phase 3: Settings and Polish ✅

10. ✅ Plugin settings tab with vault defaults
11. ✅ Dashboard-level settings in .dash files
12. ✅ Tile-level setting overrides
13. ✅ Tile headers (optional)
14. ✅ File rename tracking

### Phase 4: Advanced Features ✅

15. ✅ Widget API for external plugins
16. ✅ Canvas preview (via native embed)
17. ✅ Dashboard nesting (up to 3 levels)
18. ✅ Mobile/touch support
19. ✅ Keyboard shortcuts (undo/redo)

---

## Dependencies

### Required

- `@pebbledash/core` - Headless dashboard layout engine
- `@pebbledash/renderer-dom` - DOM rendering utilities
- `js-yaml` - YAML parsing/serialization

### Bundling

All dependencies must be bundled into `main.js` per Obsidian plugin requirements.

---

## Open Questions / Future Considerations

1. **Search/Query Widget**: Should we build a Dataview-like query widget, or leave this to the widget API?
2. **Graph Widget**: Local graph view in a tile - feasibility depends on Obsidian API access
3. **Export**: Should dashboards be exportable as images or HTML?
4. **Collaboration**: Any considerations for sync/conflict resolution?

---

*This specification documents the complete feature set of the obsidian-pebbledash plugin.*


