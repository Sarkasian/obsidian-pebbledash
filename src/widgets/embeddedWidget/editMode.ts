/**
 * Edit mode handling for embedded widgets.
 * 
 * Manages the toggle between preview and edit modes for markdown files.
 */

import { Notice, TFile, App } from 'obsidian';

export interface EditModeState {
  isEditing: boolean;
  escapeHandler: ((e: KeyboardEvent) => void) | null;
  clickOutsideHandler: ((e: MouseEvent) => void) | null;
}

export interface EditModeContext {
  app: App;
  container: HTMLElement;
  contentWrapper: HTMLElement;
  editorWrapper: HTMLElement;
  currentFile: TFile;
  currentEmbed: any;
  onEmbedChange: (embed: any) => void;
  onRenderPreview: () => Promise<void>;
}

/**
 * Create initial edit mode state.
 */
export function createEditModeState(): EditModeState {
  return {
    isEditing: false,
    escapeHandler: null,
    clickOutsideHandler: null,
  };
}

/**
 * Add event listeners for exiting edit mode.
 */
export function addEditModeListeners(
  state: EditModeState,
  container: HTMLElement,
  onExit: () => void
): void {
  state.escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && state.isEditing) {
      e.preventDefault();
      e.stopPropagation();
      onExit();
    }
  };
  document.addEventListener('keydown', state.escapeHandler);

  state.clickOutsideHandler = (e: MouseEvent) => {
    if (!state.isEditing) return;

    const target = e.target as Node;
    if (!container.contains(target)) {
      onExit();
    }
  };
  setTimeout(() => {
    if (state.clickOutsideHandler) {
      document.addEventListener('click', state.clickOutsideHandler);
    }
  }, 100);
}

/**
 * Remove event listeners for edit mode.
 */
export function removeEditModeListeners(state: EditModeState): void {
  if (state.escapeHandler) {
    document.removeEventListener('keydown', state.escapeHandler);
    state.escapeHandler = null;
  }
  if (state.clickOutsideHandler) {
    document.removeEventListener('click', state.clickOutsideHandler);
    state.clickOutsideHandler = null;
  }
}

/**
 * Create native Obsidian editor for markdown files.
 */
export async function createNativeEditor(ctx: EditModeContext): Promise<void> {
  const { app, editorWrapper, currentFile, onEmbedChange } = ctx;

  // Only markdown files can be edited in-place
  if (currentFile.extension.toLowerCase() !== 'md') {
    // Open non-markdown files in a new tab
    app.workspace.getLeaf('tab').openFile(currentFile);
    return;
  }

  editorWrapper.empty();
  editorWrapper.removeClass('is-hidden');

  try {
    // Access Obsidian's embed registry (types in obsidian-internal.d.ts)
    const embedRegistry = app.embedRegistry;
    if (!embedRegistry) {
      throw new Error('embedRegistry not found');
    }

    const embedFactory = embedRegistry.embedByExtension?.['md'];
    if (!embedFactory) {
      throw new Error('md embed factory not found');
    }

    // Create an embed view for this file
    const embedView = embedFactory({
      app: app,
      containerEl: editorWrapper,
      linktext: currentFile.path,
      sourcePath: currentFile.path,
    }, currentFile, '');

    if (!embedView) {
      throw new Error('Failed to create embed view');
    }

    onEmbedChange(embedView);

    // Make it editable and show the editor
    // These are internal Obsidian APIs, cast to any for access
    const editableEmbed = embedView as any;
    editableEmbed.editable = true;

    if (typeof editableEmbed.showEditor === 'function') {
      editableEmbed.showEditor();
    }

    if (typeof editableEmbed.loadFile === 'function') {
      await editableEmbed.loadFile(currentFile);
    }

  } catch (err) {
    console.error('EmbeddedWidget: Failed to create native editor:', err);
    new Notice('Failed to create editor - opening in new tab');
    app.workspace.getLeaf('tab').openFile(currentFile);
  }
}

/**
 * Destroy the current embed instance.
 */
export function destroyEmbed(embed: any, editorWrapper: HTMLElement | null): void {
  if (embed) {
    if (typeof embed.unload === 'function') {
      embed.unload();
    }
  }

  if (editorWrapper) {
    editorWrapper.empty();
  }
}

/**
 * Set locked/editing state.
 * 
 * @param locked - Whether to lock (preview mode) or unlock (edit mode)
 * @param state - The edit mode state
 * @param ctx - The edit mode context
 */
export async function setLocked(
  locked: boolean,
  state: EditModeState,
  ctx: EditModeContext
): Promise<void> {
  const { container, contentWrapper, editorWrapper, currentEmbed, onEmbedChange, onRenderPreview } = ctx;

  state.isEditing = !locked;

  container.toggleClass('is-locked', locked);
  container.toggleClass('is-editing', !locked);

  if (locked) {
    // Switch to preview
    removeEditModeListeners(state);
    destroyEmbed(currentEmbed, editorWrapper);
    onEmbedChange(null);
    editorWrapper.addClass('is-hidden');
    await onRenderPreview();
  } else {
    // Switch to editor
    contentWrapper.addClass('is-hidden');
    await createNativeEditor(ctx);
    addEditModeListeners(state, container, () => {
      setLocked(true, state, ctx);
    });
  }
}

