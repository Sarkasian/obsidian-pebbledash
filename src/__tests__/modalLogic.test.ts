/**
 * Unit tests for modal logic utilities
 * 
 * Tests the pure logic functions used by TileSettingsModal and DashboardSettingsModal
 * without requiring Obsidian UI dependencies.
 */

import { describe, it, expect } from 'vitest';
import type { TileConstraints } from '@pebbledash/core';
import type { DashboardSettings, ObsidianTileMeta } from '../types';

// ==================== Locked Zones Logic ====================

/**
 * Update a locked zone in the constraints object.
 * Extracted from TileSettingsModal for testability.
 */
function updateLockedZone(
  constraints: TileConstraints,
  zone: 'top' | 'bottom' | 'left' | 'right',
  enabled: boolean
): TileConstraints {
  const result = { ...constraints };
  
  if (!result.lockedZones) {
    result.lockedZones = [];
  }
  
  const zones = [...result.lockedZones];
  const index = zones.indexOf(zone);
  
  if (enabled && index === -1) {
    zones.push(zone);
  } else if (!enabled && index !== -1) {
    zones.splice(index, 1);
  }
  
  if (zones.length === 0) {
    delete result.lockedZones;
  } else {
    result.lockedZones = zones;
  }
  
  return result;
}

/**
 * Clean up empty constraints before saving.
 * Extracted from TileSettingsModal for testability.
 */
