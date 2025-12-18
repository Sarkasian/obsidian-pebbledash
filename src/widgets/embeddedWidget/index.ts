/**
 * Embedded widget - displays any file type using Obsidian's native embedRegistry.
 * 
 * This widget is future-proof: any new file type Obsidian adds will automatically work.
 * 
 * Module structure:
 * - index.ts - Main widget lifecycle and mount/unmount
 * - linkHandler.ts - Link click handling
 * - editMode.ts - Edit/preview mode toggling
 * - fitScaling.ts - Content scaling for fit mode
 * - embedRenderer.ts - Native embed rendering
 */

import { TFile } from 'obsidian';
import type { Widget, WidgetContext } from '../types';
import { CSS } from '../../constants';
import { setupDropZone } from '../../utils/dragDrop';
import { applyTileStyles } from '../../settingsResolver';
import { createTileHeader } from '../helpers';
import { renderUsingEmbed, type EmbedRendererContext } from './embedRenderer';
import { 
  createEditModeState,
  removeEditModeListeners,
  destroyEmbed,
  setLocked,
  type EditModeState,
  type EditModeContext,
} from './editMode';
import type { LinkHandlerContext } from './linkHandler';

/**
 * Creates an embedded widget that uses Obsidian's native embedRegistry.
 */
export function createEmbeddedLeafWidget(ctx: WidgetContext): Widget {
  const { tileId, element, meta, app, effectiveSettings } = ctx;
  const contentRef = meta.contentRef;

  // DOM elements
  let container: HTMLElement | null = null;
  let contentWrapper: HTMLElement | null = null;
  let editorWrapper: HTMLElement | null = null;

  // State
  let currentEmbed: any = null;
  let currentFile: TFile | null = null;
  let cleanupDropZone: (() => void) | null = null;
  let editModeState: EditModeState = createEditModeState();

  /**
   * Render empty state when no file is specified.
   */
  function renderEmptyState(): void {
    if (!container) return;

    container.addClass('pebbledash-widget-empty');
    const icon = container.createDiv({ cls: 'pebbledash-empty-icon' });
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;

    container.createDiv({ cls: 'pebbledash-empty-text', text: 'No file specified' });
    container.createDiv({ cls: 'pebbledash-empty-hint', text: 'Right-click to set content' });

    container.addEventListener('dblclick', () => {
      element.dispatchEvent(new CustomEvent('pebbledash:select-content', {
        bubbles: true,
        detail: { tileId }
      }));
    });

    // Set up drag and drop for empty state
    cleanupDropZone = setupDropZone(container, app, (filePath) => {
      element.dispatchEvent(new CustomEvent('pebbledash:set-content', {
        bubbles: true,
        detail: { tileId, contentRef: filePath, widgetType: 'embedded' }
      }));
    });
  }

  /**
   * Render error state when file is not found.
   */
  function renderErrorState(): void {
    if (!container) return;

    container.addClass(CSS.widgetError);
    container.createDiv({ cls: 'pebbledash-error-icon', text: '⚠️' });
    container.createDiv({ cls: 'pebbledash-error-message', text: `File not found: ${contentRef}` });
  }

  /**
   * Set up event handlers for the main content.
   */
  function setupEventHandlers(): void {
    if (!container || !contentWrapper || !currentFile) return;

    // Intercept clicks on content wrapper to prevent Obsidian's native click-to-edit
    contentWrapper.addEventListener('click', (e) => {
      if (!currentFile || editModeState.isEditing) return;

      const ext = currentFile.extension.toLowerCase();
      if (ext !== 'md') return;

      const target = e.target as HTMLElement;
      if (target.closest('a')) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, { capture: true });

    // Double-click behavior (only active in 'double-click' mode)
    container.addEventListener('dblclick', (e) => {
      if (!currentFile) return;
      
      // Only handle double-click in 'double-click' mode
      // In 'always' mode, content is already interactive - no action needed
      // In 'never' mode, interaction is disabled - no action needed
      if (effectiveSettings.interactionMode !== 'double-click') return;

      const ext = currentFile.extension.toLowerCase();

      if (ext === 'md' && !editModeState.isEditing) {
        e.preventDefault();
        e.stopPropagation();
        handleSetLocked(false);
      } else if (ext !== 'md') {
        app.workspace.getLeaf('tab').openFile(currentFile);
      }
    });

    // Set up drag and drop to replace content
    cleanupDropZone = setupDropZone(container, app, (filePath) => {
      element.dispatchEvent(new CustomEvent('pebbledash:set-content', {
        bubbles: true,
        detail: { tileId, contentRef: filePath, widgetType: 'embedded' }
      }));
    });
  }

  /**
   * Handle rendering using the embed registry.
   */
  async function handleRenderEmbed(): Promise<void> {
    if (!contentWrapper || !container || !currentFile) return;

    const linkHandlerCtx: LinkHandlerContext = {
      app,
      element,
      tileId,
      currentFile,
      linkBehavior: effectiveSettings.linkBehavior,
    };

    const embedCtx: EmbedRendererContext = {
      app,
      contentWrapper,
      container,
      currentFile,
      scrollBehavior: effectiveSettings.scrollBehavior,
      linkHandlerCtx,
      onEmbedChange: (embed) => { currentEmbed = embed; },
    };

    await renderUsingEmbed(embedCtx);
  }

  /**
   * Handle locked state changes.
   */
  async function handleSetLocked(locked: boolean): Promise<void> {
    if (!container || !contentWrapper || !editorWrapper || !currentFile) return;

    const editModeCtx: EditModeContext = {
      app,
      container,
      contentWrapper,
      editorWrapper,
      currentFile,
      currentEmbed,
      onEmbedChange: (embed) => { currentEmbed = embed; },
      onRenderPreview: handleRenderEmbed,
    };

    await setLocked(locked, editModeState, editModeCtx);
  }

  return {
    mount() {
      // Determine initial locked state based on interactionMode setting
      // 'always' = start unlocked, 'double-click' = start locked, 'never' = always locked
      const startLocked = effectiveSettings.interactionMode !== 'always';
      const lockedClass = startLocked ? 'is-locked' : '';
      container = element.createDiv({ cls: `${CSS.widget} pebbledash-widget-embedded ${lockedClass}`.trim() });
      
      // Initialize edit mode state based on interaction mode
      editModeState.isEditing = !startLocked;

      // Set the overflow class on the parent tile content element
      const tileContent = element.closest('.ud-tile-content');
      if (tileContent) {
        tileContent.classList.remove('pebbledash-overflow-scroll', 'pebbledash-overflow-clip', 'pebbledash-overflow-fit');
        const overflowClass = `pebbledash-overflow-${effectiveSettings.scrollBehavior}`;
        tileContent.classList.add(overflowClass);
      }

      // Show/hide embed link button based on setting
      if (!effectiveSettings.showEmbedLink) {
        container.addClass('pebbledash-hide-embed-link');
      }

      // Handle empty state
      if (!contentRef) {
        renderEmptyState();
        return;
      }

      // Get the file
      const file = app.vault.getAbstractFileByPath(contentRef);
      if (!file || !(file instanceof TFile)) {
        renderErrorState();
        return;
      }

      currentFile = file;

      // Store source file path on container for embedded scripts (e.g., Meta Bind)
      // This allows scripts to find the correct file context instead of using getActiveFile()
      container.dataset.pebbledashSourcePath = currentFile.path;

      // Handle seamless nested dashboards
      const isDashFile = currentFile.extension.toLowerCase() === 'dash';
      if (tileContent) {
        if (isDashFile && effectiveSettings.seamlessNested) {
          tileContent.classList.add('pebbledash-seamless-nested');
        } else {
          tileContent.classList.remove('pebbledash-seamless-nested');
        }
      }

      // Add header if enabled
      if (effectiveSettings.showHeader) {
        const header = createTileHeader(contentRef, tileId as string);
        element.insertBefore(header, container);
        tileContent?.classList.add('pebbledash-has-header');
      }

      // Apply tile-specific styles
      applyTileStyles(container, effectiveSettings);

      // Create wrappers
      contentWrapper = container.createDiv({ cls: 'pebbledash-embedded-content' });
      editorWrapper = container.createDiv({ cls: 'pebbledash-embedded-editor is-hidden' });

      // Set up event handlers
      setupEventHandlers();

      // Render using native embed
      handleRenderEmbed();
    },

    unmount() {
      removeEditModeListeners(editModeState);
      destroyEmbed(currentEmbed, editorWrapper);
      currentEmbed = null;

      if (cleanupDropZone) {
        cleanupDropZone();
        cleanupDropZone = null;
      }

      if (container) {
        container.remove();
        container = null;
      }

      contentWrapper = null;
      editorWrapper = null;
      currentFile = null;
      editModeState = createEditModeState();
    },

    update(newMeta) {
      if (newMeta.contentRef !== meta.contentRef) {
        this.unmount();
        Object.assign(meta, newMeta);
        this.mount();
      }
    },

    setLocked(locked: boolean): void {
      handleSetLocked(locked);
    },

    toggleLocked(): void {
      handleSetLocked(editModeState.isEditing);
    },

    isLocked(): boolean {
      return !editModeState.isEditing;
    }
  };
}

