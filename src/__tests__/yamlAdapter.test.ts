/**
 * Unit tests for YAML adapter functions
 */

import { describe, it, expect } from 'vitest';
import {
  parseDashFile,
  serializeDashFile,
  createEmptyDashFile,
  dashFileToSnapshot,
  snapshotToDashFile,
} from '../yamlAdapter';
import type { DashFile, Snapshot } from '../types';
import type { TileId } from '@pebbledash/core';

describe('parseDashFile', () => {
  describe('valid content', () => {
    it('should parse a simple dashboard file', () => {
      const content = `
version: 1
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 50
    height: 100
    meta:
      widgetType: empty
  - id: tile-2
    x: 50
    y: 0
    width: 50
    height: 100
    meta:
      widgetType: embedded
      contentRef: notes/test.md
`;
      const result = parseDashFile(content);

      expect(result.version).toBe(1);
      expect(result.tiles).toHaveLength(2);
      expect(result.tiles[0].id).toBe('tile-1');
      expect(result.tiles[0].width).toBe(50);
      expect(result.tiles[1].meta?.widgetType).toBe('embedded');
      expect(result.tiles[1].meta?.contentRef).toBe('notes/test.md');
    });

    it('should parse dashboard with settings', () => {
      const content = `
version: 1
settings:
  gutter: 8
  showHeaders: false
  linkBehavior: replace-tile
  border:
    width: 2
    style: dashed
    color: '#ff0000'
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      widgetType: empty
`;
      const result = parseDashFile(content);

      expect(result.settings).toBeDefined();
      expect(result.settings?.gutter).toBe(8);
      expect(result.settings?.showHeaders).toBe(false);
      expect(result.settings?.border?.width).toBe(2);
    });

    it('should handle tiles with all properties', () => {
      const content = `
version: 1
tiles:
  - id: tile-1
    x: 10
    y: 20
    width: 30
    height: 40
    locked: true
    meta:
      widgetType: embedded
      contentRef: test.md
      showHeader: true
      linkBehavior: new-tab
      scrollBehavior: fit
      background: '#ff0000'
      padding: 16px
    constraints:
      minWidth: 15
      minHeight: 20
`;
      const result = parseDashFile(content);

      const tile = result.tiles[0];
      expect(tile.locked).toBe(true);
      expect(tile.meta?.showHeader).toBe(true);
      expect(tile.meta?.background).toBe('#ff0000');
      expect(tile.constraints?.minWidth).toBe(15);
    });
  });

  describe('invalid content', () => {
    it('should return empty dashboard for empty string', () => {
      const result = parseDashFile('');

      expect(result.version).toBe(1);
      expect(result.tiles).toHaveLength(1);
      expect(result.tiles[0].width).toBe(100);
    });

    it('should return empty dashboard for null-like content', () => {
      const result = parseDashFile('null');

      expect(result.version).toBe(1);
      expect(result.tiles).toHaveLength(1);
    });

    it('should return empty dashboard for non-object content', () => {
      const result = parseDashFile('just a string');

      expect(result.version).toBe(1);
      expect(result.tiles).toBeDefined();
    });

    it('should add default version if missing', () => {
      const content = `
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
`;
      const result = parseDashFile(content);

      expect(result.version).toBe(1);
    });

    it('should create empty tiles array if missing', () => {
      const content = `
version: 1
settings:
  gutter: 8
`;
      const result = parseDashFile(content);

      expect(result.tiles).toEqual([]);
    });
  });
});

describe('serializeDashFile', () => {
  it('should serialize a dashboard file to YAML', () => {
    const dashFile: DashFile = {
      version: 1,
      tiles: [
        {
          id: 'tile-1' as TileId,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          meta: { widgetType: 'empty' },
        },
      ],
    };

    const result = serializeDashFile(dashFile);

    expect(result).toContain('version: 1');
    expect(result).toContain('tiles:');
    expect(result).toContain('id: tile-1');
    expect(result).toContain('widgetType: empty');
  });

  it('should serialize settings correctly', () => {
    const dashFile: DashFile = {
      version: 1,
      settings: {
        gutter: 8,
        showHeaders: false,
      },
      tiles: [],
    };

    const result = serializeDashFile(dashFile);

    expect(result).toContain('gutter: 8');
    expect(result).toContain('showHeaders: false');
  });

  it('should round-trip through parse and serialize', () => {
    const original: DashFile = {
      version: 1,
      settings: {
        gutter: 4,
        border: { width: 2, style: 'solid', color: '#000' },
      },
      tiles: [
        {
          id: 'tile-1' as TileId,
          x: 0,
          y: 0,
          width: 50,
          height: 100,
          meta: { widgetType: 'embedded', contentRef: 'test.md' },
        },
        {
          id: 'tile-2' as TileId,
          x: 50,
          y: 0,
          width: 50,
          height: 100,
          locked: true,
          meta: { widgetType: 'empty' },
        },
      ],
    };

    const serialized = serializeDashFile(original);
    const parsed = parseDashFile(serialized);

    expect(parsed.version).toBe(original.version);
    expect(parsed.settings?.gutter).toBe(original.settings?.gutter);
    expect(parsed.tiles).toHaveLength(2);
    expect(parsed.tiles[0].meta?.contentRef).toBe('test.md');
    expect(parsed.tiles[1].locked).toBe(true);
  });
});

