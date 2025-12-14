/**
 * Unit tests for FileTracker
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TFile } from 'obsidian';

// Mock debounce before importing FileTracker
vi.mock('obsidian', async (importOriginal) => {
  const original = await importOriginal<typeof import('obsidian')>();
  return {
    ...original,
    debounce: (fn: (...args: unknown[]) => void) => fn,
  };
});

import { FileTracker } from '../fileTracker';

type EventCallback = (...args: unknown[]) => void;

/**
 * Create a mock TFile object with the given path.
 * TFile constructor doesn't accept arguments, so we create an object
 * with the necessary properties.
 */
function createMockTFile(path: string): TFile {
  const extension = path.split('.').pop() || '';
  return {
    path,
    name: path.split('/').pop() || path,
    extension,
    basename: (path.split('/').pop() || path).replace(`.${extension}`, ''),
    vault: null,
    parent: null,
    stat: { ctime: 0, mtime: 0, size: 0 },
  } as unknown as TFile;
}

class MockVault {
  private files: Map<string, string> = new Map();
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private eventRefCounter = 0;
  private eventRefToCallback: Map<number, { event: string; callback: EventCallback }> = new Map();
  
  // Event handling
  on(event: string, callback: EventCallback): { id: number } {
    const listeners = this.eventListeners.get(event) || new Set();
    listeners.add(callback);
    this.eventListeners.set(event, listeners);
    
    const refId = ++this.eventRefCounter;
    this.eventRefToCallback.set(refId, { event, callback });
    return { id: refId };
  }
  
  offref(ref: { id: number }): void {
    const entry = this.eventRefToCallback.get(ref.id);
    if (entry) {
      const listeners = this.eventListeners.get(entry.event);
      if (listeners) {
        listeners.delete(entry.callback);
      }
      this.eventRefToCallback.delete(ref.id);
    }
  }
  
  trigger(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        callback(...args);
      }
    }
  }
  
  // File operations
  async read(file: TFile): Promise<string> {
    return this.files.get(file.path) || '';
  }
  
  async modify(file: TFile, content: string): Promise<void> {
    this.files.set(file.path, content);
  }
  
  async create(path: string, content: string): Promise<TFile> {
    this.files.set(path, content);
    return createMockTFile(path);
  }
  
  getAbstractFileByPath(path: string): TFile | null {
    if (this.files.has(path)) {
      return createMockTFile(path);
    }
    return null;
  }
  
  getFiles(): TFile[] {
    return Array.from(this.files.keys()).map(path => createMockTFile(path));
  }
  
  // Test helper
  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }
  
  deleteFile(path: string): void {
    this.files.delete(path);
  }
}

