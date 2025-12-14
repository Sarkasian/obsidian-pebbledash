/**
 * Tile settings modal for editing tile-specific overrides.
 * Uses centralized setting definitions and shared helpers for DRY configuration.
 */

import { App, Modal, Setting } from 'obsidian';
import type { DashboardSettings, ObsidianTileMeta, LinkBehavior, ScrollBehavior, TileId, PebbledashSettings } from '../types';
import type { TileConstraints } from '@pebbledash/core';
import {
  MIN_TILE_WIDTH,
  MIN_TILE_HEIGHT,
  MAX_TILE_WIDTH,
  MAX_TILE_HEIGHT,
  SHOW_HEADERS,
  SHOW_EMBED_LINK,
  LINK_BEHAVIOR,
  SCROLL_BEHAVIOR,
  SEAMLESS_NESTED,
  getInheritedValue,
  vaultDefaultDesc,
} from '../settingDefinitions';
import {
  createSliderSetting,
  createCascadeToggle,
  createCascadeDropdown,
  createTextSetting,
  createModalButtons,
  createSectionHeading,
} from './settingHelpers';

export interface TileSettingsModalOptions {
  tileId: TileId;
  meta: ObsidianTileMeta;
  constraints?: TileConstraints;
  vaultSettings: PebbledashSettings;
  dashboardSettings?: DashboardSettings;
  onSave: (meta: ObsidianTileMeta, constraints?: TileConstraints) => void;
  onSelectContent: () => void;
}

export class TileSettingsModal extends Modal {
  private tileId: TileId;
  private meta: ObsidianTileMeta;
  private constraints: TileConstraints;
  private vaultSettings: PebbledashSettings;
  private dashboardSettings: DashboardSettings | undefined;
  private onSave: (meta: ObsidianTileMeta, constraints?: TileConstraints) => void;
  private onSelectContent: () => void;

