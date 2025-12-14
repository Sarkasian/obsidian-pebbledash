import type { Widget, WidgetContext } from './types';
import { CSS } from '../constants';
import { setupDropZone } from '../utils/dragDrop';

/**
 * Empty placeholder widget for new tiles
 * Supports drag and drop to set content
 */
export function createEmptyWidget(ctx: WidgetContext): Widget {
  const { element, tileId, app } = ctx;
  let container: HTMLElement | null = null;
  let cleanupDropZone: (() => void) | null = null;

  return {
    mount() {
      container = document.createElement('div');
      container.className = `${CSS.widget} ${CSS.widgetEmpty}`;
      
      const icon = document.createElement('div');
      icon.className = 'pebbledash-empty-icon';
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
      
      const text = document.createElement('div');
      text.className = 'pebbledash-empty-text';
      text.textContent = 'Empty tile';
      
      const hint = document.createElement('div');
      hint.className = 'pebbledash-empty-hint';
      hint.textContent = 'Drag a file here, right-click to configure, or double-click to select content';
      
      container.appendChild(icon);
      container.appendChild(text);
      container.appendChild(hint);
      element.appendChild(container);

      // Double-click to open file picker
      container.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        element.dispatchEvent(new CustomEvent('pebbledash:select-content', {
          bubbles: true,
          detail: { tileId }
        }));
      });
      
      // Set up drag and drop
      cleanupDropZone = setupDropZone(container, app, (filePath) => {
        element.dispatchEvent(new CustomEvent('pebbledash:set-content', {
          bubbles: true,
          detail: { 
            tileId, 
            contentRef: filePath, 
            widgetType: 'embedded' 
          }
        }));
      });
    },

    unmount() {
      if (cleanupDropZone) {
        cleanupDropZone();
        cleanupDropZone = null;
      }
      if (container) {
        container.remove();
        container = null;
      }
    },

    update() {
      // Empty widget doesn't need to update
    }
  };
}
