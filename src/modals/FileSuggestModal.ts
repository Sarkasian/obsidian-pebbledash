/**
 * File picker modal using Obsidian's fuzzy suggest
 */

import { App, FuzzySuggestModal, TFile } from 'obsidian';

export interface FileSuggestModalOptions {
  onChoose: (file: TFile) => void;
  filter?: (file: TFile) => boolean;
}

export class FileSuggestModal extends FuzzySuggestModal<TFile> {
  private onChoose: (file: TFile) => void;
  private fileFilter?: (file: TFile) => boolean;

  constructor(app: App, options: FileSuggestModalOptions) {
    super(app);
    this.onChoose = options.onChoose;
    this.fileFilter = options.filter;
    this.setPlaceholder('Select a file...');
  }

  getItems(): TFile[] {
    // Get ALL files, not just markdown - supports images, PDFs, canvas, etc.
    let files = this.app.vault.getFiles();
    if (this.fileFilter) {
      files = files.filter(this.fileFilter);
    }
    return files;
  }

  getItemText(item: TFile): string {
    return item.path;
  }

  onChooseItem(item: TFile, _evt: MouseEvent | KeyboardEvent): void {
    this.onChoose(item);
  }
}

