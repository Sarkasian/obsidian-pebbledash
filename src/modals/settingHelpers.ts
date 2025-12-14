/**
 * Shared helper utilities for settings modals.
 * 
 * Provides common patterns for creating resettable settings,
 * formatting inherited values, and cleaning up empty settings.
 * 
 * Usage:
 * ```typescript
 * // For settings with vault/dashboard/tile cascade:
 * createCascadeToggle(contentEl, {
 *   name: 'Show headers',
 *   desc: 'Display tile headers',
 *   currentValue: meta.showHeader,
 *   inheritedValue: dashSettings?.showHeaders ?? vaultSettings.showHeaders,
 *   sourceLabel: dashSettings?.showHeaders !== undefined ? 'dashboard' : 'vault',
 *   onChange: (v) => { meta.showHeader = v; },
 *   onReset: () => { delete meta.showHeader; display(); },
 * });
 * 
 * // For simple settings with vault default:
 * createSliderSetting(contentEl, {
 *   name: 'Min width',
 *   desc: 'Minimum tile width',
 *   min: 5, max: 50, step: 1,
 *   currentValue: constraints.minWidth ?? vaultSettings.minTileWidth,
 *   vaultDefault: vaultSettings.minTileWidth,
 *   onChange: (v) => { constraints.minWidth = v; },
 *   onReset: () => { delete constraints.minWidth; display(); },
 *   onDisplay: () => display(),
 * });
 * ```
 */

import { Setting } from 'obsidian';

/**
 * Format an inherited value description showing the source.
 * 
 * @param settingName - Name of the setting
 * @param dashboardValue - Value from dashboard settings (if any)
 * @param vaultValue - Value from vault settings
 * @returns Formatted description string
 */
export function formatInheritedDesc(
  settingName: string,
  dashboardValue: unknown,
  vaultValue: unknown
): string {
  if (dashboardValue !== undefined) {
    return `Inherited from dashboard: ${formatValue(dashboardValue)}`;
  }
  return `Inherited from vault: ${formatValue(vaultValue)}`;
}

/**
 * Format a value for display in setting descriptions.
 */
function formatValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'on' : 'off';
  }
  return String(value);
}

/**
 * Get the effective value from the settings cascade.
 * 
 * @param dashboardValue - Value from dashboard settings (if any)
 * @param vaultValue - Value from vault settings
 * @returns The effective value to use
 */
export function getInheritedValue<T>(
  dashboardValue: T | undefined,
  vaultValue: T
): T {
  return dashboardValue ?? vaultValue;
}

/**
 * Add a reset button to a setting that calls display() to refresh.
 * 
 * @param setting - The Setting instance
 * @param onReset - Callback to clear the override value
 * @param onDisplay - Callback to refresh the modal display
 * @returns The modified Setting for chaining
 */
export function addResetButton(
  setting: Setting,
  onReset: () => void,
  onDisplay: () => void
): Setting {
  return setting.addExtraButton(btn => btn
    .setIcon('reset')
    .setTooltip('Inherit from dashboard/vault')
    .onClick(() => {
      onReset();
      onDisplay();
    }));
}

/**
 * Options for creating a resettable slider setting.
 */
export interface SliderSettingOptions {
  name: string;
  desc: string;
  min: number;
  max: number;
  step: number;
  currentValue: number;
  vaultDefault: number;
  onChange: (value: number) => void;
  onReset: () => void;
  onDisplay: () => void;
}

/**
 * Create a slider setting with a reset button.
 * 
 * @param containerEl - The container element
 * @param opts - Options for the slider setting
 * @returns The created Setting
 */
export function createSliderSetting(
  containerEl: HTMLElement,
  opts: SliderSettingOptions
): Setting {
  const setting = new Setting(containerEl)
    .setName(opts.name)
    .setDesc(`${opts.desc} (vault default: ${opts.vaultDefault})`)
    .addSlider(slider => slider
      .setLimits(opts.min, opts.max, opts.step)
      .setValue(opts.currentValue)
      .setDynamicTooltip()
      .onChange(opts.onChange));

  return addResetButton(setting, opts.onReset, opts.onDisplay);
}

/**
 * Options for creating a resettable toggle setting.
 */
