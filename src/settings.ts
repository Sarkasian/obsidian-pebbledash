import { App, PluginSettingTab, Setting } from 'obsidian';
import type PebbledashPlugin from './main';
import type { PebbledashSettings, LinkBehavior, ScrollBehavior, InteractionMode } from './types';
import { DEFAULT_SETTINGS } from './constants';
import {
  MIN_TILE_WIDTH,
  MIN_TILE_HEIGHT,
  MAX_TILE_WIDTH,
  MAX_TILE_HEIGHT,
  GUTTER,
  BORDER_WIDTH,
  BORDER_STYLE,
  BORDER_COLOR,
  SHOW_HEADERS,
  SHOW_EMBED_LINK,
  SCROLL_BEHAVIOR,
  LINK_BEHAVIOR,
  INTERACTION_MODE,
  ANIMATION_ENABLED,
  ANIMATION_DURATION,
  SEAMLESS_NESTED,
  REDISTRIBUTE_EQUALLY,
  INTERACTIVE_SELECTORS,
} from './settingDefinitions';

/**
 * Settings tab for the pebbledash plugin.
 * Uses centralized setting definitions for DRY configuration.
 */
export class PebbledashSettingTab extends PluginSettingTab {
  plugin: PebbledashPlugin;

  constructor(app: App, plugin: PebbledashPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Pebbledash Dashboard Settings' });

    // Layout section
    containerEl.createEl('h3', { text: 'Layout' });

    new Setting(containerEl)
      .setName(MIN_TILE_WIDTH.name)
      .setDesc(`${MIN_TILE_WIDTH.description} (${MIN_TILE_WIDTH.min}-${MIN_TILE_WIDTH.max})`)
      .addSlider(slider => slider
        .setLimits(MIN_TILE_WIDTH.min, MIN_TILE_WIDTH.max, MIN_TILE_WIDTH.step)
        .setValue(this.plugin.settings.minTileWidth)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.minTileWidth = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(MIN_TILE_HEIGHT.name)
      .setDesc(`${MIN_TILE_HEIGHT.description} (${MIN_TILE_HEIGHT.min}-${MIN_TILE_HEIGHT.max})`)
      .addSlider(slider => slider
        .setLimits(MIN_TILE_HEIGHT.min, MIN_TILE_HEIGHT.max, MIN_TILE_HEIGHT.step)
        .setValue(this.plugin.settings.minTileHeight)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.minTileHeight = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(MAX_TILE_WIDTH.name)
      .setDesc(`${MAX_TILE_WIDTH.description} (${MAX_TILE_WIDTH.min}-${MAX_TILE_WIDTH.max})`)
      .addSlider(slider => slider
        .setLimits(MAX_TILE_WIDTH.min, MAX_TILE_WIDTH.max, MAX_TILE_WIDTH.step)
        .setValue(this.plugin.settings.maxTileWidth)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.maxTileWidth = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(MAX_TILE_HEIGHT.name)
      .setDesc(`${MAX_TILE_HEIGHT.description} (${MAX_TILE_HEIGHT.min}-${MAX_TILE_HEIGHT.max})`)
      .addSlider(slider => slider
        .setLimits(MAX_TILE_HEIGHT.min, MAX_TILE_HEIGHT.max, MAX_TILE_HEIGHT.step)
        .setValue(this.plugin.settings.maxTileHeight)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.maxTileHeight = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(GUTTER.name)
      .setDesc(`${GUTTER.description} (${GUTTER.min}-${GUTTER.max})`)
      .addSlider(slider => slider
        .setLimits(GUTTER.min, GUTTER.max, GUTTER.step)
        .setValue(this.plugin.settings.gutter)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.gutter = value;
          await this.plugin.saveSettings();
        }));

    // Appearance section
    containerEl.createEl('h3', { text: 'Appearance' });

    new Setting(containerEl)
      .setName(BORDER_WIDTH.name)
      .setDesc(`${BORDER_WIDTH.description} (${BORDER_WIDTH.min}-${BORDER_WIDTH.max})`)
      .addSlider(slider => slider
        .setLimits(BORDER_WIDTH.min, BORDER_WIDTH.max, BORDER_WIDTH.step)
        .setValue(this.plugin.settings.borderWidth)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.borderWidth = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(BORDER_STYLE.name)
      .setDesc(BORDER_STYLE.description)
      .addDropdown(dropdown => {
        for (const opt of BORDER_STYLE.options) {
          dropdown.addOption(opt.value, opt.label);
        }
        return dropdown
          .setValue(this.plugin.settings.borderStyle)
          .onChange(async (value) => {
            this.plugin.settings.borderStyle = value as PebbledashSettings['borderStyle'];
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(BORDER_COLOR.name)
      .setDesc(BORDER_COLOR.description)
      .addText(text => text
        .setPlaceholder(BORDER_COLOR.placeholder ?? BORDER_COLOR.defaultValue)
        .setValue(this.plugin.settings.borderColor)
        .onChange(async (value) => {
          this.plugin.settings.borderColor = value || DEFAULT_SETTINGS.borderColor;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(SHOW_HEADERS.name)
      .setDesc(SHOW_HEADERS.description)
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showHeaders)
        .onChange(async (value) => {
          this.plugin.settings.showHeaders = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(SHOW_EMBED_LINK.name)
      .setDesc(SHOW_EMBED_LINK.description)
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showEmbedLink)
        .onChange(async (value) => {
          this.plugin.settings.showEmbedLink = value;
          await this.plugin.saveSettings();
        }));

    // Behavior section
    containerEl.createEl('h3', { text: 'Behavior' });

    new Setting(containerEl)
      .setName(SCROLL_BEHAVIOR.name)
      .setDesc(SCROLL_BEHAVIOR.description)
      .addDropdown(dropdown => {
        for (const opt of SCROLL_BEHAVIOR.options) {
          dropdown.addOption(opt.value, opt.label);
        }
        return dropdown
          .setValue(this.plugin.settings.scrollBehavior)
          .onChange(async (value) => {
            this.plugin.settings.scrollBehavior = value as ScrollBehavior;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(LINK_BEHAVIOR.name)
      .setDesc(LINK_BEHAVIOR.description)
      .addDropdown(dropdown => {
        for (const opt of LINK_BEHAVIOR.options) {
          dropdown.addOption(opt.value, opt.label);
        }
        return dropdown
          .setValue(this.plugin.settings.linkBehavior)
          .onChange(async (value) => {
            this.plugin.settings.linkBehavior = value as LinkBehavior;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(INTERACTION_MODE.name)
      .setDesc(INTERACTION_MODE.description)
      .addDropdown(dropdown => {
        for (const opt of INTERACTION_MODE.options) {
          dropdown.addOption(opt.value, opt.label);
        }
        return dropdown
          .setValue(this.plugin.settings.interactionMode)
          .onChange(async (value) => {
            this.plugin.settings.interactionMode = value as InteractionMode;
            await this.plugin.saveSettings();
          });
      });

    // Animation section
    containerEl.createEl('h3', { text: 'Animation' });

    new Setting(containerEl)
      .setName(ANIMATION_ENABLED.name)
      .setDesc(ANIMATION_ENABLED.description)
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.animationEnabled)
        .onChange(async (value) => {
          this.plugin.settings.animationEnabled = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(ANIMATION_DURATION.name)
      .setDesc(`${ANIMATION_DURATION.description} (${ANIMATION_DURATION.min}-${ANIMATION_DURATION.max})`)
      .addSlider(slider => slider
        .setLimits(ANIMATION_DURATION.min, ANIMATION_DURATION.max, ANIMATION_DURATION.step)
        .setValue(this.plugin.settings.animationDuration)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.animationDuration = value;
          await this.plugin.saveSettings();
        }));

    // Nested dashboards section
    containerEl.createEl('h3', { text: 'Nested Dashboards' });

    new Setting(containerEl)
      .setName(SEAMLESS_NESTED.name)
      .setDesc(SEAMLESS_NESTED.description)
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.seamlessNested)
        .onChange(async (value) => {
          this.plugin.settings.seamlessNested = value;
          await this.plugin.saveSettings();
        }));

    // Resize behavior section
    containerEl.createEl('h3', { text: 'Resize Behavior' });

    new Setting(containerEl)
      .setName(REDISTRIBUTE_EQUALLY.name)
      .setDesc(REDISTRIBUTE_EQUALLY.description)
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.redistributeEqually)
        .onChange(async (value) => {
          this.plugin.settings.redistributeEqually = value;
          await this.plugin.saveSettings();
        }));

  // Advanced section
  containerEl.createEl('h3', { text: 'Advanced' });

  // Create textarea first so it can be referenced in reset button
  const textareaContainer = containerEl.createDiv({ cls: 'pebbledash-textarea-container' });
  const textareaEl = textareaContainer.createEl('textarea', {
    cls: 'pebbledash-interactive-selectors',
    placeholder: INTERACTIVE_SELECTORS.placeholder ?? '',
  });

  // Interactive selectors - header with reset button (inserted before textarea)
  const settingsEl = new Setting(containerEl)
    .setName(INTERACTIVE_SELECTORS.name)
    .setDesc(INTERACTIVE_SELECTORS.description)
    .addButton(button => button
      .setButtonText('Reset to default')
      .onClick(async () => {
        this.plugin.settings.interactiveSelectors = DEFAULT_SETTINGS.interactiveSelectors;
        textareaEl.value = DEFAULT_SETTINGS.interactiveSelectors;
        await this.plugin.saveSettings();
      }));

  // Move the setting before the textarea container
  containerEl.insertBefore(settingsEl.settingEl, textareaContainer);

  // Style the textarea container
  textareaEl.value = this.plugin.settings.interactiveSelectors;
  textareaEl.rows = 6;
  textareaEl.style.width = '100%';
  textareaEl.style.fontFamily = 'monospace';
  textareaEl.style.fontSize = '12px';
  textareaEl.style.padding = '8px';
  textareaEl.style.borderRadius = '4px';
  textareaEl.style.border = '1px solid var (--background-modifier-border)';
  textareaEl.style.backgroundColor = 'var(--text-normal)';
  textareaEl.style.resize = 'vertical';

  textareaEl.addEventListener('change', async () => {
    this.plugin.settings.interactiveSelectors = textareaEl.value || DEFAULT_SETTINGS.interactiveSelectors;
    await this.plugin.saveSettings();
  });
  }
}
