/**
 * Folder picker modal
 */

import { App, FuzzySuggestModal, TFolder } from 'obsidian';

export interface FolderSuggestModalOptions {
  onChoose: (folder: TFolder | null) => void;
}

export class FolderSuggestModal extends FuzzySuggestModal<TFolder | null> {
  private onChoose: (folder: TFolder | null) => void;

  constructor(app: App, options: FolderSuggestModalOptions) {
    super(app);
    this.onChoose = options.onChoose;
    this.setPlaceholder('Select a folder (or leave empty for root)...');
  }

  getItems(): (TFolder | null)[] {
    const folders: (TFolder | null)[] = [null]; // null represents root
    const traverse = (folder: TFolder) => {
      folders.push(folder);
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          traverse(child);
        }
      }
    };
    traverse(this.app.vault.getRoot());
    return folders;
  }

  getItemText(item: TFolder | null): string {
    if (item === null) return '/ (vault root)';
    return item.path;
  }

  onChooseItem(item: TFolder | null, _evt: MouseEvent | KeyboardEvent): void {
    this.onChoose(item);
  }
}

