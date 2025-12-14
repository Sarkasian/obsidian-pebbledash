/**
 * Dashboard settings modal for editing dashboard-level settings.
 * Uses centralized setting definitions and shared helpers for DRY configuration.
 */

import { App, Modal, Setting } from 'obsidian';
import type { DashboardSettings, LinkBehavior, ScrollBehavior, InteractionMode, PebbledashSettings } from '../types';
import {
  GUTTER,
  BORDER_WIDTH,
  BORDER_STYLE,
  BORDER_COLOR,
  SHOW_HEADERS,
  SHOW_EMBED_LINK,
  LINK_BEHAVIOR,
  SCROLL_BEHAVIOR,
  INTERACTION_MODE,
  ANIMATION_ENABLED,
  ANIMATION_DURATION,
  SEAMLESS_NESTED,
  REDISTRIBUTE_EQUALLY,
  vaultDefaultDesc,
} from '../settingDefinitions';
import {
  createSliderSetting,
  createToggleSetting,
  createDropdownSetting,
  createTextSetting,
  createModalButtons,
  createSectionHeading,
  deleteNestedProperty,
  setNestedProperty,
  cleanupEmptyNestedObjects,
} from './settingHelpers';

export interface DashboardSettingsModalOptions {
  settings: DashboardSettings;
  vaultSettings: PebbledashSettings;
  onSave: (settings: DashboardSettings) => void;
}

export class DashboardSettingsModal extends Modal {
  private settings: DashboardSettings;
  private vaultSettings: PebbledashSettings;
  private onSave: (settings: DashboardSettings) => void;

