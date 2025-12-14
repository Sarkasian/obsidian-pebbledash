# Pebbledash Dashboards for Obsidian

Create beautiful, resizable dashboards to display your vault content in tiled layouts.

![Obsidian](https://img.shields.io/badge/Obsidian-1.0.0+-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Tiled Dashboards**: Arrange any vault content in resizable tiles
- **View/Edit Modes**: Read-only view mode and interactive edit mode for layout changes
- **Native Obsidian Embedding**: Display markdown, images, PDFs, canvas files, and more
- **Nested Dashboards**: Embed dashboards within dashboards (up to 3 levels deep)
- **Flexible Settings**: Three-tier settings cascade (vault → dashboard → tile)
- **Drag and Drop**: Drag files from the file explorer onto tiles
- **Mobile Support**: Full touch support on iOS and Android

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open **Settings → Community plugins**
2. Select **Browse** and search for "Pebbledash Dashboards"
3. Select **Install**, then **Enable**

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder: `<vault>/.obsidian/plugins/obsidian-pebbledash/`
3. Copy the downloaded files into that folder
4. Restart Obsidian
5. Enable the plugin in **Settings → Community plugins**

## Quick Start

### Creating a Dashboard

1. Click the dashboard icon in the left ribbon, or
2. Use the command palette: **Pebbledash: Create new dashboard**, or
3. Right-click a folder → **New dashboard here**

### Adding Content to Tiles

- **Drag and drop**: Drag any file from the file explorer onto a tile
- **Right-click menu**: Right-click a tile → **Set content...**
- **Double-click**: Double-click an empty tile to open the file picker

### Editing the Layout

1. Right-click any tile → **Edit dashboard** (or use command palette)
2. Choose a mode:
   - **Insert mode**: Click tile edges to split and create new tiles
   - **Resize mode**: Drag tile edges to resize
3. When finished, click **Save and exit** in the toolbar

## Dashboard File Format

Dashboards are stored as `.dash` files containing YAML. Example:

```yaml
settings:
  gutter: 8
  showHeaders: true
  linkBehavior: new-tab

version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 50
    height: 100
    meta:
      widgetType: embedded
      contentRef: Notes/Welcome.md
  - id: tile-2
    x: 50
    y: 0
    width: 50
    height: 100
    meta:
      widgetType: embedded
      contentRef: Assets/photo.png
```

## Configuration

### Vault Settings

Configure default settings for all dashboards in **Settings → Pebbledash Dashboards**:

| Setting | Description | Default |
|---------|-------------|---------|
| Minimum tile width/height | Smallest tile size (%) | 10% |
| Maximum tile width/height | Largest tile size (%) | 100% |
| Gutter | Gap between tiles (px) | 4 |
| Border width/style/color | Tile border appearance | 1px solid |
| Show tile headers | Display filename headers | On |
| Content overflow | scroll / clip / fit | clip |
| Link behavior | new-tab / replace-dashboard / replace-tile | new-tab |
| Content interaction | always / double-click / never | always |
| Enable animations | Animate tile transitions | On |
| Animation duration | Transition speed (ms) | 200 |
| Seamless nested dashboards | Remove borders from nested dashboards | Off |
| Redistribute equally | Proportional resize with Shift+drag | Off |

### Dashboard Settings

Override vault defaults for a specific dashboard:

1. Right-click any tile → **Dashboard settings...**
2. Adjust settings (they show "(vault default: X)" for reference)
3. Use the reset button to revert to vault default

### Tile Settings

Override settings for individual tiles:

1. Right-click a tile → **Tile settings...**
2. Configure content, appearance, behavior, and size constraints
3. Lock specific edges to prevent resizing

## Commands

| Command | Description |
|---------|-------------|
| Create new dashboard | Create a new `.dash` file |
| Toggle dashboard edit mode | Switch between view and edit modes |
| Dashboard: Insert mode | Switch to insert sub-mode (in edit mode) |
| Dashboard: Resize mode | Switch to resize sub-mode (in edit mode) |

## Keyboard Shortcuts

When a dashboard is focused:

| Action | Shortcut |
|--------|----------|
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` or `Ctrl + Y` |

## Link Behavior

Configure what happens when clicking links inside tiles:

- **Open in new tab**: Opens the linked note in a new tab (dashboard stays open)
- **Replace dashboard**: Navigates away from the dashboard to the linked note
- **Replace tile**: Replaces the current tile's content with the linked note

## Content Types

Pebbledash supports embedding any file type that Obsidian can display:

- Markdown notes (`.md`)
- Images (`.png`, `.jpg`, `.gif`, `.svg`, etc.)
- PDFs (`.pdf`)
- Canvas files (`.canvas`)
- Audio/Video files
- Other dashboards (`.dash`) - creates nested dashboards
- Any other file type with a registered embed handler

## Nested Dashboards

Embed dashboards within dashboards:

1. Set a tile's content to another `.dash` file
2. The nested dashboard renders in view-only mode
3. Nesting is limited to 3 levels to prevent recursion

**Seamless mode**: Enable "Seamless nested dashboards" to remove borders and make nested tiles blend with the parent layout.

## CSS Customization

### Global Styling

Use CSS snippets to style all dashboards:

```css
/* All dashboards */
.pebbledash-container { }

/* All tiles */
.pebbledash-dashboard .ud-tile-content { }

/* Tile headers */
.pebbledash-tile-header { }

/* Empty tiles */
.pebbledash-widget-empty { }
```

### Per-Dashboard Styling

Add a custom CSS class in dashboard settings:

```yaml
settings:
  cssclass: my-dark-dashboard
```

Then target it in your CSS snippet:

```css
.my-dark-dashboard .ud-tile-content {
  background: var(--background-secondary);
}
```

## Known Limitations

- **No real-time file sync**: Tiles don't automatically update when source files change (reload dashboard to refresh)
- **No graph widget**: Cannot embed the graph view in tiles
- **No search/query widget**: Dataview-style queries are not built-in
- **Nested dashboard editing**: Nested dashboards are view-only; edit the source file directly

## Troubleshooting

### Tiles not rendering

1. Ensure the dashboard file is valid YAML
2. Check the developer console for errors (`Ctrl/Cmd + Shift + I`)
3. Try creating a new dashboard

### File not found errors

- The referenced file may have been moved or deleted
- Right-click the tile → **Set content...** to select a new file

### Resize not working

- Ensure you're in **Edit mode** with **Resize sub-mode** selected
- Check if the tile has locked edges in **Tile settings**
- Tiles cannot be smaller than the minimum size setting

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build

# Run tests
npm test

# Generate API documentation
npm run docs
```

### Project Structure

```
src/
├── main.ts              # Plugin entry point (lifecycle only)
├── constants.ts         # Constants and defaults
├── types.ts             # TypeScript interfaces
├── settings.ts          # Plugin settings tab
├── settingDefinitions.ts # Centralized setting definitions
├── settingsResolver.ts  # Settings cascade logic
├── yamlAdapter.ts       # YAML serialization
├── dashEmbed.ts         # Nested dashboard embedding
├── fileTracker.ts       # File rename/delete tracking
├── DashboardView/       # Dashboard view implementation
│   ├── index.ts         # Main DashboardView class
│   ├── toolbar.ts       # Edit mode toolbar
│   ├── contextMenu.ts   # Right-click menus
│   └── widgetBridge.ts  # Pebbledash widget integration
├── modals/              # Modal dialogs
│   ├── ConfirmModal.ts
│   ├── DashboardSettingsModal.ts
│   ├── TileSettingsModal.ts
│   └── ...
├── widgets/             # Widget implementations
│   ├── EmptyWidget.ts
│   ├── EmbeddedLeafWidget.ts
│   └── embeddedWidget/  # Embedded widget sub-modules
└── utils/               # Utility functions
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- Powered by [@pebbledash/core](https://github.com/pebbledash/pebbledash) - headless dashboard engine
- Built for [Obsidian](https://obsidian.md)

---

**Need help?** Open an issue on GitHub or check the [SPEC.md](SPEC.md) for detailed technical documentation.
