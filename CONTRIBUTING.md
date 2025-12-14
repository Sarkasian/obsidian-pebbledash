# Contributing to Pebbledash Dashboards for Obsidian

Thank you for your interest in contributing to the Pebbledash Dashboards plugin! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- An Obsidian vault for testing

### Getting Started

1. Fork and clone the repository into your Obsidian vault's plugins folder:
   ```bash
   cd <your-vault>/.obsidian/plugins/
   git clone https://github.com/your-username/obsidian-pebbledash.git
   cd obsidian-pebbledash
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. Restart Obsidian and enable the plugin in **Settings → Community plugins**

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Build with watch mode (auto-rebuild on changes) |
| `npm run build` | Production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

### Development Workflow

1. Run `npm run dev` to start watch mode
2. Make changes to source files
3. Reload Obsidian (Ctrl/Cmd + R) to see changes
4. Check the developer console for errors (Ctrl/Cmd + Shift + I)

## Code Style

This project uses TypeScript with ESLint for linting.

### Key Style Guidelines

- Use TypeScript with strict mode
- Keep `main.ts` focused on plugin lifecycle only
- Split functionality into separate modules
- Prefer `async/await` over promise chains
- Use Obsidian's `register*` helpers for cleanup
- Add JSDoc comments to public APIs

### Running Linters

```bash
# Install ESLint globally if not installed
npm install -g eslint

# Run ESLint
eslint ./src/
```

## Project Structure

```
obsidian-pebbledash/
├── src/
│   ├── main.ts              # Plugin entry point (lifecycle only)
│   ├── types.ts             # TypeScript interfaces
│   ├── constants.ts         # Constants and defaults
│   ├── settings.ts          # Plugin settings tab
│   ├── settingsResolver.ts  # Settings cascade logic
│   ├── settingDefinitions.ts # Centralized setting definitions
│   ├── yamlAdapter.ts       # YAML serialization
│   ├── fileTracker.ts       # File rename/delete tracking
│   ├── dashEmbed.ts         # Nested dashboard embedding
│   ├── DashboardView/       # Main view implementation
│   │   ├── index.ts         # DashboardView class
│   │   ├── toolbar.ts       # Edit toolbar
│   │   ├── contextMenu.ts   # Right-click menus
│   │   └── widgetBridge.ts  # Pebbledash widget integration
│   ├── modals/              # Modal dialogs
│   ├── widgets/             # Widget implementations
│   │   ├── index.ts         # Widget registry
│   │   ├── EmptyWidget.ts   # Empty tile placeholder
│   │   ├── EmbeddedLeafWidget.ts
│   │   └── embeddedWidget/  # Embedded content rendering
│   └── utils/               # Utility functions
├── styles.css               # Plugin styles
├── manifest.json            # Obsidian plugin manifest
└── esbuild.config.mjs       # Build configuration
```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-canvas-widget` - New features
- `fix/tile-resize-bug` - Bug fixes
- `docs/update-readme` - Documentation updates

### Commit Messages

Follow conventional commit format:

```
type(scope): description
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

Examples:
```
feat(widgets): add canvas preview widget
fix(resize): correct minimum tile size calculation
docs(readme): add keyboard shortcuts section
```

## Testing

### Manual Testing

1. Create test dashboards with various layouts
2. Test all edit operations (split, resize, delete)
3. Test on both desktop and mobile
4. Verify undo/redo works correctly
5. Test with different Obsidian themes

### Unit Tests

```bash
npm test
```

Tests are located in `src/__tests__/`.

## Pull Request Process

1. **Create a feature branch** from `main`

2. **Make your changes** following the code style guidelines

3. **Test thoroughly** in Obsidian

4. **Update documentation** if needed

5. **Submit a pull request** with:
   - Clear title describing the change
   - Description of what was changed and why
   - Screenshots/GIFs for UI changes

### PR Checklist

- [ ] Code builds without errors (`npm run build`)
- [ ] TypeScript types are correct (`npm run typecheck`)
- [ ] Tested in Obsidian (desktop)
- [ ] Tested on mobile (if applicable)
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG.md updated

## Obsidian Plugin Guidelines

When contributing, please follow [Obsidian's plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines):

- No network requests without user consent
- No hidden telemetry
- Clean up all listeners on unload
- Respect user privacy
- Keep the plugin lightweight

## Reporting Issues

### Bug Reports

Include:
- Obsidian version
- Plugin version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

### Feature Requests

Include:
- Description of the feature
- Use case / motivation
- Mockups or examples (if applicable)

## Related Projects

This plugin depends on the core pebbledash layout engine:

- **[@pebbledash/core](https://github.com/pebbledash/pebbledash)** - Headless dashboard layout engine
- **[@pebbledash/renderer-dom](https://github.com/pebbledash/pebbledash)** - DOM rendering utilities

If your contribution involves changes to the layout engine itself (resize logic, split algorithms, constraint handling), please contribute to the core pebbledash repository instead.

## Widget Development

Want to create a custom widget for Pebbledash? See:
- [WIDGETS.md](WIDGETS.md) - External widget API documentation
- [Widget Development Guide](https://github.com/pebbledash/pebbledash/blob/main/docs/widget-development-guide.md) - Core widget concepts

## Common Development Tasks

### Adding a New Setting

1. Add the type to `types.ts` (PebbledashSettings, DashboardSettings, or ObsidianTileMeta)
2. Add the default value to `constants.ts` (DEFAULT_SETTINGS)
3. Add cascade logic to `settingsResolver.ts`
4. Add the UI control to `settings.ts` (vault settings) and/or modals
5. Add tests to `settingsResolver.test.ts`
6. Update SETTINGS.md documentation

### Adding a New Command

1. Add the command in `main.ts` using `this.addCommand()`
2. Use a stable command ID (don't rename after release)
3. Document in README.md

### Debugging

1. Open Obsidian's developer console: `Ctrl/Cmd + Shift + I`
2. Filter console by "pebbledash" for plugin-specific logs
3. Use `console.log()` during development (remove before PR)

## Questions?

If you have questions about contributing:
- Open a discussion on GitHub
- Check existing issues

Thank you for contributing!

