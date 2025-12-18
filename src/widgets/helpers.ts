/**
 * Widget helper functions for creating common UI elements.
 */

import { CSS } from '../constants';

/**
 * Create a tile header element based on the content reference.
 * 
 * @param contentRef - The content reference (file path)
 * @param tileId - The tile ID (for potential actions)
 * @returns The header element
 */
export function createTileHeader(
  contentRef: string | undefined,
  _tileId: string
): HTMLElement {
  const header = document.createElement('div');
  header.className = CSS.tileHeader;
  
  // Title - show filename without extension, or "Empty tile" if no content
  const titleEl = document.createElement('div');
  titleEl.className = CSS.tileHeaderTitle;
  
  if (contentRef) {
    // Extract filename from path and remove extension
    const parts = contentRef.split('/');
    const filename = parts[parts.length - 1];
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    titleEl.textContent = nameWithoutExt;
    titleEl.setAttribute('title', contentRef); // Full path on hover
  } else {
    titleEl.textContent = 'Empty tile';
  }
  
  header.appendChild(titleEl);
  
  // Actions container (for future expand/settings buttons)
  const actionsEl = document.createElement('div');
  actionsEl.className = CSS.tileHeaderActions;
  header.appendChild(actionsEl);
  
  return header;
}

/**
 * Extract the filename without extension from a file path.
 * 
 * @param filePath - The full file path
 * @returns The filename without extension
 */
export function getFilenameWithoutExtension(filePath: string): string {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace(/\.[^/.]+$/, '');
}

/**
 * Get the file extension from a file path.
 * 
 * @param filePath - The full file path
 * @returns The file extension (lowercase, without dot)
 */
export function getFileExtension(filePath: string): string {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

