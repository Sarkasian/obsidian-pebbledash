/**
 * Save as modal with folder selection and filename input - Obsidian native style
 */

import { App, Modal, TFolder, Setting } from 'obsidian';

export interface SaveAsModalOptions {
  defaultPath: string;
  onSave: (path: string) => void;
}

export class SaveAsModal extends Modal {
  private defaultFolder: string;
  private defaultFilename: string;
  private onSave: (path: string) => void;
  private filenameInput: HTMLInputElement | null = null;
  private selectedFolder: string;

  constructor(app: App, options: SaveAsModalOptions) {
    super(app);
    // Parse the default path into folder and filename
    const lastSlash = options.defaultPath.lastIndexOf('/');
    if (lastSlash >= 0) {
      this.defaultFolder = options.defaultPath.substring(0, lastSlash);
      this.defaultFilename = options.defaultPath.substring(lastSlash + 1);
    } else {
      this.defaultFolder = '';
      this.defaultFilename = options.defaultPath;
    }
    this.selectedFolder = this.defaultFolder;
    this.onSave = options.onSave;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('pebbledash-save-as-modal');

    this.titleEl.setText('Save dashboard as');

    // Folder selection
    new Setting(contentEl)
      .setName('Location')
      .setDesc('Select folder for the new dashboard')
      .addDropdown((dropdown) => {
        // Add root option
        dropdown.addOption('', '/ (vault root)');
        
        // Add all folders
        const folders = this.getAllFolders();
        folders.forEach(folder => {
          dropdown.addOption(folder.path, folder.path);
        });
        
        dropdown.setValue(this.selectedFolder);
        dropdown.onChange((value) => {
          this.selectedFolder = value;
        });
      });

    // Filename input
    new Setting(contentEl)
      .setName('Filename')
      .setDesc('Name for the dashboard file (without extension)')
      .addText((text) => {
        this.filenameInput = text.inputEl;
        // Remove extension for display
        const nameWithoutExt = this.defaultFilename.replace(/\.dash$/, '');
        text
          .setPlaceholder('Dashboard')
          .setValue(nameWithoutExt);
        // Focus and select text
        setTimeout(() => {
          text.inputEl.focus();
          text.inputEl.select();
        }, 10);
      });

    // Buttons
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

    const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.addEventListener('click', () => {
      this.close();
    });

    const saveBtn = buttonContainer.createEl('button', {
      text: 'Save',
      cls: 'mod-cta',
    });
    saveBtn.addEventListener('click', () => this.doSave());

    // Handle Enter key
    contentEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.doSave();
      }
    });
  }

  private getAllFolders(): TFolder[] {
    const folders: TFolder[] = [];
    const traverse = (folder: TFolder) => {
      if (folder.path) { // Skip root
        folders.push(folder);
      }
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          traverse(child);
        }
      }
    };
    traverse(this.app.vault.getRoot());
    return folders.sort((a, b) => a.path.localeCompare(b.path));
  }

  private doSave(): void {
    if (!this.filenameInput) return;
    
    let filename = this.filenameInput.value.trim();
    if (!filename) return;
    
    // Add extension if not present
    if (!filename.endsWith('.dash')) {
      filename = `${filename}.dash`;
    }
    
    // Build full path
    const fullPath = this.selectedFolder ? `${this.selectedFolder}/${filename}` : filename;
    
    this.close();
    this.onSave(fullPath);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

