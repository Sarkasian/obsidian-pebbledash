# Changelog

All notable changes to the Pebbledash Dashboards plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No unreleased changes.

## [1.0.0] - 2025-12-13

### Added
- Initial release of Pebbledash Dashboards plugin
- Centralized setting definitions for DRY configuration (`settingDefinitions.ts`)
- **Tiled Dashboards**: Arrange any vault content in resizable tiles
- **View/Edit Modes**: Read-only view mode and interactive edit mode for layout changes
- **Native Obsidian Embedding**: Display markdown, images, PDFs, canvas files, and more
- **Nested Dashboards**: Embed dashboards within dashboards (up to 3 levels deep)
- **Flexible Settings**: Three-tier settings cascade (vault → dashboard → tile)
- **Drag and Drop**: Drag files from the file explorer onto tiles
- **Mobile Support**: Full touch support on iOS and Android

### Features
- Dashboard file format (`.dash`) using YAML
- Insert mode for splitting tiles
- Resize mode for adjusting tile sizes
- Undo/Redo support with keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
- File reference tracking (auto-update on rename)
- Configurable link behavior (new tab, replace dashboard, replace tile)
- Content overflow options (scroll, clip, fit)
- Animation settings
- Seamless nested dashboard mode
- Per-tile constraints and locked edges
- CSS customization support with custom classes
- Context menu for tile operations
- Toolbar in edit mode

### Settings
- Minimum/maximum tile size constraints
- Gutter (gap between tiles)
- Border width, style, and color
- Show/hide tile headers
- Show/hide embed link button
- Link click behavior
- Content overflow behavior
- Content interaction mode
- Animation enable/disable and duration
- Seamless nested dashboards
- Redistribute equally on Shift+drag

---

## Version History Format

### Types of Changes
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

[Unreleased]: https://github.com/pebbledash/obsidian-pebbledash/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/pebbledash/obsidian-pebbledash/releases/tag/v1.0.0
