/**
 * Unit tests for change handler utility functions
 */

import { describe, it, expect } from 'vitest';
import { mergeTileMetadata, hasSameLayout } from '../DashboardView/changeHandlers';
import type { DashTile } from '../types';
import type { TileId } from '@pebbledash/core';

const createTile = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  meta?: DashTile['meta']
): DashTile => ({
  id: id as TileId,
  x,
  y,
  width,
  height,
  meta,
});

describe('mergeTileMetadata', () => {
  it('should preserve metadata from source tiles', () => {
    const destTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
      createTile('tile-2', 50, 0, 50, 100),
    ];
    const srcTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 100, 100, { widgetType: 'embedded', contentRef: 'notes/test.md' }),
      createTile('tile-2', 50, 0, 50, 100, { widgetType: 'empty' }),
    ];

    const result = mergeTileMetadata(destTiles, srcTiles);

    expect(result[0].meta).toEqual({ widgetType: 'embedded', contentRef: 'notes/test.md' });
    expect(result[1].meta).toEqual({ widgetType: 'empty' });
  });

  it('should add default empty meta for new tiles', () => {
    const destTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
      createTile('tile-new', 50, 0, 50, 100),
    ];
    const srcTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 100, 100, { widgetType: 'embedded', contentRef: 'test.md' }),
    ];

    const result = mergeTileMetadata(destTiles, srcTiles);

    expect(result[0].meta).toEqual({ widgetType: 'embedded', contentRef: 'test.md' });
    expect(result[1].meta).toEqual({ widgetType: 'empty' });
  });

  it('should keep existing meta if destination tile already has it', () => {
    const destTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100, { widgetType: 'embedded', contentRef: 'new.md' }),
    ];
    const srcTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 100, 100, { widgetType: 'embedded', contentRef: 'old.md' }),
    ];

    const result = mergeTileMetadata(destTiles, srcTiles);

    // Source meta should override destination meta
    expect(result[0].meta).toEqual({ widgetType: 'embedded', contentRef: 'old.md' });
  });

  it('should handle empty source tiles', () => {
    const destTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 100, 100),
    ];
    const srcTiles: DashTile[] = [];

    const result = mergeTileMetadata(destTiles, srcTiles);

    expect(result[0].meta).toEqual({ widgetType: 'empty' });
  });

  it('should handle empty destination tiles', () => {
    const destTiles: DashTile[] = [];
    const srcTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 100, 100, { widgetType: 'embedded', contentRef: 'test.md' }),
    ];

    const result = mergeTileMetadata(destTiles, srcTiles);

    expect(result).toEqual([]);
  });

  it('should preserve all meta properties', () => {
    const destTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
    ];
    const srcTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 100, 100, {
        widgetType: 'embedded',
        contentRef: 'notes/file.md',
        showHeader: true,
        linkBehavior: 'replace-tile',
        scrollBehavior: 'fit',
        background: '#ff0000',
        padding: '16px',
      }),
    ];

    const result = mergeTileMetadata(destTiles, srcTiles);

    expect(result[0].meta).toEqual({
      widgetType: 'embedded',
      contentRef: 'notes/file.md',
      showHeader: true,
      linkBehavior: 'replace-tile',
      scrollBehavior: 'fit',
      background: '#ff0000',
      padding: '16px',
    });
  });

  it('should not mutate original arrays', () => {
    const destTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
    ];
    const srcTiles: DashTile[] = [
      createTile('tile-1', 0, 0, 100, 100, { widgetType: 'embedded' }),
    ];
    
    const originalDestMeta = destTiles[0].meta;
    mergeTileMetadata(destTiles, srcTiles);

    expect(destTiles[0].meta).toBe(originalDestMeta);
  });
});

describe('hasSameLayout', () => {
  it('should return true for identical layouts', () => {
    const tilesA: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
      createTile('tile-2', 50, 0, 50, 100),
    ];
    const tilesB: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
      createTile('tile-2', 50, 0, 50, 100),
    ];

    expect(hasSameLayout(tilesA, tilesB)).toBe(true);
  });

  it('should return true when only metadata differs', () => {
    const tilesA: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100, { widgetType: 'empty' }),
    ];
    const tilesB: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100, { widgetType: 'embedded', contentRef: 'test.md' }),
    ];

    expect(hasSameLayout(tilesA, tilesB)).toBe(true);
  });

  it('should return false for different tile counts', () => {
    const tilesA: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
      createTile('tile-2', 50, 0, 50, 100),
    ];
    const tilesB: DashTile[] = [
      createTile('tile-1', 0, 0, 100, 100),
    ];

    expect(hasSameLayout(tilesA, tilesB)).toBe(false);
  });

  it('should return false when x position differs', () => {
    const tilesA: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
    ];
    const tilesB: DashTile[] = [
      createTile('tile-1', 10, 0, 50, 100),
    ];

    expect(hasSameLayout(tilesA, tilesB)).toBe(false);
  });

  it('should return false when y position differs', () => {
    const tilesA: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
    ];
    const tilesB: DashTile[] = [
      createTile('tile-1', 0, 10, 50, 100),
    ];

    expect(hasSameLayout(tilesA, tilesB)).toBe(false);
  });

  it('should return false when width differs', () => {
    const tilesA: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
    ];
    const tilesB: DashTile[] = [
      createTile('tile-1', 0, 0, 60, 100),
    ];

    expect(hasSameLayout(tilesA, tilesB)).toBe(false);
  });

  it('should return false when height differs', () => {
    const tilesA: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
    ];
    const tilesB: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 90),
    ];

    expect(hasSameLayout(tilesA, tilesB)).toBe(false);
  });

  it('should return false when tile id not found', () => {
    const tilesA: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
    ];
    const tilesB: DashTile[] = [
      createTile('tile-2', 0, 0, 50, 100),
    ];

    expect(hasSameLayout(tilesA, tilesB)).toBe(false);
  });

  it('should return true for empty arrays', () => {
    expect(hasSameLayout([], [])).toBe(true);
  });

  it('should handle tiles in different order', () => {
    const tilesA: DashTile[] = [
      createTile('tile-1', 0, 0, 50, 100),
      createTile('tile-2', 50, 0, 50, 100),
    ];
    const tilesB: DashTile[] = [
      createTile('tile-2', 50, 0, 50, 100),
      createTile('tile-1', 0, 0, 50, 100),
    ];

    // Order shouldn't matter, we look up by ID
    expect(hasSameLayout(tilesA, tilesB)).toBe(true);
  });
});