function cleanupEmptyConstraints(constraints: TileConstraints): TileConstraints | undefined {
  const result = { ...constraints };
  
  if (result.lockedZones?.length === 0) {
    delete result.lockedZones;
  }
  
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Clean up empty dashboard settings before saving.
 * Extracted from DashboardSettingsModal for testability.
 */
function cleanupEmptyDashboardSettings(settings: DashboardSettings): DashboardSettings {
  const result = { ...settings };
  
  if (result.border && Object.keys(result.border).length === 0) {
    delete result.border;
  }
  if (result.animation && Object.keys(result.animation).length === 0) {
    delete result.animation;
  }
  
  return result;
}

// ==================== Tests ====================

describe('updateLockedZone', () => {
  it('should add a zone to empty lockedZones', () => {
    const constraints: TileConstraints = {};
    const result = updateLockedZone(constraints, 'top', true);
    expect(result.lockedZones).toEqual(['top']);
  });

  it('should add a zone to existing lockedZones', () => {
    const constraints: TileConstraints = { lockedZones: ['left'] };
    const result = updateLockedZone(constraints, 'top', true);
    expect(result.lockedZones).toContain('top');
    expect(result.lockedZones).toContain('left');
    expect(result.lockedZones?.length).toBe(2);
  });

  it('should not duplicate existing zone', () => {
    const constraints: TileConstraints = { lockedZones: ['top'] };
    const result = updateLockedZone(constraints, 'top', true);
    expect(result.lockedZones).toEqual(['top']);
  });

  it('should remove a zone when disabled', () => {
    const constraints: TileConstraints = { lockedZones: ['top', 'left'] };
    const result = updateLockedZone(constraints, 'top', false);
    expect(result.lockedZones).toEqual(['left']);
  });

  it('should delete lockedZones when last zone removed', () => {
    const constraints: TileConstraints = { lockedZones: ['top'] };
    const result = updateLockedZone(constraints, 'top', false);
    expect(result.lockedZones).toBeUndefined();
  });

  it('should handle removing non-existent zone gracefully', () => {
    const constraints: TileConstraints = { lockedZones: ['top'] };
    const result = updateLockedZone(constraints, 'bottom', false);
    expect(result.lockedZones).toEqual(['top']);
  });

  it('should preserve other constraint properties', () => {
    const constraints: TileConstraints = { 
      minWidth: 10, 
      maxHeight: 50,
      lockedZones: ['left'] 
    };
    const result = updateLockedZone(constraints, 'top', true);
    expect(result.minWidth).toBe(10);
    expect(result.maxHeight).toBe(50);
    expect(result.lockedZones).toContain('left');
    expect(result.lockedZones).toContain('top');
  });
});

describe('cleanupEmptyConstraints', () => {
  it('should return undefined for empty constraints', () => {
    const constraints: TileConstraints = {};
    const result = cleanupEmptyConstraints(constraints);
    expect(result).toBeUndefined();
  });

  it('should keep constraints with values', () => {
    const constraints: TileConstraints = { minWidth: 10 };
    const result = cleanupEmptyConstraints(constraints);
    expect(result).toEqual({ minWidth: 10 });
  });

  it('should remove empty lockedZones array', () => {
    const constraints: TileConstraints = { 
      minWidth: 10,
      lockedZones: [] 
    };
    const result = cleanupEmptyConstraints(constraints);
    expect(result).toEqual({ minWidth: 10 });
    expect(result?.lockedZones).toBeUndefined();
  });

  it('should return undefined when only lockedZones is empty', () => {
    const constraints: TileConstraints = { lockedZones: [] };
    const result = cleanupEmptyConstraints(constraints);
    expect(result).toBeUndefined();
  });

  it('should preserve non-empty lockedZones', () => {
    const constraints: TileConstraints = { lockedZones: ['top'] };
    const result = cleanupEmptyConstraints(constraints);
    expect(result?.lockedZones).toEqual(['top']);
  });
});

describe('cleanupEmptyDashboardSettings', () => {
  it('should remove empty border object', () => {
    const settings: DashboardSettings = {
      gutter: 8,
      border: {},
    };
    const result = cleanupEmptyDashboardSettings(settings);
    expect(result.gutter).toBe(8);
    expect(result.border).toBeUndefined();
  });

  it('should remove empty animation object', () => {
    const settings: DashboardSettings = {
      showHeaders: true,
      animation: {},
    };
    const result = cleanupEmptyDashboardSettings(settings);
    expect(result.showHeaders).toBe(true);
    expect(result.animation).toBeUndefined();
  });

  it('should keep non-empty border object', () => {
    const settings: DashboardSettings = {
      border: { width: 2 },
    };
    const result = cleanupEmptyDashboardSettings(settings);
    expect(result.border).toEqual({ width: 2 });
  });

  it('should keep non-empty animation object', () => {
    const settings: DashboardSettings = {
      animation: { enabled: false },
    };
    const result = cleanupEmptyDashboardSettings(settings);
    expect(result.animation).toEqual({ enabled: false });
  });

  it('should handle settings with no nested objects', () => {
    const settings: DashboardSettings = {
      gutter: 12,
      showHeaders: false,
      linkBehavior: 'new-tab',
    };
    const result = cleanupEmptyDashboardSettings(settings);
    expect(result).toEqual(settings);
  });

  it('should clean up both empty border and animation', () => {
    const settings: DashboardSettings = {
      gutter: 4,
      border: {},
      animation: {},
    };
    const result = cleanupEmptyDashboardSettings(settings);
    expect(result.gutter).toBe(4);
    expect(result.border).toBeUndefined();
    expect(result.animation).toBeUndefined();
  });
});

// ==================== Tile Meta Validation Tests ====================

describe('tile meta validation patterns', () => {
  it('should detect .dash file for seamless nested option', () => {
    const isDashFile = (contentRef?: string): boolean => {
      return contentRef?.toLowerCase().endsWith('.dash') ?? false;
    };

    expect(isDashFile('folder/dashboard.dash')).toBe(true);
    expect(isDashFile('DASHBOARD.DASH')).toBe(true);
    expect(isDashFile('notes/readme.md')).toBe(false);
    expect(isDashFile(undefined)).toBe(false);
    expect(isDashFile('')).toBe(false);
  });

  it('should determine correct widget type from meta', () => {
    const getWidgetType = (meta?: ObsidianTileMeta): string => {
      return meta?.widgetType ?? 'empty';
    };

    expect(getWidgetType({ widgetType: 'embedded' })).toBe('embedded');
    expect(getWidgetType({ widgetType: 'empty' })).toBe('empty');
    expect(getWidgetType(undefined)).toBe('empty');
    expect(getWidgetType({} as ObsidianTileMeta)).toBe('empty');
  });
});

// ==================== Settings Cascade Tests ====================

describe('settings cascade patterns', () => {
  const vaultSettings = {
    showHeaders: true,
    linkBehavior: 'new-tab' as const,
    scrollBehavior: 'clip' as const,
    gutter: 4,
  };

  const dashboardSettings: DashboardSettings = {
    showHeaders: false,
    gutter: 8,
  };

  it('should resolve cascade with tile override', () => {
    const tileMeta: ObsidianTileMeta = {
      widgetType: 'embedded',
      showHeader: true,  // Override
    };

    const resolved = tileMeta.showHeader 
      ?? dashboardSettings?.showHeaders 
      ?? vaultSettings.showHeaders;

    expect(resolved).toBe(true);
  });

  it('should resolve cascade with dashboard override', () => {
    const tileMeta: ObsidianTileMeta = {
      widgetType: 'embedded',
      // No showHeader override
    };

    const resolved = tileMeta.showHeader 
      ?? dashboardSettings?.showHeaders 
      ?? vaultSettings.showHeaders;

    expect(resolved).toBe(false);  // Dashboard says false
  });

  it('should resolve cascade to vault default', () => {
    const tileMeta: ObsidianTileMeta = {
      widgetType: 'embedded',
    };
    const emptyDashSettings: DashboardSettings = {};

    const resolved = tileMeta.linkBehavior 
      ?? emptyDashSettings?.linkBehavior 
      ?? vaultSettings.linkBehavior;

    expect(resolved).toBe('new-tab');  // Vault default
  });

  it('should handle all three levels of cascade', () => {
    // Test the full cascade: tile > dashboard > vault
    const resolveShowHeader = (
      tile?: boolean,
      dashboard?: boolean,
      vault: boolean = true
    ): boolean => {
      return tile ?? dashboard ?? vault;
    };

    // Tile override wins
    expect(resolveShowHeader(true, false, true)).toBe(true);
    expect(resolveShowHeader(false, true, true)).toBe(false);

    // Dashboard wins when tile undefined
    expect(resolveShowHeader(undefined, true, false)).toBe(true);
    expect(resolveShowHeader(undefined, false, true)).toBe(false);

    // Vault wins when both undefined
    expect(resolveShowHeader(undefined, undefined, true)).toBe(true);
    expect(resolveShowHeader(undefined, undefined, false)).toBe(false);
  });
});

// ==================== Constraint Bounds Tests ====================

describe('constraint bounds validation', () => {
  const BOUNDS = {
    minTileWidth: { min: 5, max: 50 },
    minTileHeight: { min: 5, max: 50 },
    maxTileWidth: { min: 50, max: 100 },
    maxTileHeight: { min: 50, max: 100 },
  };

  const clampValue = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  it('should clamp minimum tile width within bounds', () => {
    expect(clampValue(10, BOUNDS.minTileWidth.min, BOUNDS.minTileWidth.max)).toBe(10);
    expect(clampValue(3, BOUNDS.minTileWidth.min, BOUNDS.minTileWidth.max)).toBe(5);
    expect(clampValue(60, BOUNDS.minTileWidth.min, BOUNDS.minTileWidth.max)).toBe(50);
  });

  it('should validate min is not greater than max', () => {
    const isValidConstraints = (constraints: TileConstraints): boolean => {
      if (constraints.minWidth !== undefined && constraints.maxWidth !== undefined) {
        if (constraints.minWidth > constraints.maxWidth) return false;
      }
      if (constraints.minHeight !== undefined && constraints.maxHeight !== undefined) {
        if (constraints.minHeight > constraints.maxHeight) return false;
      }
      return true;
    };

    expect(isValidConstraints({ minWidth: 10, maxWidth: 50 })).toBe(true);
    expect(isValidConstraints({ minWidth: 50, maxWidth: 10 })).toBe(false);
    expect(isValidConstraints({ minHeight: 20, maxHeight: 80 })).toBe(true);
    expect(isValidConstraints({ minHeight: 80, maxHeight: 20 })).toBe(false);
    expect(isValidConstraints({ minWidth: 10 })).toBe(true);  // No max to compare
    expect(isValidConstraints({})).toBe(true);  // No constraints
  });
});