describe('createEmptyDashFile', () => {
  it('should create a dashboard with one full-size tile', () => {
    const result = createEmptyDashFile();

    expect(result.version).toBe(1);
    expect(result.tiles).toHaveLength(1);
    expect(result.tiles[0].x).toBe(0);
    expect(result.tiles[0].y).toBe(0);
    expect(result.tiles[0].width).toBe(100);
    expect(result.tiles[0].height).toBe(100);
    expect(result.tiles[0].meta?.widgetType).toBe('empty');
  });

  it('should create unique instances on each call', () => {
    const dash1 = createEmptyDashFile();
    const dash2 = createEmptyDashFile();

    expect(dash1).not.toBe(dash2);
    expect(dash1.tiles).not.toBe(dash2.tiles);
  });
});

describe('dashFileToSnapshot', () => {
  it('should convert a dashboard file to snapshot format', () => {
    const dashFile: DashFile = {
      version: 1,
      tiles: [
        {
          id: 'tile-1' as TileId,
          x: 0,
          y: 0,
          width: 50,
          height: 100,
          meta: { widgetType: 'empty' },
        },
        {
          id: 'tile-2' as TileId,
          x: 50,
          y: 0,
          width: 50,
          height: 100,
          locked: true,
          meta: { widgetType: 'embedded', contentRef: 'test.md' },
        },
      ],
    };

    const result = dashFileToSnapshot(dashFile);

    expect(result.version).toBe(1);
    expect(result.tiles).toHaveLength(2);
    expect(result.tiles[0].id).toBe('tile-1');
    expect(result.tiles[1].locked).toBe(true);
    expect(result.tiles[1].meta?.contentRef).toBe('test.md');
  });

  it('should handle dashboard without settings', () => {
    const dashFile: DashFile = {
      version: 1,
      tiles: [],
    };

    const result = dashFileToSnapshot(dashFile);

    // SnapshotV1 doesn't have settings field
    expect(result.version).toBe(1);
    expect(result.tiles).toEqual([]);
  });
});

describe('snapshotToDashFile', () => {
  it('should convert a snapshot to dashboard file format', () => {
    const snapshot: Snapshot = {
      version: 1,
      tiles: [
        {
          id: 'tile-1' as TileId,
          x: 0,
          y: 0,
          width: 50,
          height: 100,
          locked: false,
          meta: { widgetType: 'empty' },
        },
        {
          id: 'tile-2' as TileId,
          x: 50,
          y: 0,
          width: 50,
          height: 100,
          locked: true,
          meta: { widgetType: 'embedded', contentRef: 'test.md' },
        },
      ],
    };

    const result = snapshotToDashFile(snapshot);

    expect(result.version).toBe(1);
    expect(result.tiles).toHaveLength(2);
    expect(result.tiles[0].id).toBe('tile-1');
    expect(result.tiles[1].locked).toBe(true);
  });

  it('should preserve existing settings', () => {
    const snapshot: Snapshot = {
      version: 1,
      tiles: [],
    };
    const existingSettings = {
      gutter: 8,
      showHeaders: false,
      linkBehavior: 'replace-tile' as const,
    };

    const result = snapshotToDashFile(snapshot, existingSettings);

    expect(result.settings?.gutter).toBe(8);
    expect(result.settings?.showHeaders).toBe(false);
  });

  it('should handle snapshot without settings', () => {
    const snapshot: Snapshot = {
      version: 1,
      tiles: [],
    };

    const result = snapshotToDashFile(snapshot);

    expect(result.settings).toBeUndefined();
  });

  it('should round-trip with dashFileToSnapshot', () => {
    const original: DashFile = {
      version: 1,
      settings: { gutter: 4 },
      tiles: [
        {
          id: 'tile-1' as TileId,
          x: 10,
          y: 20,
          width: 30,
          height: 40,
          locked: true,
          meta: {
            widgetType: 'embedded',
            contentRef: 'notes/file.md',
            showHeader: true,
          },
          constraints: { minWidth: 15 },
        },
      ],
    };

    const snapshot = dashFileToSnapshot(original);
    const result = snapshotToDashFile(snapshot, original.settings);

    expect(result.version).toBe(1);
    expect(result.settings?.gutter).toBe(4);
    expect(result.tiles[0].x).toBe(10);
    expect(result.tiles[0].locked).toBe(true);
    expect(result.tiles[0].meta?.contentRef).toBe('notes/file.md');
  });
});

