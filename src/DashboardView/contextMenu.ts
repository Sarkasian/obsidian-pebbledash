/**
 * Context menu handling for dashboard tiles
 */

import { Menu, TFile } from 'obsidian';
import type { App } from 'obsidian';
import type { BaseDashboard } from '@pebbledash/renderer-dom';
import type { TileId, DashFile, DashboardMode, EditSubMode } from '../types';
import type { Widget } from '../widgets';

/**
 * Context for building the tile context menu
 */
export interface TileContextMenuContext {
  app: App;
  tileId: TileId;
  event: MouseEvent;
  mode: DashboardMode;
  editSubMode: EditSubMode;
  dashFile: DashFile | null;
  dashboard: BaseDashboard | null;
  activeWidgets: Map<string, Widget>;
}

/**
 * Callbacks for context menu actions
 */
export interface TileContextMenuCallbacks {
  setMode: (mode: DashboardMode) => void;
  setEditSubMode: (subMode: EditSubMode) => void;
  saveAndExit: () => void;
  confirmDiscard: () => void;
  saveAs: () => void;
  openDashboardSettings: () => void;
  openTileSettings: (tileId: TileId) => void;
  openFilePicker: (tileId: TileId) => void;
  deleteTile: (tileId: TileId) => void;
}

/**
 * Build and show the context menu for a tile
 */
export function showTileContextMenu(
  ctx: TileContextMenuContext,
  callbacks: TileContextMenuCallbacks
): void {
  const { app, tileId, event, mode, editSubMode, dashFile, dashboard, activeWidgets } = ctx;
  const menu = new Menu();

  // Dashboard mode controls (always available)
  if (mode === 'view') {
    menu.addItem((item) =>
      item
        .setTitle('Edit dashboard')
        .setIcon('pencil')
        .onClick(() => callbacks.setMode('edit'))
    );
    menu.addSeparator();
  } else {
    // Edit sub-mode options
    menu.addItem((item) =>
      item
        .setTitle('Insert mode')
        .setIcon('plus-square')
        .setChecked(editSubMode === 'insert')
        .onClick(() => callbacks.setEditSubMode('insert'))
    );

    menu.addItem((item) =>
      item
        .setTitle('Resize mode')
        .setIcon('move')
        .setChecked(editSubMode === 'resize')
        .onClick(() => callbacks.setEditSubMode('resize'))
    );

    menu.addSeparator();

    // Undo/Redo (uses pebbledash history which now includes content changes)
    const model = dashboard?.getModel();
    
    menu.addItem((item) =>
      item
        .setTitle('Undo')
        .setIcon('undo')
        .setDisabled(!model?.canUndo())
        .onClick(() => model?.undo())
    );

    menu.addItem((item) =>
      item
        .setTitle('Redo')
        .setIcon('redo')
        .setDisabled(!model?.canRedo())
        .onClick(() => model?.redo())
    );

    menu.addSeparator();
    
    // Save/Discard options
    menu.addItem((item) =>
      item
        .setTitle('Save and exit')
        .setIcon('save')
        .onClick(() => callbacks.saveAndExit())
    );

    menu.addItem((item) =>
      item
        .setTitle('Discard changes')
        .setIcon('x')
        .onClick(() => callbacks.confirmDiscard())
    );

    menu.addItem((item) =>
      item
        .setTitle('Save as...')
        .setIcon('file-plus')
        .onClick(() => callbacks.saveAs())
    );

    menu.addSeparator();
  }

  // Settings options (always available)
  menu.addItem((item) =>
    item
      .setTitle('Dashboard settings...')
      .setIcon('settings')
      .onClick(() => callbacks.openDashboardSettings())
  );

  menu.addItem((item) =>
    item
      .setTitle('Tile settings...')
      .setIcon('sliders')
      .onClick(() => callbacks.openTileSettings(tileId))
  );

  menu.addSeparator();

  // Tile-specific options
  menu.addItem((item) =>
    item
      .setTitle('Set content...')
      .setIcon('file-text')
      .onClick(() => callbacks.openFilePicker(tileId))
  );

  // Get the tile's content file for file options
  const tile = dashFile?.tiles.find(t => t.id === tileId);
  const contentRef = tile?.meta?.contentRef;
  if (contentRef) {
    const file = app.vault.getAbstractFileByPath(contentRef);
    if (file instanceof TFile) {
      menu.addSeparator();
      
      menu.addItem((item) =>
        item
          .setTitle('Edit tile')
          .setIcon('edit')
          .onClick(async () => {
            // Try to enable in-tile editing if the widget supports it
            const widget = activeWidgets.get(tileId as string);
            if (widget?.setLocked) {
              // Widget supports in-tile editing - use it
              widget.setLocked(false);
            } else {
              // Fallback: open file in new tab in source mode
              const leaf = app.workspace.getLeaf('tab');
              await leaf.openFile(file, { state: { mode: 'source' } });
            }
          })
      );
      
      menu.addItem((item) =>
        item
          .setTitle('Open in new tab')
          .setIcon('file-plus')
          .onClick(() => {
            app.workspace.getLeaf('tab').openFile(file);
          })
      );
      
      menu.addItem((item) =>
        item
          .setTitle('Open in new pane')
          .setIcon('separator-vertical')
          .onClick(() => {
            app.workspace.getLeaf('split').openFile(file);
          })
      );
    }
  }

  // Only show delete in edit mode
  if (mode === 'edit') {
    menu.addSeparator();

    menu.addItem((item) =>
      item
        .setTitle('Delete tile')
        .setIcon('trash-2')
        .onClick(() => callbacks.deleteTile(tileId))
    );
  }

  menu.showAtMouseEvent(event);
}

