/**
 * Unit tests for settings resolution functions
 */

import { describe, it, expect } from 'vitest';
import {
  resolveEffectiveTileSettings,
  resolveEffectiveDashboardConfig,
} from '../settingsResolver';
import type { PebbledashSettings, DashboardSettings, ObsidianTileMeta } from '../types';

// Default vault settings for testing
const defaultVaultSettings: PebbledashSettings = {
  minTileWidth: 10,
  minTileHeight: 10,
  maxTileWidth: 100,
  maxTileHeight: 100,
  gutter: 4,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--background-modifier-border)',
  showHeaders: true,
  scrollBehavior: 'clip',
  linkBehavior: 'new-tab',
  interactionMode: 'always',
  animationEnabled: true,
  animationDuration: 200,
  seamlessNested: false,
  showEmbedLink: false,
  redistributeEqually: false,
};

describe('resolveEffectiveTileSettings', () => {
  describe('basic cascading', () => {
    it('should use vault defaults when no dashboard or tile overrides', () => {
      const result = resolveEffectiveTileSettings(
        defaultVaultSettings,
        undefined,
        undefined
      );

      expect(result.showHeader).toBe(true);
      expect(result.linkBehavior).toBe('new-tab');
      expect(result.scrollBehavior).toBe('clip');
      expect(result.widgetType).toBe('empty');
    });

    it('should use dashboard settings over vault defaults', () => {
      const dashboardSettings: DashboardSettings = {
        showHeaders: false,
        linkBehavior: 'replace-dashboard',
        scrollBehavior: 'scroll',
      };

      const result = resolveEffectiveTileSettings(
        defaultVaultSettings,
        dashboardSettings,
        undefined
      );

      expect(result.showHeader).toBe(false);
      expect(result.linkBehavior).toBe('replace-dashboard');
      expect(result.scrollBehavior).toBe('scroll');
    });

    it('should use tile settings over dashboard settings', () => {
      const dashboardSettings: DashboardSettings = {
        showHeaders: false,
        linkBehavior: 'replace-dashboard',
      };

      const tileMeta: ObsidianTileMeta = {
        widgetType: 'embedded',
        showHeader: true,
        linkBehavior: 'replace-tile',
      };

      const result = resolveEffectiveTileSettings(
        defaultVaultSettings,
        dashboardSettings,
        tileMeta
      );

      expect(result.showHeader).toBe(true); // tile override
      expect(result.linkBehavior).toBe('replace-tile'); // tile override
      expect(result.scrollBehavior).toBe('clip'); // vault default (no override)
    });

    it('should use tile settings over vault defaults when no dashboard', () => {
      const tileMeta: ObsidianTileMeta = {
        widgetType: 'embedded',
        scrollBehavior: 'fit',
      };

      const result = resolveEffectiveTileSettings(
        defaultVaultSettings,
        undefined,
        tileMeta
      );

      expect(result.scrollBehavior).toBe('fit');
      expect(result.widgetType).toBe('embedded');
      expect(result.showHeader).toBe(true); // vault default
    });
  });

  describe('partial overrides', () => {
    it('should handle dashboard with partial settings', () => {
      const dashboardSettings: DashboardSettings = {
        gutter: 8, // Dashboard-level setting, not used in tile settings
        showHeaders: false,
      };

      const result = resolveEffectiveTileSettings(
        defaultVaultSettings,
        dashboardSettings,
        undefined
      );

      expect(result.showHeader).toBe(false);
      expect(result.linkBehavior).toBe('new-tab'); // vault default
      expect(result.scrollBehavior).toBe('clip'); // vault default
    });

    it('should handle tile with only contentRef', () => {
      const tileMeta: ObsidianTileMeta = {
        widgetType: 'embedded',
        contentRef: 'notes/test.md',
      };

      const result = resolveEffectiveTileSettings(
        defaultVaultSettings,
        undefined,
        tileMeta
      );

      expect(result.contentRef).toBe('notes/test.md');
      expect(result.showHeader).toBe(true); // vault default
    });
  });

  describe('tile-only settings', () => {
    it('should include background and padding from tile only', () => {
      const tileMeta: ObsidianTileMeta = {
        widgetType: 'embedded',
        background: 'linear-gradient(red, blue)',
        padding: '16px',
      };

      const result = resolveEffectiveTileSettings(
        defaultVaultSettings,
        undefined,
        tileMeta
      );

      expect(result.background).toBe('linear-gradient(red, blue)');
      expect(result.padding).toBe('16px');
    });

    it('should have undefined background/padding when tile does not specify', () => {
      const result = resolveEffectiveTileSettings(
        defaultVaultSettings,
        undefined,
        undefined
      );

      expect(result.background).toBeUndefined();
      expect(result.padding).toBeUndefined();
    });
  });
});

