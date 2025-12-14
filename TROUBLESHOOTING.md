# Troubleshooting Guide

This guide helps resolve common issues when using the Pebbledash Dashboards plugin for Obsidian.

## Table of Contents

- [Common Issues](#common-issues)
  - [Dashboard Not Loading](#dashboard-not-loading)
  - [Tiles Not Rendering](#tiles-not-rendering)
  - [Content Not Displaying](#content-not-displaying)
  - [Resize Not Working](#resize-not-working)
  - [Links Not Working](#links-not-working)
  - [Settings Not Applying](#settings-not-applying)
  - [Nested Dashboards Issues](#nested-dashboards-issues)
  - [Mobile Issues](#mobile-issues)
- [Error Messages](#error-messages)
- [Performance Issues](#performance-issues)
- [Debugging Tips](#debugging-tips)
- [Getting Help](#getting-help)

---

## Common Issues

### Dashboard Not Loading

**Symptom:** Opening a `.dash` file shows a blank view or error.

**Solutions:**

1. **Check YAML syntax**
   - Open the file as text (right-click → **Open with default app** or use another editor)
   - Validate the YAML structure - even small typos can break parsing
   - Ensure `version: 2` is present

   ```yaml
   # Correct structure
   settings:
     gutter: 8
   
   version: 2
   tiles:
     - id: tile-1
       x: 0
       y: 0
       width: 100
       height: 100
   ```

2. **Check plugin is enabled**
   - Go to **Settings → Community plugins**
   - Ensure "Pebbledash Dashboards" is enabled

3. **Reload the plugin**
   - Disable and re-enable the plugin
   - Or restart Obsidian (`Ctrl/Cmd + R`)

### Tiles Not Rendering

**Symptom:** Dashboard loads but tiles appear empty or show errors.

**Solutions:**

1. **Check tile coordinates**
   - All coordinates are percentages (0-100)
   - Tiles should not overlap
   - Tiles should cover the full 100% area
   
   ```yaml
   # Valid: Two tiles side by side
   tiles:
     - id: left
       x: 0
       y: 0
       width: 50
       height: 100
     - id: right
       x: 50
       y: 0
       width: 50
       height: 100
   ```

2. **Verify tile IDs are unique**
   - Each tile must have a distinct `id`
   - Duplicate IDs cause rendering issues

3. **Check for valid widgetType**
   - Use `empty` or `embedded`
   - Custom widget types only work if registered by another plugin

### Content Not Displaying

**Symptom:** Tile shows "File not found" or is empty despite having a contentRef.

**Solutions:**

1. **Verify the file exists**
   - Check that the path in `contentRef` matches an actual file
   - Paths are relative to the vault root
   - File names are case-sensitive on some systems

2. **Check file extension**
   - Obsidian must be able to display the file type
   - Common supported types: `.md`, `.png`, `.jpg`, `.pdf`, `.canvas`

3. **Update the reference**
   - Right-click the tile → **Set content...**
   - Select the file using the file picker

4. **Check if file was renamed/moved**
   - The plugin tracks file renames automatically
   - If the file was renamed outside Obsidian, update the reference manually

### Resize Not Working

**Symptom:** Dragging tile edges doesn't change tile sizes.

**Solutions:**

1. **Ensure you're in Edit mode + Resize sub-mode**
   - Right-click any tile → **Edit dashboard**
   - In the toolbar, select **Resize** mode (not Insert)

2. **Check minimum tile size**
   - Tiles cannot be smaller than the configured minimum
   - Default: 10% width and height
   - Adjust in **Settings → Pebbledash Dashboards**

3. **Check for locked edges**
   - Right-click tile → **Tile settings...**
   - Look at "Locked edges" section
   - Unlock any edges you want to resize

4. **Verify the edge is resizable**
   - Disabled edges show a "not-allowed" cursor
   - The resize range may be too small if tiles are near minimum size

### Links Not Working

**Symptom:** Clicking links in tiles doesn't do anything or behaves unexpectedly.

**Solutions:**

1. **Check link behavior setting**
   - **Settings → Pebbledash Dashboards → Link behavior**
   - Options:
     - **Open in new tab** - Opens link in new Obsidian tab
     - **Replace dashboard** - Navigates away from dashboard
     - **Replace tile** - Changes tile content to linked file

2. **Check interaction mode**
   - If set to "double-click" or "never", links may require double-clicking
   - Adjust in dashboard or tile settings

3. **Verify it's an internal link**
   - External URLs may behave differently
   - Internal `[[wiki-links]]` should work with the configured behavior

### Settings Not Applying

**Symptom:** Changed settings don't seem to take effect.

**Solutions:**

1. **Save the settings**
   - Click **Save** in the modal before closing
   - Dashboard settings require clicking Save in the edit toolbar

2. **Check the settings cascade**
   - Tile settings override dashboard settings
   - Dashboard settings override vault settings
   - Check if there's an override at a more specific level

3. **Refresh the dashboard**
   - Close and reopen the dashboard file
   - Or toggle edit mode off and on

4. **Check for unsaved changes indicator**
   - In edit mode, unsaved changes show in the toolbar
   - Click **Save and exit** to persist changes

### Nested Dashboards Issues

**Symptom:** Embedded `.dash` files not rendering correctly.

**Solutions:**

1. **Check nesting depth**
   - Maximum nesting depth is 3 levels
   - Deeper nesting shows an error message

2. **Check for circular references**
   - Dashboard A embedding Dashboard B which embeds Dashboard A
   - This will show a "Circular reference detected" error

3. **Seamless mode not working**
   - Enable in **Tile settings → Seamless nested dashboard**
   - Or set globally in **Settings → Pebbledash Dashboards → Seamless nested dashboards**

4. **Nested dashboard appears too small**
   - Resize the parent tile to give more space
   - Check if the nested dashboard has its own minimum tile sizes

### Mobile Issues

**Symptom:** Touch interactions not working correctly on iOS/Android.

**Solutions:**

1. **Use tap and hold for context menu**
   - Right-click menu opens with long press on mobile

2. **Edit mode gestures**
   - Tap tile edges to select for resize
   - Drag after selection to resize

3. **Check Obsidian mobile app version**
   - Ensure you have the latest version
   - Some older versions may have touch event issues

---

## Error Messages

### "File not found: path/to/file.md"

The referenced file doesn't exist at the specified path.

**Fix:** Update the content reference via right-click → **Set content...**

### "Circular dashboard reference detected"

A nested dashboard creates an infinite loop.

**Fix:** Edit the dashboard file to remove the circular reference.

### "Maximum nesting depth exceeded"

Dashboard nesting exceeds 3 levels.

**Fix:** Restructure your dashboards to reduce nesting depth.

### "Invalid YAML"

The `.dash` file contains malformed YAML.

**Fix:** Check YAML syntax. Common issues:
- Missing colons after keys
- Incorrect indentation (use spaces, not tabs)
- Unquoted special characters

### "Widget type not found: xxx"

An unknown widget type is specified in tile meta.

**Fix:** Use `empty` or `embedded`, or ensure the custom widget plugin is installed.

---

## Performance Issues

### Dashboard Loading Slowly

1. **Reduce number of tiles**
   - Large dashboards (20+ tiles) may load slower
   
2. **Optimize embedded content**
   - Large markdown files take longer to render
   - Consider linking to files instead of embedding

3. **Disable animations**
   - **Settings → Pebbledash Dashboards → Enable animations** → Off

### Laggy Resize

1. **Reduce animation duration**
   - **Settings → Animation duration** → Lower value (e.g., 100ms)

2. **Disable redistribute equally**
   - This feature adds computation during resize

### High Memory Usage

1. **Close unused dashboards**
   - Each open dashboard maintains its own state

2. **Limit embedded content size**
   - Very large files embedded in tiles consume memory

---

## Debugging Tips

### Enable Developer Console

1. Press `Ctrl/Cmd + Shift + I` to open developer tools
2. Look for errors starting with `[Pebbledash]` or in the console
3. Filter by "pebbledash" to see plugin-specific logs

### Check the .dash File Contents

1. Right-click the file → **Open with default app** (or use VS Code)
2. Verify the YAML structure is correct
3. Check that tile coordinates add up correctly

### Test with a Minimal Dashboard

Create a new, simple dashboard to isolate the issue:

```yaml
version: 2
tiles:
  - id: test
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      widgetType: empty
```

### Reset to Vault Defaults

If settings seem corrupted:

1. Open dashboard settings
2. Click the reset button on each setting
3. Save the dashboard

### Check Plugin Data

The plugin stores data in `<vault>/.obsidian/plugins/obsidian-pebbledash/data.json`. 

If settings seem broken, you can:
1. Close Obsidian
2. Delete or rename `data.json`
3. Restart Obsidian (settings will reset to defaults)

---

## Getting Help

If you can't resolve an issue:

1. **Search existing issues** on [GitHub Issues](https://github.com/pebbledash/obsidian-pebbledash/issues)

2. **Open a new issue** with:
   - Obsidian version (Settings → About)
   - Plugin version
   - Steps to reproduce
   - Expected vs actual behavior
   - Console errors (if any)
   - Sample `.dash` file (if relevant)

3. **Check the documentation**
   - [README.md](README.md) - Overview and quick start
   - [SPEC.md](SPEC.md) - Technical specification
   - [SETTINGS.md](SETTINGS.md) - Settings cascade documentation
   - [WIDGETS.md](WIDGETS.md) - Widget API for developers

---

## Useful Console Commands

Open the developer console (`Ctrl/Cmd + Shift + I`) and use these snippets:

```javascript
// Get current dashboard view
const view = app.workspace.getActiveViewOfType(
  app.viewRegistry.getViewCreatorByType('pebbledash-dashboard-view')
);

// Check plugin settings
const plugin = app.plugins.getPlugin('obsidian-pebbledash');
console.log(plugin.settings);

// List registered widget types
console.log(Object.keys(plugin.widgetRegistry || {}));
```