  constructor(app: App, options: DashboardSettingsModalOptions) {
    super(app);
    // Deep clone to avoid mutating original until save
    this.settings = JSON.parse(JSON.stringify(options.settings || {}));
    this.vaultSettings = options.vaultSettings;
    this.onSave = options.onSave;
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    
    modalEl.addClass('pebbledash-settings-modal');
    contentEl.addClass('pebbledash-settings-content');

    this.titleEl.setText('Dashboard settings');

    // Info text
    contentEl.createEl('p', {
      text: 'These settings override vault defaults for this dashboard only. Leave empty to inherit from vault settings.',
      cls: 'pebbledash-settings-info',
    });

    // Appearance section
    createSectionHeading(contentEl, 'Appearance');

    // CSS class (no vault default)
    createTextSetting(contentEl, {
      name: 'CSS class',
      desc: 'Custom CSS class to apply to this dashboard',
      placeholder: 'my-dashboard-class',
      currentValue: this.settings.cssclass,
      onChange: (value) => { this.settings.cssclass = value; },
    });

    createSliderSetting(contentEl, {
      name: GUTTER.name,
      desc: GUTTER.description,
      min: GUTTER.min,
      max: GUTTER.max,
      step: GUTTER.step,
      currentValue: this.settings.gutter ?? this.vaultSettings.gutter,
      vaultDefault: this.vaultSettings.gutter,
      onChange: (value) => { this.settings.gutter = value; },
      onReset: () => { this.settings.gutter = undefined; },
      onDisplay: () => this.display(),
    });

    // Border settings
    contentEl.createEl('h4', { text: 'Border', cls: 'pebbledash-settings-subsection' });

    createSliderSetting(contentEl, {
      name: BORDER_WIDTH.name,
      desc: BORDER_WIDTH.description,
      min: BORDER_WIDTH.min,
      max: BORDER_WIDTH.max,
      step: BORDER_WIDTH.step,
      currentValue: this.settings.border?.width ?? this.vaultSettings.borderWidth,
      vaultDefault: this.vaultSettings.borderWidth,
      onChange: (value) => { setNestedProperty(this.settings, 'border', 'width', value); },
      onReset: () => { deleteNestedProperty(this.settings, 'border', 'width'); },
      onDisplay: () => this.display(),
    });

    createDropdownSetting(contentEl, {
      name: BORDER_STYLE.name,
      desc: BORDER_STYLE.description,
      options: BORDER_STYLE.options,
      currentValue: this.settings.border?.style ?? this.vaultSettings.borderStyle,
      vaultDefault: this.vaultSettings.borderStyle,
      onChange: (value) => { setNestedProperty(this.settings, 'border', 'style', value); },
      onReset: () => { deleteNestedProperty(this.settings, 'border', 'style'); },
      onDisplay: () => this.display(),
    });

    // Border color is text input, not dropdown
    new Setting(contentEl)
      .setName(BORDER_COLOR.name)
      .setDesc(vaultDefaultDesc(BORDER_COLOR, this.vaultSettings.borderColor))
      .addText(text => text
        .setPlaceholder(this.vaultSettings.borderColor)
        .setValue(this.settings.border?.color ?? '')
        .onChange(value => {
          if (value) {
            setNestedProperty(this.settings, 'border', 'color', value);
          } else {
            deleteNestedProperty(this.settings, 'border', 'color');
          }
        }));

    // Behavior section
    createSectionHeading(contentEl, 'Behavior');

    createToggleSetting(contentEl, {
      name: SHOW_HEADERS.name,
      desc: SHOW_HEADERS.description,
      currentValue: this.settings.showHeaders ?? this.vaultSettings.showHeaders,
      vaultDefault: this.vaultSettings.showHeaders,
      onChange: (value) => { this.settings.showHeaders = value; },
      onReset: () => { delete this.settings.showHeaders; },
      onDisplay: () => this.display(),
    });

    createToggleSetting(contentEl, {
      name: SHOW_EMBED_LINK.name,
      desc: SHOW_EMBED_LINK.description,
      currentValue: this.settings.showEmbedLink ?? this.vaultSettings.showEmbedLink,
      vaultDefault: this.vaultSettings.showEmbedLink,
      onChange: (value) => { this.settings.showEmbedLink = value; },
      onReset: () => { delete this.settings.showEmbedLink; },
      onDisplay: () => this.display(),
    });

    createDropdownSetting(contentEl, {
      name: LINK_BEHAVIOR.name,
      desc: LINK_BEHAVIOR.description,
      options: LINK_BEHAVIOR.options,
      currentValue: this.settings.linkBehavior ?? this.vaultSettings.linkBehavior,
      vaultDefault: this.vaultSettings.linkBehavior,
      onChange: (value) => { this.settings.linkBehavior = value as LinkBehavior; },
      onReset: () => { delete this.settings.linkBehavior; },
      onDisplay: () => this.display(),
    });

    createDropdownSetting(contentEl, {
      name: SCROLL_BEHAVIOR.name,
      desc: SCROLL_BEHAVIOR.description,
      options: SCROLL_BEHAVIOR.options,
      currentValue: this.settings.scrollBehavior ?? this.vaultSettings.scrollBehavior,
      vaultDefault: this.vaultSettings.scrollBehavior,
      onChange: (value) => { this.settings.scrollBehavior = value as ScrollBehavior; },
      onReset: () => { delete this.settings.scrollBehavior; },
      onDisplay: () => this.display(),
    });

    createDropdownSetting(contentEl, {
      name: INTERACTION_MODE.name,
      desc: INTERACTION_MODE.description,
      options: INTERACTION_MODE.options,
      currentValue: this.settings.interactionMode ?? this.vaultSettings.interactionMode,
      vaultDefault: this.vaultSettings.interactionMode,
      onChange: (value) => { this.settings.interactionMode = value as InteractionMode; },
      onReset: () => { delete this.settings.interactionMode; },
      onDisplay: () => this.display(),
    });

    // Animation section
    createSectionHeading(contentEl, 'Animation');

    createToggleSetting(contentEl, {
      name: ANIMATION_ENABLED.name,
      desc: ANIMATION_ENABLED.description,
      currentValue: this.settings.animation?.enabled ?? this.vaultSettings.animationEnabled,
      vaultDefault: this.vaultSettings.animationEnabled,
      onChange: (value) => { setNestedProperty(this.settings, 'animation', 'enabled', value); },
      onReset: () => { deleteNestedProperty(this.settings, 'animation', 'enabled'); },
      onDisplay: () => this.display(),
    });

    createSliderSetting(contentEl, {
      name: ANIMATION_DURATION.name,
      desc: ANIMATION_DURATION.description,
      min: ANIMATION_DURATION.min,
      max: ANIMATION_DURATION.max,
      step: ANIMATION_DURATION.step,
      currentValue: this.settings.animation?.duration ?? this.vaultSettings.animationDuration,
      vaultDefault: this.vaultSettings.animationDuration,
      onChange: (value) => { setNestedProperty(this.settings, 'animation', 'duration', value); },
      onReset: () => { deleteNestedProperty(this.settings, 'animation', 'duration'); },
      onDisplay: () => this.display(),
    });

    // Nested dashboards section
    createSectionHeading(contentEl, 'Nested Dashboards');

    createToggleSetting(contentEl, {
      name: SEAMLESS_NESTED.name,
      desc: SEAMLESS_NESTED.description,
      currentValue: this.settings.seamlessNested ?? this.vaultSettings.seamlessNested,
      vaultDefault: this.vaultSettings.seamlessNested,
      onChange: (value) => { this.settings.seamlessNested = value; },
      onReset: () => { delete this.settings.seamlessNested; },
      onDisplay: () => this.display(),
    });

    // Resize section
    createSectionHeading(contentEl, 'Resize Behavior');

    createToggleSetting(contentEl, {
      name: REDISTRIBUTE_EQUALLY.name,
      desc: REDISTRIBUTE_EQUALLY.description,
      currentValue: this.settings.redistributeEqually ?? this.vaultSettings.redistributeEqually,
      vaultDefault: this.vaultSettings.redistributeEqually,
      onChange: (value) => { this.settings.redistributeEqually = value; },
      onReset: () => { delete this.settings.redistributeEqually; },
      onDisplay: () => this.display(),
    });

    // Buttons
    createModalButtons(
      contentEl,
      () => this.close(),
      () => {
        cleanupEmptyNestedObjects(this.settings, ['border', 'animation']);
        this.onSave(this.settings);
        this.close();
      }
    );
  }

  /**
   * Re-render the modal (for reset buttons)
   */
  private display(): void {
    this.onOpen();
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