export interface ToggleSettingOptions {
  name: string;
  desc: string;
  currentValue: boolean;
  vaultDefault: boolean;
  onChange: (value: boolean) => void;
  onReset: () => void;
  onDisplay: () => void;
}

/**
 * Create a toggle setting with a reset button.
 * 
 * @param containerEl - The container element
 * @param opts - Options for the toggle setting
 * @returns The created Setting
 */
export function createToggleSetting(
  containerEl: HTMLElement,
  opts: ToggleSettingOptions
): Setting {
  const setting = new Setting(containerEl)
    .setName(opts.name)
    .setDesc(`${opts.desc} (vault default: ${opts.vaultDefault ? 'on' : 'off'})`)
    .addToggle(toggle => toggle
      .setValue(opts.currentValue)
      .onChange(opts.onChange));

  return addResetButton(setting, opts.onReset, opts.onDisplay);
}

/**
 * Options for creating a resettable dropdown setting.
 */
export interface DropdownSettingOptions<T extends string> {
  name: string;
  desc: string;
  options: Array<{ value: T; label: string }>;
  currentValue: T;
  vaultDefault: T;
  onChange: (value: T) => void;
  onReset: () => void;
  onDisplay: () => void;
}

/**
 * Create a dropdown setting with a reset button.
 * 
 * @param containerEl - The container element
 * @param opts - Options for the dropdown setting
 * @returns The created Setting
 */
export function createDropdownSetting<T extends string>(
  containerEl: HTMLElement,
  opts: DropdownSettingOptions<T>
): Setting {
  const setting = new Setting(containerEl)
    .setName(opts.name)
    .setDesc(`${opts.desc} (vault default: ${opts.vaultDefault})`)
    .addDropdown(dropdown => {
      opts.options.forEach(opt => dropdown.addOption(opt.value, opt.label));
      dropdown.setValue(opts.currentValue);
      dropdown.onChange(value => opts.onChange(value as T));
      return dropdown;
    });

  return addResetButton(setting, opts.onReset, opts.onDisplay);
}

/**
 * Clean up empty nested objects from settings.
 * 
 * @param obj - The object to clean
 * @param keys - Keys of nested objects that should be removed if empty
 */
export function cleanupEmptyNestedObjects<T extends object>(
  obj: T,
  keys: (keyof T)[]
): void {
  for (const key of keys) {
    const nested = obj[key];
    if (nested && typeof nested === 'object' && Object.keys(nested as object).length === 0) {
      delete obj[key];
    }
  }
}

/**
 * Delete a nested property and clean up parent if empty.
 * 
 * @param parent - The parent object
 * @param nestedKey - Key of the nested object
 * @param propertyKey - Key of the property to delete
 */
export function deleteNestedProperty<T extends Record<string, any>>(
  parent: T,
  nestedKey: keyof T,
  propertyKey: string
): void {
  const nested = parent[nestedKey];
  if (nested && typeof nested === 'object') {
    delete nested[propertyKey];
    if (Object.keys(nested).length === 0) {
      delete parent[nestedKey];
    }
  }
}

/**
 * Set a nested property, creating the parent object if needed.
 * 
 * @param parent - The parent object  
 * @param nestedKey - Key of the nested object
 * @param propertyKey - Key of the property to set
 * @param value - Value to set
 */
export function setNestedProperty<T extends Record<string, any>>(
  parent: T,
  nestedKey: keyof T,
  propertyKey: string,
  value: unknown
): void {
  if (!parent[nestedKey]) {
    (parent as any)[nestedKey] = {};
  }
  (parent[nestedKey] as any)[propertyKey] = value;
}

// ==================== CASCADE SETTINGS ====================
// For settings that cascade from vault → dashboard → tile

/**
 * Options for creating a cascade toggle setting (vault/dashboard/tile).
 */
export interface CascadeToggleOptions {
  name: string;
  desc: string;
  /** Current tile-level override value (may be undefined) */
  currentValue: boolean | undefined;
  /** The value inherited from dashboard or vault */
  inheritedValue: boolean;
  /** Label for the inheritance source ('dashboard' or 'vault') */
  sourceLabel: 'dashboard' | 'vault';
  /** Callback when value changes */
  onChange: (value: boolean) => void;
  /** Callback to reset to inherited value (should delete the override) */
  onReset: () => void;
}