describe('FileTracker', () => {
  let vault: MockVault;
  let tracker: FileTracker;

  beforeEach(() => {
    vault = new MockVault();
    tracker = new FileTracker(vault as unknown as import('obsidian').Vault);
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('indexing', () => {
    it('should index a dashboard with file references', async () => {
      const dashContent = `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 50
    height: 100
    meta:
      widgetType: embedded
      contentRef: notes/file1.md
  - id: tile-2
    x: 50
    y: 0
    width: 50
    height: 100
    meta:
      widgetType: embedded
      contentRef: notes/file2.md
`;
      vault.setFile('dashboard.dash', dashContent);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      const refs1 = tracker.getDashboardsReferencing('notes/file1.md');
      const refs2 = tracker.getDashboardsReferencing('notes/file2.md');
      
      expect(refs1.has('dashboard.dash')).toBe(true);
      expect(refs2.has('dashboard.dash')).toBe(true);
    });

    it('should index all dashboards in the vault', async () => {
      vault.setFile('dash1.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: shared.md
`);
      vault.setFile('dash2.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: shared.md
`);
      
      await tracker.indexAllDashboards();
      
      const refs = tracker.getDashboardsReferencing('shared.md');
      expect(refs.size).toBe(2);
      expect(refs.has('dash1.dash')).toBe(true);
      expect(refs.has('dash2.dash')).toBe(true);
    });

    it('should clear previous references when re-indexing a dashboard', async () => {
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: old-file.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      expect(tracker.getDashboardsReferencing('old-file.md').size).toBe(1);
      
      // Update dashboard with different reference
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: new-file.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      expect(tracker.getDashboardsReferencing('old-file.md').size).toBe(0);
      expect(tracker.getDashboardsReferencing('new-file.md').size).toBe(1);
    });
  });

  describe('removeDashboard', () => {
    it('should remove a dashboard from the index', async () => {
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: file.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      expect(tracker.getDashboardsReferencing('file.md').size).toBe(1);
      
      tracker.removeDashboard('dashboard.dash');
      expect(tracker.getDashboardsReferencing('file.md').size).toBe(0);
    });
  });

  describe('callbacks', () => {
    it('should register and call file change callbacks', async () => {
      const callback = vi.fn();
      const unregister = tracker.onFileChange(callback);
      
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: old-name.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      
      // Simulate file rename
      vault.trigger('rename', createMockTFile('new-name.md'), 'old-name.md');
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // The callback should be called with the old and new paths
      expect(callback).toHaveBeenCalledWith('dashboard.dash', 'old-name.md', 'new-name.md');
      
      unregister();
    });

    it('should call delete callback with null for deleted files', async () => {
      const callback = vi.fn();
      tracker.onFileChange(callback);
      
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: file.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      
      // Simulate file delete
      vault.trigger('delete', createMockTFile('file.md'));
      
      expect(callback).toHaveBeenCalledWith('dashboard.dash', 'file.md', null);
    });

    it('should register and call modify callbacks', async () => {
      const callback = vi.fn();
      tracker.onFileModify(callback);
      
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: watched.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      
      // Simulate file modification
      vault.trigger('modify', createMockTFile('watched.md'));
      
      expect(callback).toHaveBeenCalledWith('watched.md', ['dashboard.dash']);
    });

    it('should unregister callbacks correctly', async () => {
      const callback = vi.fn();
      const unregister = tracker.onFileChange(callback);
      
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: file.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      
      unregister();
      
      vault.trigger('delete', createMockTFile('file.md'));
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('file rename handling', () => {
    it('should update dashboard file when a referenced file is renamed', async () => {
      const dashContent = `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: old-path.md
`;
      vault.setFile('dashboard.dash', dashContent);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      
      // Simulate file rename
      vault.trigger('rename', createMockTFile('new-path.md'), 'old-path.md');
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check that the dashboard file was updated
      const updatedContent = await vault.read(createMockTFile('dashboard.dash'));
      expect(updatedContent).toContain('new-path.md');
      expect(updatedContent).not.toContain('old-path.md');
    });

    it('should update index when dashboard file is renamed', async () => {
      vault.setFile('old-dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: file.md
`);
      
      await tracker.indexDashboard(createMockTFile('old-dashboard.dash'));
      
      tracker.start();
      
      // Simulate dashboard rename
      vault.trigger('rename', createMockTFile('new-dashboard.dash'), 'old-dashboard.dash');
      
      const refs = tracker.getDashboardsReferencing('file.md');
      expect(refs.has('old-dashboard.dash')).toBe(false);
      expect(refs.has('new-dashboard.dash')).toBe(true);
    });
  });

  describe('file deletion handling', () => {
    it('should remove dashboard from index when deleted', async () => {
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: file.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      expect(tracker.getDashboardsReferencing('file.md').size).toBe(1);
      
      tracker.start();
      
      // Simulate dashboard deletion
      vault.trigger('delete', createMockTFile('dashboard.dash'));
      
      expect(tracker.getDashboardsReferencing('file.md').size).toBe(0);
    });

    it('should remove file from index when deleted', async () => {
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: file.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      
      vault.trigger('delete', createMockTFile('file.md'));
      
      expect(tracker.getDashboardsReferencing('file.md').size).toBe(0);
    });
  });

  describe('getDashboardsReferencing', () => {
    it('should return empty set for non-referenced files', () => {
      const refs = tracker.getDashboardsReferencing('unknown.md');
      expect(refs.size).toBe(0);
    });

    it('should return all dashboards referencing a file', async () => {
      vault.setFile('dash1.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: shared.md
`);
      vault.setFile('dash2.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: shared.md
`);
      vault.setFile('dash3.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: other.md
`);
      
      await tracker.indexAllDashboards();
      
      const sharedRefs = tracker.getDashboardsReferencing('shared.md');
      expect(sharedRefs.size).toBe(2);
      expect(sharedRefs.has('dash1.dash')).toBe(true);
      expect(sharedRefs.has('dash2.dash')).toBe(true);
      expect(sharedRefs.has('dash3.dash')).toBe(false);
    });
  });

  describe('start/stop', () => {
    it('should not respond to events after stop', async () => {
      const callback = vi.fn();
      tracker.onFileChange(callback);
      
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: file.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      tracker.stop();
      
      vault.trigger('delete', createMockTFile('file.md'));
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty dashboard (no tiles)', async () => {
      vault.setFile('empty.dash', `
version: 2
tiles: []
`);
      
      // Should not throw
      await tracker.indexDashboard(createMockTFile('empty.dash'));
      
      // No references should be tracked
      expect(tracker.getDashboardsReferencing('anything.md').size).toBe(0);
    });

    it('should handle dashboard with tiles but no contentRef', async () => {
      vault.setFile('no-content.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      widgetType: empty
`);
      
      // Should not throw
      await tracker.indexDashboard(createMockTFile('no-content.dash'));
      
      // No references should be tracked
      expect(tracker.getDashboardsReferencing('').size).toBe(0);
    });

    it('should handle dashboard with missing meta', async () => {
      vault.setFile('no-meta.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
`);
      
      // Should not throw
      await tracker.indexDashboard(createMockTFile('no-meta.dash'));
    });

    it('should handle concurrent renames of multiple files', async () => {
      const callback = vi.fn();
      tracker.onFileChange(callback);
      
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 50
    height: 100
    meta:
      contentRef: file1.md
  - id: tile-2
    x: 50
    y: 0
    width: 50
    height: 100
    meta:
      contentRef: file2.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      
      // Simulate concurrent renames (both happen rapidly)
      vault.trigger('rename', createMockTFile('new-file1.md'), 'file1.md');
      vault.trigger('rename', createMockTFile('new-file2.md'), 'file2.md');
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Both callbacks should be called
      expect(callback).toHaveBeenCalledWith('dashboard.dash', 'file1.md', 'new-file1.md');
      expect(callback).toHaveBeenCalledWith('dashboard.dash', 'file2.md', 'new-file2.md');
    });

    it('should not call modify callback for dashboard files themselves', async () => {
      const callback = vi.fn();
      tracker.onFileModify(callback);
      
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: file.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      
      // Simulate modification of the dashboard file itself
      vault.trigger('modify', createMockTFile('dashboard.dash'));
      
      // Should not trigger callback for dashboard file modifications
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not call modify callback for non-referenced files', async () => {
      const callback = vi.fn();
      tracker.onFileModify(callback);
      
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: tracked.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      
      // Simulate modification of a non-referenced file
      vault.trigger('modify', createMockTFile('untracked.md'));
      
      // Should not trigger callback
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle malformed YAML gracefully', async () => {
      vault.setFile('malformed.dash', `
this is not valid yaml: [
  unclosed bracket
`);
      
      // Should not throw, but also should not index anything
      await tracker.indexDashboard(createMockTFile('malformed.dash'));
      
      // Should handle gracefully
      expect(tracker.getDashboardsReferencing('anything.md').size).toBe(0);
    });

    it('should handle file rename when file path has special characters', async () => {
      const callback = vi.fn();
      tracker.onFileChange(callback);
      
      vault.setFile('dashboard.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: path/to/file with spaces.md
`);
      
      await tracker.indexDashboard(createMockTFile('dashboard.dash'));
      
      tracker.start();
      
      // Simulate file rename
      vault.trigger('rename', createMockTFile('path/to/renamed file.md'), 'path/to/file with spaces.md');
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(callback).toHaveBeenCalledWith('dashboard.dash', 'path/to/file with spaces.md', 'path/to/renamed file.md');
    });

    it('should handle multiple dashboards referencing the same file during rename', async () => {
      const callback = vi.fn();
      tracker.onFileChange(callback);
      
      vault.setFile('dash1.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: shared.md
`);
      vault.setFile('dash2.dash', `
version: 2
tiles:
  - id: tile-1
    x: 0
    y: 0
    width: 100
    height: 100
    meta:
      contentRef: shared.md
`);
      
      await tracker.indexAllDashboards();
      
      tracker.start();
      
      // Simulate file rename
      vault.trigger('rename', createMockTFile('renamed-shared.md'), 'shared.md');
      
      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Callback should be called for each dashboard
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith('dash1.dash', 'shared.md', 'renamed-shared.md');
      expect(callback).toHaveBeenCalledWith('dash2.dash', 'shared.md', 'renamed-shared.md');
    });
  });
});

