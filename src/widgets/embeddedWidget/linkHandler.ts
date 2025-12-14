/**
 * Link handling for embedded widgets.
 * 
 * Handles link clicks based on linkBehavior settings and
 * disables Obsidian's native hover preview.
 */

import type { App, TFile } from 'obsidian';
import type { LinkBehavior, TileId } from '../../types';

export interface LinkHandlerContext {
  app: App;
  element: HTMLElement;
  tileId: TileId;
  currentFile: TFile | null;
  linkBehavior: LinkBehavior;
}

/**
 * Handle link clicks based on linkBehavior setting.
 */
export function handleLinkClick(
  ctx: LinkHandlerContext,
  href: string,
  event: MouseEvent
): void {
  const { app, element, tileId, currentFile, linkBehavior } = ctx;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  // Handle heading links within same file
  if (href.startsWith('#')) {
    return;
  }

  // Try to resolve as internal file
  const linkedFile = app.metadataCache.getFirstLinkpathDest(href, currentFile?.path ?? '');

  if (linkedFile) {
    // Internal link to a file
    switch (linkBehavior) {
      case 'new-tab':
        app.workspace.getLeaf('tab').openFile(linkedFile);
        break;
      case 'replace-dashboard':
        app.workspace.getLeaf(false).openFile(linkedFile);
        break;
      case 'replace-tile':
        // Dispatch event to update tile content
        element.dispatchEvent(new CustomEvent('pebbledash:set-content', {
          bubbles: true,
          detail: { tileId, contentRef: linkedFile.path, widgetType: 'embedded' }
        }));
        break;
    }
  } else if (href.startsWith('http://') || href.startsWith('https://')) {
    // External link - open in browser
    window.open(href, '_blank');
  }
}

/**
 * Set up click handlers for links in rendered content.
 * Disables Obsidian's page preview and handles clicks ourselves.
 */
export function setupLinkHandlers(
  contentWrapper: HTMLElement,
  ctx: LinkHandlerContext
): void {
  // Find all internal links and disable Obsidian's hover preview
  const internalLinks = contentWrapper.querySelectorAll('a.internal-link');
  internalLinks.forEach(link => {
    // Remove the internal-link class to disable Obsidian's page preview hover
    link.setAttribute('data-pebbledash-internal', 'true');
    link.classList.remove('internal-link');
    link.classList.add('pebbledash-internal-link');

    // Remove any hover-related attributes Obsidian uses
    link.removeAttribute('data-tooltip-position');

    // Add our own click handler directly to the link
    link.addEventListener('click', (e: Event) => {
      const href = link.getAttribute('href') || link.getAttribute('data-href') || '';
      handleLinkClick(ctx, href, e as MouseEvent);
    }, { capture: true });

    // Block mouseenter to prevent any hover preview
    link.addEventListener('mouseenter', (e: Event) => {
      e.stopPropagation();
    }, { capture: true });
  });

  // Handle external links
  const externalLinks = contentWrapper.querySelectorAll('a.external-link, a[href^="http"]');
  externalLinks.forEach(link => {
    link.addEventListener('click', (e: Event) => {
      const href = link.getAttribute('href') || '';
      handleLinkClick(ctx, href, e as MouseEvent);
    }, { capture: true });
  });

  // Also add a container-level capture handler as backup
  contentWrapper.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');

    if (!link) return;

    // Only handle if not already handled
    if (link.hasAttribute('data-pebbledash-handled')) return;
    link.setAttribute('data-pebbledash-handled', 'true');

    const href = link.getAttribute('href') || link.getAttribute('data-href') || '';
    if (!href) return;

    handleLinkClick(ctx, href, e);
  }, { capture: true });
}