describe('resolveEffectiveDashboardConfig', () => {
  describe('basic cascading', () => {
    it('should use vault defaults when no dashboard settings', () => {
      const result = resolveEffectiveDashboardConfig(
        defaultVaultSettings,
        undefined
      );

      expect(result.minTile).toEqual({ width: 10, height: 10 });
      expect(result.gutter).toBe(4);
      expect(result.border).toEqual({
        width: 1,
        style: 'solid',
        color: 'var(--background-modifier-border)',
      });
      expect(result.animation).toEqual({
        enabled: true,
        duration: 200,
      });
      expect(result.showHeaders).toBe(true);
      expect(result.linkBehavior).toBe('new-tab');
    });

    it('should override with dashboard settings', () => {
      const dashboardSettings: DashboardSettings = {
        gutter: 8,
        showHeaders: false,
        linkBehavior: 'replace-tile',
        border: {
          width: 2,
          style: 'dashed',
        },
        animation: {
          enabled: false,
        },
      };

      const result = resolveEffectiveDashboardConfig(
        defaultVaultSettings,
        dashboardSettings
      );

      expect(result.gutter).toBe(8);
      expect(result.showHeaders).toBe(false);
      expect(result.linkBehavior).toBe('replace-tile');
      expect(result.border.width).toBe(2);
      expect(result.border.style).toBe('dashed');
      expect(result.border.color).toBe('var(--background-modifier-border)'); // vault default
      expect(result.animation.enabled).toBe(false);
      expect(result.animation.duration).toBe(200); // vault default
    });
  });

  describe('nested object overrides', () => {
    it('should merge partial border settings', () => {
      const dashboardSettings: DashboardSettings = {
        border: {
          color: '#ff0000',
        },
      };

      const result = resolveEffectiveDashboardConfig(
        defaultVaultSettings,
        dashboardSettings
      );

      expect(result.border.width).toBe(1); // vault default
      expect(result.border.style).toBe('solid'); // vault default
      expect(result.border.color).toBe('#ff0000'); // dashboard override
    });

    it('should merge partial animation settings', () => {
      const dashboardSettings: DashboardSettings = {
        animation: {
          duration: 500,
        },
      };

      const result = resolveEffectiveDashboardConfig(
        defaultVaultSettings,
        dashboardSettings
      );

      expect(result.animation.enabled).toBe(true); // vault default
      expect(result.animation.duration).toBe(500); // dashboard override
    });
  });

  describe('cssclass handling', () => {
    it('should include cssclass when specified in dashboard', () => {
      const dashboardSettings: DashboardSettings = {
        cssclass: 'my-custom-dashboard',
      };

      const result = resolveEffectiveDashboardConfig(
        defaultVaultSettings,
        dashboardSettings
      );

      expect(result.cssclass).toBe('my-custom-dashboard');
    });

    it('should have undefined cssclass when not specified', () => {
      const result = resolveEffectiveDashboardConfig(
        defaultVaultSettings,
        undefined
      );

      expect(result.cssclass).toBeUndefined();
    });
  });

  describe('min/max tile dimensions', () => {
    it('should use vault defaults for tile constraints', () => {
      const result = resolveEffectiveDashboardConfig(
        defaultVaultSettings,
        undefined
      );

      expect(result.minTile).toEqual({ width: 10, height: 10 });
      expect(result.maxTileWidth).toBe(100);
      expect(result.maxTileHeight).toBe(100);
    });

    it('should use custom vault settings for constraints', () => {
      const customVaultSettings: PebbledashSettings = {
        ...defaultVaultSettings,
        minTileWidth: 15,
        minTileHeight: 20,
        maxTileWidth: 80,
        maxTileHeight: 90,
      };

      const result = resolveEffectiveDashboardConfig(
        customVaultSettings,
        undefined
      );

      expect(result.minTile).toEqual({ width: 15, height: 20 });
      expect(result.maxTileWidth).toBe(80);
      expect(result.maxTileHeight).toBe(90);
    });
  });
});

describe('settings cascade integration', () => {
  it('should properly cascade all three levels', () => {
    // Vault sets defaults
    const vaultSettings: PebbledashSettings = {
      ...defaultVaultSettings,
      showHeaders: true,
      linkBehavior: 'new-tab',
      scrollBehavior: 'clip',
    };

    // Dashboard overrides some
    const dashboardSettings: DashboardSettings = {
      showHeaders: false,
      linkBehavior: 'replace-dashboard',
    };

    // Tile overrides some
    const tileMeta: ObsidianTileMeta = {
      widgetType: 'embedded',
      linkBehavior: 'replace-tile',
      contentRef: 'test.md',
    };

    const result = resolveEffectiveTileSettings(
      vaultSettings,
      dashboardSettings,
      tileMeta
    );

    // showHeader: tile undefined → dashboard false
    expect(result.showHeader).toBe(false);
    // linkBehavior: tile 'replace-tile' wins
    expect(result.linkBehavior).toBe('replace-tile');
    // scrollBehavior: tile undefined → dashboard undefined → vault 'clip'
    expect(result.scrollBehavior).toBe('clip');
    // contentRef: from tile
    expect(result.contentRef).toBe('test.md');
    // widgetType: from tile
    expect(result.widgetType).toBe('embedded');
  });
});

