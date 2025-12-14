/**
 * Confirmation dialog modal
 */

import { App, Modal } from 'obsidian';

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export class ConfirmModal extends Modal {
  private title: string;
  private message: string;
  private confirmText: string;
  private cancelText: string;
  private onConfirm: () => void;
  private onCancel?: () => void;

  constructor(app: App, options: ConfirmModalOptions) {
    super(app);
    this.title = options.title;
    this.message = options.message;
    this.confirmText = options.confirmText ?? 'Confirm';
    this.cancelText = options.cancelText ?? 'Cancel';
    this.onConfirm = options.onConfirm;
    this.onCancel = options.onCancel;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('pebbledash-confirm-modal');

    contentEl.createEl('h2', { text: this.title });
    contentEl.createEl('p', { text: this.message });

    const buttonContainer = contentEl.createDiv({ cls: 'pebbledash-modal-buttons' });

    const cancelBtn = buttonContainer.createEl('button', { text: this.cancelText });
    cancelBtn.addEventListener('click', () => {
      this.close();
      this.onCancel?.();
    });

    const confirmBtn = buttonContainer.createEl('button', {
      text: this.confirmText,
      cls: 'mod-warning',
    });
    confirmBtn.addEventListener('click', () => {
      this.close();
      this.onConfirm();
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