  constructor(app: App, options: TileSettingsModalOptions) {
    super(app);
    this.tileId = options.tileId;
    // Deep clone to avoid mutating original until save
    this.meta = JSON.parse(JSON.stringify(options.meta || { widgetType: 'empty' }));
    this.constraints = JSON.parse(JSON.stringify(options.constraints || {}));
    this.vaultSettings = options.vaultSettings;
    this.dashboardSettings = options.dashboardSettings;
    this.onSave = options.onSave;
    this.onSelectContent = options.onSelectContent;
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    contentEl.empty();
    
    modalEl.addClass('pebbledash-settings-modal');
    contentEl.addClass('pebbledash-settings-content');

    this.titleEl.setText('Tile settings');

    // Content section
    createSectionHeading(contentEl, 'Content');

    new Setting(contentEl)
      .setName('Widget type')
      .setDesc('How to render this tile\'s content (.dash files are automatically rendered as nested dashboards)')
      .addDropdown(dropdown => dropdown
        .addOption('empty', 'Empty (placeholder)')
        .addOption('embedded', 'Embedded (native Obsidian)')
        .setValue(this.meta.widgetType ?? 'empty')
        .onChange(value => {
          this.meta.widgetType = value as any;
        }));

    const contentRefSetting = new Setting(contentEl)
      .setName('Content reference')
      .setDesc(this.meta.contentRef ?? 'No file selected');
    
    contentRefSetting.addButton(btn => btn
      .setButtonText('Change...')
      .onClick(() => {
        this.close();
        this.onSelectContent();
      }));

    if (this.meta.contentRef) {
      contentRefSetting.addButton(btn => btn
        .setButtonText('Clear')
        .onClick(() => {
          this.meta.contentRef = undefined;
          this.meta.widgetType = 'empty';
          this.display();
        }));
    }

    // Appearance section
    createSectionHeading(contentEl, 'Appearance');

    const inheritedShowHeaders = getInheritedValue(
      this.dashboardSettings?.showHeaders,
      this.vaultSettings.showHeaders
    );
    const showHeadersSource: 'dashboard' | 'vault' = 
      this.dashboardSettings?.showHeaders !== undefined ? 'dashboard' : 'vault';

    createCascadeToggle(contentEl, {
      name: SHOW_HEADERS.name.replace('tile headers', 'header'),
      desc: SHOW_HEADERS.desc,
      currentValue: this.meta.showHeader,
      inheritedValue: inheritedShowHeaders,
      sourceLabel: showHeadersSource,
      onChange: (value) => { this.meta.showHeader = value; },
      onReset: () => { delete this.meta.showHeader; this.display(); },
    });

    const inheritedShowEmbedLink = getInheritedValue(
      this.dashboardSettings?.showEmbedLink,
      this.vaultSettings.showEmbedLink
    );
    const showEmbedLinkSource: 'dashboard' | 'vault' = 
      this.dashboardSettings?.showEmbedLink !== undefined ? 'dashboard' : 'vault';

    createCascadeToggle(contentEl, {
      name: SHOW_EMBED_LINK.name,
      desc: SHOW_EMBED_LINK.desc,
      currentValue: this.meta.showEmbedLink,
      inheritedValue: inheritedShowEmbedLink,
      sourceLabel: showEmbedLinkSource,
      onChange: (value) => { this.meta.showEmbedLink = value; },
      onReset: () => { delete this.meta.showEmbedLink; this.display(); },
    });

    createTextSetting(contentEl, {
      name: 'Background',
      desc: 'Custom CSS background (e.g., var(--background-secondary) or #ff0000)',
      placeholder: 'inherit',
      currentValue: this.meta.background,
      onChange: (value) => { this.meta.background = value; },
    });

    createTextSetting(contentEl, {
      name: 'Padding',
      desc: 'Custom CSS padding (e.g., 16px or 8px 12px)',
      placeholder: 'inherit',
      currentValue: this.meta.padding,
      onChange: (value) => { this.meta.padding = value; },
    });

    // Behavior section
    createSectionHeading(contentEl, 'Behavior');

    const inheritedLinkBehavior = getInheritedValue(
      this.dashboardSettings?.linkBehavior,
      this.vaultSettings.linkBehavior
    );
    const linkBehaviorSource: 'dashboard' | 'vault' = 
      this.dashboardSettings?.linkBehavior !== undefined ? 'dashboard' : 'vault';

    createCascadeDropdown(contentEl, {
      name: LINK_BEHAVIOR.name,
      desc: LINK_BEHAVIOR.desc,
      options: LINK_BEHAVIOR.options,
      currentValue: this.meta.linkBehavior,
      inheritedValue: inheritedLinkBehavior,
      sourceLabel: linkBehaviorSource,
      onChange: (value) => { this.meta.linkBehavior = value as LinkBehavior; },
      onReset: () => { delete this.meta.linkBehavior; this.display(); },
    });

    const inheritedScrollBehavior = getInheritedValue(
      this.dashboardSettings?.scrollBehavior,
      this.vaultSettings.scrollBehavior
    );
    const scrollBehaviorSource: 'dashboard' | 'vault' = 
      this.dashboardSettings?.scrollBehavior !== undefined ? 'dashboard' : 'vault';

    createCascadeDropdown(contentEl, {
      name: SCROLL_BEHAVIOR.name,
      desc: SCROLL_BEHAVIOR.desc,
      options: SCROLL_BEHAVIOR.options,
      currentValue: this.meta.scrollBehavior,
      inheritedValue: inheritedScrollBehavior,
      sourceLabel: scrollBehaviorSource,
      onChange: (value) => { this.meta.scrollBehavior = value as ScrollBehavior; },
      onReset: () => { delete this.meta.scrollBehavior; this.display(); },
    });

    // Only show seamless setting if content is a .dash file
    const isDashFile = this.meta.contentRef?.toLowerCase().endsWith('.dash');
    
    if (isDashFile) {
      const inheritedSeamlessNested = getInheritedValue(
        this.dashboardSettings?.seamlessNested,
        this.vaultSettings.seamlessNested
      );
      const seamlessSource: 'dashboard' | 'vault' = 
        this.dashboardSettings?.seamlessNested !== undefined ? 'dashboard' : 'vault';

      createCascadeToggle(contentEl, {
        name: 'Seamless nested dashboard',
        desc: SEAMLESS_NESTED.desc,
        currentValue: this.meta.seamlessNested,
        inheritedValue: inheritedSeamlessNested,
        sourceLabel: seamlessSource,
        onChange: (value) => { this.meta.seamlessNested = value; },
        onReset: () => { delete this.meta.seamlessNested; this.display(); },
      });
    }

    // Constraints section
    createSectionHeading(contentEl, 'Size constraints');

    createSliderSetting(contentEl, {
      name: MIN_TILE_WIDTH.name,
      desc: MIN_TILE_WIDTH.desc,
      min: MIN_TILE_WIDTH.min,
      max: MIN_TILE_WIDTH.max,
      step: MIN_TILE_WIDTH.step,
      currentValue: this.constraints.minWidth ?? this.vaultSettings.minTileWidth,
      vaultDefault: this.vaultSettings.minTileWidth,
      onChange: (value) => { this.constraints.minWidth = value; },
      onReset: () => { delete this.constraints.minWidth; },
      onDisplay: () => this.display(),
    });

    createSliderSetting(contentEl, {
      name: MIN_TILE_HEIGHT.name,
      desc: MIN_TILE_HEIGHT.desc,
      min: MIN_TILE_HEIGHT.min,
      max: MIN_TILE_HEIGHT.max,
      step: MIN_TILE_HEIGHT.step,
      currentValue: this.constraints.minHeight ?? this.vaultSettings.minTileHeight,
      vaultDefault: this.vaultSettings.minTileHeight,
      onChange: (value) => { this.constraints.minHeight = value; },
      onReset: () => { delete this.constraints.minHeight; },
      onDisplay: () => this.display(),
    });

    createSliderSetting(contentEl, {
      name: MAX_TILE_WIDTH.name,
      desc: MAX_TILE_WIDTH.desc,
      min: MAX_TILE_WIDTH.min,
      max: MAX_TILE_WIDTH.max,
      step: MAX_TILE_WIDTH.step,
      currentValue: this.constraints.maxWidth ?? this.vaultSettings.maxTileWidth,
      vaultDefault: this.vaultSettings.maxTileWidth,
      onChange: (value) => { this.constraints.maxWidth = value; },
      onReset: () => { delete this.constraints.maxWidth; },
      onDisplay: () => this.display(),
    });

    createSliderSetting(contentEl, {
      name: MAX_TILE_HEIGHT.name,
      desc: MAX_TILE_HEIGHT.desc,
      min: MAX_TILE_HEIGHT.min,
      max: MAX_TILE_HEIGHT.max,
      step: MAX_TILE_HEIGHT.step,
      currentValue: this.constraints.maxHeight ?? this.vaultSettings.maxTileHeight,
      vaultDefault: this.vaultSettings.maxTileHeight,
      onChange: (value) => { this.constraints.maxHeight = value; },
      onReset: () => { delete this.constraints.maxHeight; },
      onDisplay: () => this.display(),
    });

    // Locked zones
    const lockedZonesSetting = new Setting(contentEl)
      .setName('Locked edges')
      .setDesc('Edges that cannot be resized');

    const lockedZonesContainer = lockedZonesSetting.controlEl.createDiv({ cls: 'pebbledash-locked-zones' });
    
    const zones: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'right', 'bottom', 'left'];
    zones.forEach(zone => {
      const label = lockedZonesContainer.createEl('label', { cls: 'pebbledash-locked-zone-label' });
      const checkbox = label.createEl('input', { type: 'checkbox' });
      checkbox.checked = this.constraints.lockedZones?.includes(zone) ?? false;
      checkbox.addEventListener('change', () => {
        this.updateLockedZone(zone, checkbox.checked);
      });
      label.appendText(zone.charAt(0).toUpperCase() + zone.slice(1));
    });

    // Buttons
    createModalButtons(
      contentEl,
      () => this.close(),
      () => {
        this.cleanupEmptyConstraints();
        this.onSave(this.meta, Object.keys(this.constraints).length > 0 ? this.constraints : undefined);
        this.close();
      }
    );
  }

  private updateLockedZone(zone: 'top' | 'bottom' | 'left' | 'right', enabled: boolean): void {
    if (!this.constraints.lockedZones) {
      this.constraints.lockedZones = [];
    }
    
    const index = this.constraints.lockedZones.indexOf(zone);
    if (enabled && index === -1) {
      this.constraints.lockedZones.push(zone);
    } else if (!enabled && index !== -1) {
      this.constraints.lockedZones.splice(index, 1);
    }
    
    if (this.constraints.lockedZones.length === 0) {
      delete this.constraints.lockedZones;
    }
  }

  /**
   * Re-render the modal (for reset buttons)
   */
  private display(): void {
    this.onOpen();
  }

  /**
   * Remove empty constraints before saving
   */
  private cleanupEmptyConstraints(): void {
    if (this.constraints.lockedZones?.length === 0) {
      delete this.constraints.lockedZones;
    }
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
