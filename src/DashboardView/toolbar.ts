/**
 * Edit toolbar construction and management for dashboard view
 */

/**
 * Toolbar button configuration
 */
export interface ToolbarButtonConfig {
  title: string;
  iconSvg: string;
  onClick: () => void;
  isActive?: boolean;
}

/**
 * SVG icons for toolbar buttons
 */
export const TOOLBAR_ICONS = {
  insert: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`,
  resize: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>`,
  undo: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  redo: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>`,
  save: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  discard: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  saveAs: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

/**
 * Create a toolbar button element
 */
export function createToolbarButton(config: ToolbarButtonConfig): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = `pebbledash-edit-toolbar-btn ${config.isActive ? 'is-active' : ''}`;
  btn.setAttribute('aria-label', config.title);
  btn.setAttribute('title', config.title);
  btn.innerHTML = config.iconSvg;
  btn.addEventListener('click', config.onClick);
  return btn;
}

/**
 * Create a toolbar separator element
 */
export function createToolbarSeparator(): HTMLDivElement {
  const sep = document.createElement('div');
  sep.className = 'pebbledash-edit-toolbar-separator';
  return sep;
}

/**
 * Callbacks for toolbar actions
 */
export interface ToolbarCallbacks {
  onInsertMode: () => void;
  onResizeMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveAndExit: () => void;
  onDiscard: () => void;
  onSaveAs: () => void;
  onSettings: () => void;
}

/**
 * Build the complete edit toolbar
 */
export function buildEditToolbar(
  callbacks: ToolbarCallbacks,
  editSubMode: 'insert' | 'resize'
): HTMLDivElement {
  const toolbar = document.createElement('div');
  toolbar.className = 'pebbledash-edit-toolbar';
  
  // Insert mode button
  toolbar.appendChild(createToolbarButton({
    title: 'Insert',
    iconSvg: TOOLBAR_ICONS.insert,
    onClick: callbacks.onInsertMode,
    isActive: editSubMode === 'insert',
  }));
  
  // Resize mode button
  toolbar.appendChild(createToolbarButton({
    title: 'Resize',
    iconSvg: TOOLBAR_ICONS.resize,
    onClick: callbacks.onResizeMode,
    isActive: editSubMode === 'resize',
  }));
  
  // Separator
  toolbar.appendChild(createToolbarSeparator());
  
  // Undo button
  toolbar.appendChild(createToolbarButton({
    title: 'Undo',
    iconSvg: TOOLBAR_ICONS.undo,
    onClick: callbacks.onUndo,
  }));
  
  // Redo button
  toolbar.appendChild(createToolbarButton({
    title: 'Redo',
    iconSvg: TOOLBAR_ICONS.redo,
    onClick: callbacks.onRedo,
  }));
  
  // Separator
  toolbar.appendChild(createToolbarSeparator());
  
  // Save button
  toolbar.appendChild(createToolbarButton({
    title: 'Save and exit',
    iconSvg: TOOLBAR_ICONS.save,
    onClick: callbacks.onSaveAndExit,
  }));
  
  // Discard button
  toolbar.appendChild(createToolbarButton({
    title: 'Discard changes',
    iconSvg: TOOLBAR_ICONS.discard,
    onClick: callbacks.onDiscard,
  }));
  
  // Separator
  toolbar.appendChild(createToolbarSeparator());
  
  // Save As button
  toolbar.appendChild(createToolbarButton({
    title: 'Save as...',
    iconSvg: TOOLBAR_ICONS.saveAs,
    onClick: callbacks.onSaveAs,
  }));
  
  // Separator
  toolbar.appendChild(createToolbarSeparator());
  
  // Dashboard settings button
  toolbar.appendChild(createToolbarButton({
    title: 'Dashboard settings',
    iconSvg: TOOLBAR_ICONS.settings,
    onClick: callbacks.onSettings,
  }));
  
  return toolbar;
}

