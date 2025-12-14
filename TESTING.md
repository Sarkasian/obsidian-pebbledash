# Manual Testing Checklist for Settings

Use this checklist to verify settings functionality after making changes.

## Prerequisites

1. Build the plugin: `npm run build`
2. Restart Obsidian or reload the plugin
3. Create a test dashboard file (`.dash`)

---

## Dashboard Settings Modal

### Opening the Modal
- [ ] Right-click on any tile → "Dashboard settings..." opens modal
- [ ] In edit mode, click gear icon in toolbar → opens modal
- [ ] Modal width is adequate (no horizontal scrollbar needed)

### Gutter Setting
- [ ] Change gutter value (e.g., 0 → 16)
- [ ] Click Save
- [ ] Visual gap between tiles changes immediately
- [ ] Reload dashboard - gutter persists

### Show Headers Setting
- [ ] Set "Show tile headers" to ON at dashboard level
- [ ] Click Save
- [ ] All tiles show headers (unless individually overridden)
- [ ] Set "Show tile headers" to OFF
- [ ] Click Save  
- [ ] All tiles hide headers
- [ ] Headers appear/disappear without page reload

### Link Behavior Setting
- [ ] Set to "Open in new tab"
- [ ] Click a link in a markdown tile → opens in new tab
- [ ] Set to "Replace dashboard"
- [ ] Click a link → replaces dashboard view with linked file
- [ ] Set to "Replace tile"
- [ ] Click a link → tile content changes to linked file

### Border Settings
- [ ] Change border width (e.g., 1 → 3)
- [ ] Change border style (solid → dashed)
- [ ] Change border color
- [ ] Click Save
- [ ] Border changes visible on all tiles

### Animation Settings
- [ ] Disable animations
- [ ] Resize a tile → no animation
- [ ] Enable animations, set duration to 500ms
- [ ] Resize a tile → slow animation

### Reset Buttons
- [ ] Change a setting, click reset button
- [ ] Value reverts to vault default

---

## Tile Settings Modal

### Opening the Modal
- [ ] Right-click on a tile → "Tile settings..." opens modal
- [ ] Modal displays current tile settings

### Show Header (per-tile)
- [ ] Set dashboard default to OFF
- [ ] Open tile settings for one tile
- [ ] Set "Show header" to ON for that tile
- [ ] Click Save
- [ ] Only that tile shows header, others still hidden
- [ ] Click reset button on tile's show header
- [ ] Tile now inherits dashboard setting (header hidden)

### Link Behavior (per-tile)
- [ ] Set dashboard link behavior to "new-tab"
- [ ] Override one tile to "replace-tile"
- [ ] Click Save
- [ ] Click link in overridden tile → replaces tile content
- [ ] Click link in other tile → opens new tab

### Content Overflow (per-tile)
- [ ] Set to "scroll" - content scrolls within tile
- [ ] Set to "clip" - overflow hidden
- [ ] Set to "fit" - content scaled to fit

### Background and Padding
- [ ] Set background to a CSS value (e.g., `#ff0000`)
- [ ] Set padding (e.g., `16px`)
- [ ] Click Save
- [ ] Tile shows custom background and padding

### Size Constraints
- [ ] Set minimum width to 20%
- [ ] Set maximum width to 50%
- [ ] Click Save
- [ ] Try to resize tile below minimum → prevented
- [ ] Try to resize tile above maximum → prevented

### Locked Edges
- [ ] Enable "Lock Top" checkbox
- [ ] Click Save
- [ ] Try to resize tile from top edge → edge should be locked
- [ ] Enable multiple edges (e.g., Top and Left)
- [ ] Verify both edges are locked

---

## Inheritance Tests

### Vault → Dashboard Cascade
- [ ] Set vault default `linkBehavior: 'new-tab'`
- [ ] Create new dashboard (no settings)
- [ ] Verify tiles use 'new-tab' behavior

### Dashboard → Tile Cascade
- [ ] Set dashboard `showHeaders: false`
- [ ] Verify all tiles inherit (no headers shown)
- [ ] Override one tile to `showHeader: true`
- [ ] Only overridden tile shows header

### Reset Cascade
- [ ] With tile override active, click reset
- [ ] Tile should now inherit from dashboard
- [ ] With dashboard override active, click reset
- [ ] Dashboard should now inherit from vault

---

## Persistence Tests

### Dashboard Settings Persistence
- [ ] Change gutter to 12
- [ ] Save and close dashboard
- [ ] Reopen dashboard
- [ ] Gutter is still 12

### Tile Settings Persistence
- [ ] Set tile background to `#0000ff`
- [ ] Save dashboard
- [ ] Close and reopen
- [ ] Tile still has blue background

### Constraints Persistence
- [ ] Set locked edges on a tile
- [ ] Save, close, reopen
- [ ] Locked edges still active

---

## Bug Fix Verification

These tests verify specific bugs that were fixed:

### Modal Scrollbar Fix
- [ ] Open Dashboard Settings modal
- [ ] Modal should NOT have horizontal scrollbar
- [ ] All settings visible without horizontal scrolling

### Link Behavior Fix (Capture Phase)
- [ ] Set dashboard link behavior to "Replace tile content"
- [ ] Add a markdown tile with internal links
- [ ] Click an internal link
- [ ] **Expected**: Tile content changes to linked file (NOT opens in new tab)
- [ ] Set to "Replace dashboard" 
- [ ] Click an internal link
- [ ] **Expected**: Dashboard view replaced with linked file

### Content Overflow Fix
- [ ] Open tile settings
- [ ] Set "Content overflow" to "Clip"
- [ ] Add content that exceeds tile size
- [ ] **Expected**: Content is clipped (no scrollbars)
- [ ] Change to "Scroll"
- [ ] **Expected**: Scrollbars appear for overflow content

### Animation Enable/Disable Fix
- [ ] Open dashboard settings
- [ ] Disable animations
- [ ] Resize a tile in edit mode
- [ ] **Expected**: Tile moves instantly (no animation)
- [ ] Enable animations
- [ ] Resize a tile
- [ ] **Expected**: Tile animates smoothly

### Locked Zones Fix
- [ ] Open tile settings
- [ ] Enable "Lock Top" edge
- [ ] Save and enter edit mode
- [ ] Hover over top edge
- [ ] **Expected**: Edge appears disabled (different color)
- [ ] Try to drag top edge
- [ ] **Expected**: Resize is blocked

---

## Run Unit Tests

```bash
npm test
```

All 17 tests should pass.

