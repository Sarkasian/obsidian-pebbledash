/**
 * Modal dialogs for the pebbledash plugin
 */

export { ConfirmModal, type ConfirmModalOptions } from './ConfirmModal';
export { FileSuggestModal, type FileSuggestModalOptions } from './FileSuggestModal';
export { SaveAsModal, type SaveAsModalOptions } from './SaveAsModal';
export { FolderSuggestModal, type FolderSuggestModalOptions } from './FolderSuggestModal';
export { DashboardSettingsModal, type DashboardSettingsModalOptions } from './DashboardSettingsModal';
export { TileSettingsModal, type TileSettingsModalOptions } from './TileSettingsModal';

// Shared helpers for modal settings
export {
  // Formatting helpers
  formatInheritedDesc,
  getInheritedValue,
  addResetButton,
  // Simple settings with reset
  createSliderSetting,
  createToggleSetting,
  createDropdownSetting,
  // Cascade settings (vault → dashboard → tile)
  createCascadeToggle,
  createCascadeDropdown,
  // Text and UI helpers
  createTextSetting,
  createModalButtons,
  createSectionHeading,
  // Object manipulation
  cleanupEmptyNestedObjects,
  deleteNestedProperty,
  setNestedProperty,
  // Types
  type SliderSettingOptions,
  type ToggleSettingOptions,
  type DropdownSettingOptions,
  type CascadeToggleOptions,
  type CascadeDropdownOptions,
  type TextSettingOptions,
} from './settingHelpers';

