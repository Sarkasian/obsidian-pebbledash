/**
 * Type declarations for internal Obsidian APIs used by this plugin.
 * 
 * These APIs are not part of the official Obsidian API and may change
 * between versions. Use with caution.
 * 
 * @see https://github.com/obsidianmd/obsidian-api for official types
 */

import type { App, TFile, Component } from 'obsidian';

/**
 * Extended App interface with internal APIs
 */
declare module 'obsidian' {
  interface App {
    /**
     * Registry for embed factories by file extension.
     * 
     * @internal This is not part of the official API
     */
    embedRegistry?: EmbedRegistry;
  }

  interface Vault {
    /**
     * Internal vault configuration.
     * 
     * @internal This is not part of the official API
     */
    config?: VaultConfig;
  }
}

/**
 * Embed registry for creating embedded content views
 */
export interface EmbedRegistry {
  /**
   * Map of file extensions to embed factory functions
   */
  embedByExtension?: Record<string, EmbedFactory>;
}

/**
 * Factory function for creating embedded content
 */
export type EmbedFactory = (
  info: EmbedInfo,
  file: TFile,
  subpath: string
) => EmbedComponent;

/**
 * Information passed to embed factories
 */
export interface EmbedInfo {
  /** The app instance */
  app: App;
  /** Source path of the embedding file */
  sourcePath: string;
  /** The container element */
  containerEl: HTMLElement;
  /** Whether to show the title */
  showTitle?: boolean;
  /** Depth of embedding (for nested embeds) */
  depth?: number;
  /** Display mode (inline, block, etc.) */
  displayMode?: string;
  /** The linking element (if any) */
  linktext?: string;
}

/**
 * Component returned by embed factories
 */
export interface EmbedComponent extends Component {
  /** The file being embedded */
  file?: TFile;
  /** The container element */
  containerEl: HTMLElement;
  /** Load the embed content */
  loadFile?(file: TFile, subpath?: string): Promise<void>;
}

/**
 * Internal vault configuration
 */
export interface VaultConfig {
  /** Path to the attachments folder */
  attachmentFolderPath?: string;
  /** Other config options (extend as needed) */
  [key: string]: unknown;
}

