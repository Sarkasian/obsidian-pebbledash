/**
 * Embed rendering using Obsidian's native embedRegistry.
 * 
 * Renders any file type that Obsidian supports - markdown, images,
 * PDFs, audio, video, canvas, excalidraw, etc.
 */

import type { App, TFile } from 'obsidian';
import type { ScrollBehavior } from '../../types';
import { setupLinkHandlers, type LinkHandlerContext } from './linkHandler';
import { applyFitScaling } from './fitScaling';

export interface EmbedRendererContext {
  app: App;
  contentWrapper: HTMLElement;
  container: HTMLElement;
  currentFile: TFile;
  scrollBehavior: ScrollBehavior;
  linkHandlerCtx: LinkHandlerContext;
  onEmbedChange: (embed: any) => void;
}

/**
 * Get an emoji icon based on file extension.
 */
function getFileIcon(extension: string): string {
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) return '🖼️';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) return '🎵';
  if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) return '🎬';
  if (extension === 'pdf') return '📄';
  if (extension === 'canvas') return '🎨';
  return '📁';
}

/**
 * Render a fallback placeholder for unsupported file types.
 */
export function renderFallbackPlaceholder(
  contentWrapper: HTMLElement,
  currentFile: TFile
): void {
  contentWrapper.empty();
  contentWrapper.createDiv({ cls: 'pebbledash-embedded-placeholder' }, (div) => {
    const extension = currentFile.extension.toLowerCase();
    const icon = getFileIcon(extension);

    div.createDiv({ cls: 'pebbledash-placeholder-icon', text: icon });
    div.createDiv({ cls: 'pebbledash-placeholder-text', text: currentFile.name });
    div.createDiv({ cls: 'pebbledash-placeholder-hint', text: 'Double-click to open in tab' });
  });
}

/**
 * Render the file using Obsidian's native embed registry.
 * This automatically handles ALL file types Obsidian supports.
 */
export async function renderUsingEmbed(ctx: EmbedRendererContext): Promise<void> {
  const { app, contentWrapper, container, currentFile, scrollBehavior, linkHandlerCtx, onEmbedChange } = ctx;

  contentWrapper.empty();
  contentWrapper.removeClass('is-hidden');

  const extension = currentFile.extension.toLowerCase();

  try {
    // Access Obsidian's embed registry (types in obsidian-internal.d.ts)
    const embedRegistry = app.embedRegistry;

    if (!embedRegistry) {
      console.warn('EmbeddedWidget: embedRegistry not found, using fallback');
      renderFallbackPlaceholder(contentWrapper, currentFile);
      return;
    }

    // Get the embed factory for this file type
    const embedFactory = embedRegistry.embedByExtension?.[extension];

    if (embedFactory) {
      // Create the embed
      const embed = embedFactory({
        app,
        containerEl: contentWrapper,
        linktext: currentFile.path,
        sourcePath: currentFile.path,
      }, currentFile, '');

      if (embed) {
        onEmbedChange(embed);

        // Load the embed
        if (typeof embed.loadFile === 'function') {
          await embed.loadFile(currentFile);
        }
        if (typeof embed.load === 'function') {
          embed.load();
        }

        // Add appropriate container class
        contentWrapper.addClass('pebbledash-native-embed');

        // Set up link handlers after a brief delay to ensure content is rendered
        setTimeout(() => {
          setupLinkHandlers(contentWrapper, linkHandlerCtx);
          // Apply fit scaling if needed
          if (scrollBehavior === 'fit') {
            applyFitScaling(contentWrapper, container);
          }
        }, 100);
        return;
      }
    }

    // No embed factory found - show fallback
    renderFallbackPlaceholder(contentWrapper, currentFile);

  } catch (err) {
    console.error('EmbeddedWidget: Failed to create embed:', err);
    renderFallbackPlaceholder(contentWrapper, currentFile);
  }
}

