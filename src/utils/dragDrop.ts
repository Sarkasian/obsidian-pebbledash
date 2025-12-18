import { App, TFile, Notice } from 'obsidian';

/**
 * Shared drag and drop utilities for tiles
 */

/**
 * Set up a drop zone on an element that accepts files
 * 
 * @param container The HTML element to make a drop zone
 * @param app Obsidian App instance
 * @param onFileDrop Callback when a valid file is dropped
 */
export function setupDropZone(
  container: HTMLElement,
  app: App,
  onFileDrop: (filePath: string) => void
): () => void {
  let dragCounter = 0; // Track nested drag events
  
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set drop effect to copy
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };
  
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    
    // Only add class on first enter (handles nested elements)
    if (dragCounter === 1) {
      container.classList.add('is-drag-over');
    }
  };
  
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    
    // Only remove class when fully leaving (handles nested elements)
    if (dragCounter === 0) {
      container.classList.remove('is-drag-over');
    }
  };
  
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    container.classList.remove('is-drag-over');
    
    if (!e.dataTransfer) {
      return;
    }
    
    // Try 1: Obsidian internal drag (obsidian:// URL format)
    const textPlain = e.dataTransfer.getData('text/plain');
    
    if (textPlain) {
      // Check if it's an obsidian:// URL (internal drag from file explorer)
      if (textPlain.startsWith('obsidian://')) {
        try {
          const url = new URL(textPlain);
          const filePath = url.searchParams.get('file');
          if (filePath) {
            // URL decode the file path
            const decodedPath = decodeURIComponent(filePath);
            
            const file = app.vault.getAbstractFileByPath(decodedPath);
            if (file instanceof TFile) {
              onFileDrop(decodedPath);
              return;
            }
            
            // Try with .md extension if not found
            const mdPath = decodedPath.endsWith('.md') ? decodedPath : `${decodedPath}.md`;
            const mdFile = app.vault.getAbstractFileByPath(mdPath);
            if (mdFile instanceof TFile) {
              onFileDrop(mdPath);
              return;
            }
          }
        } catch {
          // Failed to parse URL
        }
      } else {
        // Not an obsidian:// URL - try as plain file path
        const file = app.vault.getAbstractFileByPath(textPlain);
        if (file instanceof TFile) {
          onFileDrop(textPlain);
          return;
        }
        
        // Try cleaning up the path
        const cleanPath = textPlain.trim();
        const cleanFile = app.vault.getAbstractFileByPath(cleanPath);
        if (cleanFile instanceof TFile) {
          onFileDrop(cleanPath);
          return;
        }
      }
    }
    
    // Try 3: External file drop from OS
    const files = e.dataTransfer.files;
    
    if (files && files.length > 0) {
      const externalFile = files[0];
      
      try {
        const importedPath = await importExternalFile(app, externalFile);
        if (importedPath) {
          onFileDrop(importedPath);
        }
      } catch {
        new Notice(`Failed to import file: ${externalFile.name}`);
      }
      return;
    }
  };
  
  // Add event listeners
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragenter', handleDragEnter);
  container.addEventListener('dragleave', handleDragLeave);
  container.addEventListener('drop', handleDrop);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('dragover', handleDragOver);
    container.removeEventListener('dragenter', handleDragEnter);
    container.removeEventListener('dragleave', handleDragLeave);
    container.removeEventListener('drop', handleDrop);
  };
}

/**
 * Import an external file (from OS) into the vault
 * 
 * @param app Obsidian App instance
 * @param file The File object from the drop event
 * @returns The path of the imported file in the vault, or null if failed
 */
async function importExternalFile(app: App, file: File): Promise<string | null> {
    // Get the attachment folder path from Obsidian's config (types in obsidian-internal.d.ts)
    const attachmentFolder = app.vault.config?.attachmentFolderPath ?? '';
    
    // Generate the target path
    let targetPath: string;
    if (attachmentFolder) {
      // Ensure the attachment folder exists
      const folderExists = app.vault.getAbstractFileByPath(attachmentFolder);
      if (!folderExists) {
        await app.vault.createFolder(attachmentFolder);
      }
      targetPath = `${attachmentFolder}/${file.name}`;
    } else {
      targetPath = file.name;
    }
    
    // Check if file already exists - if so, generate unique name
    targetPath = await getUniqueFilePath(app, targetPath);
    
    // Read the file as ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Create the file in the vault
    await app.vault.createBinary(targetPath, buffer);
    
    new Notice(`Imported: ${file.name}`);
    
    return targetPath;
}

/**
 * Generate a unique file path by appending numbers if needed
 */
async function getUniqueFilePath(app: App, basePath: string): Promise<string> {
  // If path doesn't exist, return as-is
  if (!app.vault.getAbstractFileByPath(basePath)) {
    return basePath;
  }
  
  // Split path into name and extension
  const lastDot = basePath.lastIndexOf('.');
  const lastSlash = basePath.lastIndexOf('/');
  
  let name: string;
  let ext: string;
  let folder: string;
  
  if (lastDot > lastSlash) {
    ext = basePath.substring(lastDot);
    const fullName = basePath.substring(0, lastDot);
    const nameStart = lastSlash >= 0 ? lastSlash + 1 : 0;
    name = fullName.substring(nameStart);
    folder = lastSlash >= 0 ? basePath.substring(0, lastSlash) : '';
  } else {
    ext = '';
    const nameStart = lastSlash >= 0 ? lastSlash + 1 : 0;
    name = basePath.substring(nameStart);
    folder = lastSlash >= 0 ? basePath.substring(0, lastSlash) : '';
  }
  
  // Find unique name
  let counter = 1;
  let newPath: string;
  do {
    const newName = `${name} ${counter}${ext}`;
    newPath = folder ? `${folder}/${newName}` : newName;
    counter++;
  } while (app.vault.getAbstractFileByPath(newPath));
  
  return newPath;
}

