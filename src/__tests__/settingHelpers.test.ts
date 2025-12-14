/**
 * Unit tests for setting helper utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  formatInheritedDesc,
  getInheritedValue,
  cleanupEmptyNestedObjects,
  deleteNestedProperty,
  setNestedProperty,
} from '../modals/settingHelpers';

describe('formatInheritedDesc', () => {
  it('should format dashboard-inherited boolean value', () => {
    const result = formatInheritedDesc('showHeaders', true, false);
    expect(result).toBe('Inherited from dashboard: on');
  });

  it('should format vault-inherited boolean value when dashboard undefined', () => {
    const result = formatInheritedDesc('showHeaders', undefined, true);
    expect(result).toBe('Inherited from vault: on');
  });

  it('should format boolean false correctly', () => {
    const result = formatInheritedDesc('showHeaders', false, true);
    expect(result).toBe('Inherited from dashboard: off');
  });

  it('should format string values', () => {
    const result = formatInheritedDesc('linkBehavior', 'new-tab', 'replace-tile');
    expect(result).toBe('Inherited from dashboard: new-tab');
  });

  it('should format numeric values', () => {
    const result = formatInheritedDesc('gutter', undefined, 4);
    expect(result).toBe('Inherited from vault: 4');
  });
});

describe('getInheritedValue', () => {
  it('should return dashboard value when defined', () => {
    const result = getInheritedValue(true, false);
    expect(result).toBe(true);
  });

  it('should return vault value when dashboard undefined', () => {
    const result = getInheritedValue(undefined, 'default-value');
    expect(result).toBe('default-value');
  });

  it('should return dashboard value even if falsy', () => {
    const result = getInheritedValue(false, true);
    expect(result).toBe(false);
  });

  it('should return dashboard value of zero', () => {
    const result = getInheritedValue(0, 10);
    expect(result).toBe(0);
  });

  it('should return dashboard empty string', () => {
    const result = getInheritedValue('', 'default');
    expect(result).toBe('');
  });
});

describe('cleanupEmptyNestedObjects', () => {
  it('should remove empty nested objects', () => {
    const obj: Record<string, unknown> = {
      name: 'test',
      border: {},
      animation: {},
    };

    cleanupEmptyNestedObjects(obj, ['border', 'animation']);

    expect(obj.name).toBe('test');
    expect(obj.border).toBeUndefined();
    expect(obj.animation).toBeUndefined();
  });

  it('should keep non-empty nested objects', () => {
    const obj: Record<string, unknown> = {
      border: { width: 2 },
      animation: {},
    };

    cleanupEmptyNestedObjects(obj, ['border', 'animation']);

    expect(obj.border).toEqual({ width: 2 });
    expect(obj.animation).toBeUndefined();
  });

  it('should handle missing keys gracefully', () => {
    const obj: Record<string, unknown> = {
      name: 'test',
    };

    // Should not throw
    cleanupEmptyNestedObjects(obj, ['border', 'nonexistent']);

    expect(obj.name).toBe('test');
  });

  it('should not affect non-object values', () => {
    const obj: Record<string, unknown> = {
      gutter: 8,
      showHeaders: true,
      border: {},
    };

    cleanupEmptyNestedObjects(obj, ['gutter', 'showHeaders', 'border']);

    expect(obj.gutter).toBe(8);
    expect(obj.showHeaders).toBe(true);
    expect(obj.border).toBeUndefined();
  });
});

describe('deleteNestedProperty', () => {
  it('should delete property from nested object', () => {
    const obj = {
      border: { width: 2, style: 'solid', color: '#000' },
    };

    deleteNestedProperty(obj, 'border', 'width');

    expect(obj.border).toEqual({ style: 'solid', color: '#000' });
  });

  it('should remove nested object when last property deleted', () => {
    const obj = {
      border: { width: 2 },
    };

    deleteNestedProperty(obj, 'border', 'width');

    expect(obj.border).toBeUndefined();
  });

  it('should handle missing nested object gracefully', () => {
    const obj: Record<string, any> = {
      name: 'test',
    };

    // Should not throw
    deleteNestedProperty(obj, 'border', 'width');

    expect(obj.name).toBe('test');
    expect(obj.border).toBeUndefined();
  });

  it('should handle deleting non-existent property', () => {
    const obj = {
      border: { width: 2 },
    };

    deleteNestedProperty(obj, 'border', 'nonexistent');

    expect(obj.border).toEqual({ width: 2 });
  });
});

describe('setNestedProperty', () => {
  it('should set property on existing nested object', () => {
    const obj = {
      border: { width: 2 },
    };

    setNestedProperty(obj, 'border', 'style', 'dashed');

    expect(obj.border).toEqual({ width: 2, style: 'dashed' });
  });

  it('should create nested object if missing', () => {
    const obj: Record<string, any> = {
      name: 'test',
    };

    setNestedProperty(obj, 'border', 'width', 2);

    expect(obj.border).toEqual({ width: 2 });
  });

  it('should overwrite existing property value', () => {
    const obj = {
      border: { width: 2 },
    };

    setNestedProperty(obj, 'border', 'width', 5);

    expect(obj.border.width).toBe(5);
  });

  it('should handle setting null value', () => {
    const obj = {
      animation: { enabled: true },
    };

    setNestedProperty(obj, 'animation', 'enabled', null);

    expect(obj.animation.enabled).toBeNull();
  });

  it('should handle setting undefined value', () => {
    const obj = {
      animation: { enabled: true },
    };

    setNestedProperty(obj, 'animation', 'enabled', undefined);

    expect(obj.animation.enabled).toBeUndefined();
  });
});

describe('integration scenarios', () => {
  it('should support typical settings editing workflow', () => {
    // Start with empty dashboard settings
    const settings: Record<string, any> = {};

    // User sets a border width
    setNestedProperty(settings, 'border', 'width', 2);
    expect(settings.border).toEqual({ width: 2 });

    // User sets border style
    setNestedProperty(settings, 'border', 'style', 'dashed');
    expect(settings.border).toEqual({ width: 2, style: 'dashed' });

    // User resets border width (deletes the override)
    deleteNestedProperty(settings, 'border', 'width');
    expect(settings.border).toEqual({ style: 'dashed' });

    // User resets border style (last property, should remove border object)
    deleteNestedProperty(settings, 'border', 'style');
    expect(settings.border).toBeUndefined();
  });

  it('should handle cleanup after editing session', () => {
    const settings: Record<string, any> = {
      gutter: 8,
      showHeaders: true,
      border: {},  // User cleared all border overrides
      animation: { enabled: false },  // User set animation override
    };

    cleanupEmptyNestedObjects(settings, ['border', 'animation']);

    // Empty border should be removed, but animation with values kept
    expect(settings.border).toBeUndefined();
    expect(settings.animation).toEqual({ enabled: false });
    expect(settings.gutter).toBe(8);
  });
});