/**
 * Create a toggle setting that supports cascading inheritance.
 * Shows the inherited value source and provides a reset button.
 */
export function createCascadeToggle(
  containerEl: HTMLElement,
  opts: CascadeToggleOptions
): Setting {
  const hasOverride = opts.currentValue !== undefined;
  const displayValue = opts.currentValue ?? opts.inheritedValue;
  
  const descText = hasOverride
    ? `Override: ${displayValue ? 'on' : 'off'}`
    : `Inherited from ${opts.sourceLabel}: ${opts.inheritedValue ? 'on' : 'off'}`;
  
  const setting = new Setting(containerEl)
    .setName(opts.name)
    .setDesc(descText)
    .addToggle(toggle => toggle
      .setValue(displayValue)
      .onChange(opts.onChange))
    .addExtraButton(btn => btn
      .setIcon('reset')
      .setTooltip('Inherit from dashboard/vault')
      .onClick(opts.onReset));
  
  return setting;
}

/**
 * Options for creating a cascade dropdown setting.
 */
export interface CascadeDropdownOptions<T extends string> {
  name: string;
  desc: string;
  options: Array<{ value: T; label: string }>;
  currentValue: T | undefined;
  inheritedValue: T;
  sourceLabel: 'dashboard' | 'vault';
  onChange: (value: T) => void;
  onReset: () => void;
}

/**
 * Create a dropdown setting that supports cascading inheritance.
 */
export function createCascadeDropdown<T extends string>(
  containerEl: HTMLElement,
  opts: CascadeDropdownOptions<T>
): Setting {
  const hasOverride = opts.currentValue !== undefined;
  const displayValue = opts.currentValue ?? opts.inheritedValue;
  
  const descText = hasOverride
    ? `Override: ${displayValue}`
    : `Inherited from ${opts.sourceLabel}: ${opts.inheritedValue}`;
  
  const setting = new Setting(containerEl)
    .setName(opts.name)
    .setDesc(descText)
    .addDropdown(dropdown => {
      opts.options.forEach(opt => dropdown.addOption(opt.value, opt.label));
      dropdown.setValue(displayValue);
      dropdown.onChange(value => opts.onChange(value as T));
      return dropdown;
    })
    .addExtraButton(btn => btn
      .setIcon('reset')
      .setTooltip('Inherit from dashboard/vault')
      .onClick(opts.onReset));
  
  return setting;
}

// ==================== TEXT INPUT HELPERS ====================

/**
 * Options for creating a text input setting.
 */
export interface TextSettingOptions {
  name: string;
  desc: string;
  placeholder?: string;
  currentValue: string | undefined;
  onChange: (value: string | undefined) => void;
}

/**
 * Create a simple text input setting.
 */
export function createTextSetting(
  containerEl: HTMLElement,
  opts: TextSettingOptions
): Setting {
  return new Setting(containerEl)
    .setName(opts.name)
    .setDesc(opts.desc)
    .addText(text => text
      .setPlaceholder(opts.placeholder ?? '')
      .setValue(opts.currentValue ?? '')
      .onChange(value => opts.onChange(value || undefined)));
}

// ==================== BUTTON HELPERS ====================

/**
 * Create a standard modal button container with Cancel and Save buttons.
 */
export function createModalButtons(
  containerEl: HTMLElement,
  onCancel: () => void,
  onSave: () => void,
  saveLabel = 'Save'
): HTMLElement {
  const buttonContainer = containerEl.createDiv({ cls: 'modal-button-container' });

  const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
  cancelBtn.addEventListener('click', onCancel);

  const saveBtn = buttonContainer.createEl('button', {
    text: saveLabel,
    cls: 'mod-cta',
  });
  saveBtn.addEventListener('click', onSave);
  
  return buttonContainer;
}

// ==================== SECTION HELPERS ====================

/**
 * Create a section heading in a modal.
 */
export function createSectionHeading(
  containerEl: HTMLElement,
  title: string,
  level: 'h2' | 'h3' = 'h3'
): HTMLElement {
  return containerEl.createEl(level, { text: title });
}

