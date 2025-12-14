/**
 * Embedded widget - displays any file type using Obsidian's native embedRegistry.
 * 
 * This file re-exports from the refactored module structure for backwards compatibility.
 * The implementation has been split into smaller modules under embeddedWidget/:
 * 
 * - embeddedWidget/index.ts - Main widget lifecycle
 * - embeddedWidget/linkHandler.ts - Link click handling
 * - embeddedWidget/editMode.ts - Edit/preview mode toggling
 * - embeddedWidget/fitScaling.ts - Content scaling for fit mode
 * - embeddedWidget/embedRenderer.ts - Native embed rendering
 */

export { createEmbeddedLeafWidget } from './embeddedWidget';
