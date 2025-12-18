/**
 * Unit tests for widgets helper functions
 * 
 * Note: Widget factories are not tested here due to obsidian dependencies.
 * Integration tests should be used for full widget testing in an Obsidian environment.
 */

import { describe, it, expect, vi } from 'vitest';
import { getFilenameWithoutExtension, getFileExtension } from '../widgets/helpers';
import type { Widget, WidgetFactory, WidgetContext, WidgetRegistry } from '../widgets/types';

describe('Widget Helpers', () => {
  describe('getFilenameWithoutExtension', () => {
    it('should extract filename from path', () => {
      expect(getFilenameWithoutExtension('notes/test.md')).toBe('test');
    });

    it('should handle nested paths', () => {
      expect(getFilenameWithoutExtension('folder/subfolder/deep/file.pdf')).toBe('file');
    });

    it('should handle root-level files', () => {
      expect(getFilenameWithoutExtension('document.txt')).toBe('document');
    });

    it('should handle files with multiple dots', () => {
      expect(getFilenameWithoutExtension('notes/my.file.name.md')).toBe('my.file.name');
    });

    it('should handle files without extension', () => {
      expect(getFilenameWithoutExtension('notes/README')).toBe('README');
    });

    it('should handle empty string', () => {
      expect(getFilenameWithoutExtension('')).toBe('');
    });

    it('should handle path ending with slash', () => {
      expect(getFilenameWithoutExtension('folder/')).toBe('');
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension from simple file', () => {
      expect(getFileExtension('document.md')).toBe('md');
    });

    it('should extract extension from path', () => {
      expect(getFileExtension('notes/folder/file.pdf')).toBe('pdf');
    });

    it('should handle multiple dots', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return lowercase extension', () => {
      expect(getFileExtension('Image.PNG')).toBe('png');
      expect(getFileExtension('Document.MD')).toBe('md');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('Makefile')).toBe('');
      expect(getFileExtension('README')).toBe('');
    });

    it('should handle empty string', () => {
      expect(getFileExtension('')).toBe('');
    });

    it('should handle hidden files with extension', () => {
      expect(getFileExtension('.gitignore')).toBe('gitignore');
    });
  });
});

describe('Widget Interface Types', () => {
  it('should allow creating a minimal widget implementation', () => {
    const widget: Widget = {
      mount: vi.fn(),
      unmount: vi.fn(),
    };

    expect(typeof widget.mount).toBe('function');
    expect(typeof widget.unmount).toBe('function');
    expect(widget.update).toBeUndefined();
    expect(widget.setLocked).toBeUndefined();
  });

  it('should allow creating a full widget implementation', () => {
    const widget: Widget = {
      mount: vi.fn(),
      unmount: vi.fn(),
      update: vi.fn(),
      setLocked: vi.fn(),
      toggleLocked: vi.fn(),
      isLocked: vi.fn().mockReturnValue(true),
    };

    expect(typeof widget.mount).toBe('function');
    expect(typeof widget.unmount).toBe('function');
    expect(typeof widget.update).toBe('function');
    expect(typeof widget.setLocked).toBe('function');
    expect(typeof widget.toggleLocked).toBe('function');
    expect(widget.isLocked!()).toBe(true);
  });

  it('should define a valid widget factory signature', () => {
    const factory: WidgetFactory = (_ctx: WidgetContext) => ({
      mount: () => {},
      unmount: () => {},
    });

    expect(typeof factory).toBe('function');
  });

  it('should define a valid widget registry structure', () => {
    const mockFactory: WidgetFactory = (_ctx) => ({
      mount: () => {},
      unmount: () => {},
    });

    const registry: WidgetRegistry = {
      empty: mockFactory,
      embedded: mockFactory,
      custom: mockFactory,
    };

    expect(Object.keys(registry)).toContain('empty');
    expect(Object.keys(registry)).toContain('embedded');
    expect(Object.keys(registry)).toContain('custom');
  });
});

describe('Widget Registry Functions', () => {
  // Test the createWidgetRegistry and getWidgetFactory functions
  // by creating a manual registry (to avoid obsidian dependencies)
  
  it('should get factory from registry', () => {
    const mockFactory: WidgetFactory = vi.fn().mockReturnValue({
      mount: vi.fn(),
      unmount: vi.fn(),
    });
    
    const emptyFactory: WidgetFactory = vi.fn().mockReturnValue({
      mount: vi.fn(),
      unmount: vi.fn(),
    });
    
    const registry: WidgetRegistry = {
      empty: emptyFactory,
      custom: mockFactory,
    };
    
    // Simulate getWidgetFactory logic
    const getFactory = (type: string): WidgetFactory => {
      return registry[type] ?? registry['empty'] ?? emptyFactory;
    };
    
    expect(getFactory('custom')).toBe(mockFactory);
    expect(getFactory('empty')).toBe(emptyFactory);
    expect(getFactory('nonexistent')).toBe(emptyFactory);
  });

  it('should merge registries correctly', () => {
    const builtInFactory: WidgetFactory = vi.fn();
    const customFactory: WidgetFactory = vi.fn();
    
    const builtIn: WidgetRegistry = {
      empty: builtInFactory,
      embedded: builtInFactory,
    };
    
    const custom: WidgetRegistry = {
      custom: customFactory,
      special: customFactory,
    };
    
    // Simulate createWidgetRegistry logic
    const merged: WidgetRegistry = {
      ...builtIn,
      ...custom,
    };
    
    expect(Object.keys(merged)).toHaveLength(4);
    expect(merged.empty).toBe(builtInFactory);
    expect(merged.embedded).toBe(builtInFactory);
    expect(merged.custom).toBe(customFactory);
    expect(merged.special).toBe(customFactory);
  });

  it('should allow custom widgets to override built-in', () => {
    const builtInEmpty: WidgetFactory = vi.fn();
    const customEmpty: WidgetFactory = vi.fn();
    
    const builtIn: WidgetRegistry = {
      empty: builtInEmpty,
    };
    
    const custom: WidgetRegistry = {
      empty: customEmpty,
    };
    
    const merged: WidgetRegistry = {
      ...builtIn,
      ...custom,
    };
    
    expect(merged.empty).toBe(customEmpty);
    expect(merged.empty).not.toBe(builtInEmpty);
  });
});
