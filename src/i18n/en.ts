/**
 * English language strings for Pebbledash plugin.
 * 
 * This file contains all user-facing strings used throughout the plugin.
 * To add support for another language, create a new file (e.g., `de.ts`)
 * with the same structure and export it from `index.ts`.
 * 
 * String organization:
 * - commands: Plugin commands shown in command palette
 * - notices: Toast notifications
 * - settings: Settings tab labels and descriptions
 * - modals: Modal dialog content
 * - toolbar: Edit toolbar buttons and labels
 * - contextMenu: Right-click context menu items
 * - widgets: Widget-specific labels
 * - errors: Error messages
 */

export const en = {
  // Plugin metadata
  plugin: {
    name: 'Pebbledash Dashboards',
    description: 'Create and manage tiled dashboards in Obsidian',
  },

  // Command palette commands
  commands: {
    createDashboard: 'Create new dashboard',
    toggleEditMode: 'Toggle dashboard edit mode',
    insertMode: 'Dashboard: Insert mode',
    resizeMode: 'Dashboard: Resize mode',
  },

  // Toast notifications (Notice)
  notices: {
    dashboardSaved: 'Dashboard saved',
    changesDiscarded: 'Changes discarded',
    dashboardSettingsSaved: 'Dashboard settings saved',
    tileSettingsSaved: 'Tile settings saved',
    failedToSave: 'Failed to save dashboard',
    failedToCreate: 'Failed to create dashboard',
    failedToImport: 'Failed to import file',
    imported: 'Imported',
    fileAlreadyExists: 'File already exists',
    savedAs: 'Saved as',
    failedToCreateEditor: 'Failed to create editor - opening in new tab',
  },

  // Settings tab
  settings: {
    // Section headings
    sections: {
      layout: 'Layout constraints',
      borders: 'Borders',
      behavior: 'Behavior',
      animation: 'Animation',
      advanced: 'Advanced',
    },

    // Layout settings
    minTileWidth: {
      name: 'Minimum tile width',
      desc: 'Minimum width for tiles (percentage)',
    },
    minTileHeight: {
      name: 'Minimum tile height',
      desc: 'Minimum height for tiles (percentage)',
    },
    maxTileWidth: {
      name: 'Maximum tile width',
      desc: 'Maximum width for tiles (percentage, 0 = unlimited)',
    },
    maxTileHeight: {
      name: 'Maximum tile height',
      desc: 'Maximum height for tiles (percentage, 0 = unlimited)',
    },
    gutter: {
      name: 'Gutter',
      desc: 'Gap between tiles (pixels)',
    },

    // Border settings
    borderWidth: {
      name: 'Border width',
      desc: 'Tile border width (pixels)',
    },
    borderStyle: {
      name: 'Border style',
      desc: 'CSS border style',
    },
    borderColor: {
      name: 'Border color',
      desc: 'Tile border color (CSS color value)',
    },

    // Behavior settings
    showHeaders: {
      name: 'Show tile headers',
      desc: 'Display header bar on tiles',
    },
    showEmbedLink: {
      name: 'Show embed link button',
      desc: 'Show button to open embedded content',
    },
    scrollBehavior: {
      name: 'Content overflow',
      desc: 'How to handle content that exceeds tile bounds',
      options: {
        scroll: 'Scroll',
        hidden: 'Hidden',
        visible: 'Visible',
        fit: 'Fit to tile',
      },
    },
    linkBehavior: {
      name: 'Link behavior',
      desc: 'What happens when clicking links in embedded content',
      options: {
        obsidian: 'Open in Obsidian (default)',
        external: 'Open in browser',
        sameTile: 'Navigate in same tile',
      },
    },
    interactionMode: {
      name: 'Content interaction',
      desc: 'How embedded content responds to interaction',
      options: {
        normal: 'Normal (full interaction)',
        viewOnly: 'View only (no editing)',
        passthrough: 'Passthrough (click through)',
      },
    },

    // Animation settings
    animationEnabled: {
      name: 'Enable animations',
      desc: 'Animate tile transitions',
    },
    animationDuration: {
      name: 'Animation duration',
      desc: 'Duration of animations (milliseconds)',
    },

    // Advanced settings
    seamlessNested: {
      name: 'Seamless nested dashboards',
      desc: 'Remove borders from nested dashboards',
    },
    redistributeEqually: {
      name: 'Redistribute equally',
      desc: 'Distribute space equally when resizing with Shift key',
    },
  },

  // Modal dialogs
  modals: {
    // Dashboard settings modal
    dashboardSettings: {
      title: 'Dashboard settings',
      cssClass: {
        name: 'CSS class',
        desc: 'Custom CSS class for this dashboard',
      },
    },

    // Tile settings modal
    tileSettings: {
      title: 'Tile settings',
      widgetType: {
        name: 'Widget type',
        desc: 'Type of content to display',
      },
      contentRef: {
        name: 'Content reference',
        desc: 'Path to embedded file',
      },
      background: {
        name: 'Background',
        desc: 'Tile background color (CSS color)',
      },
      padding: {
        name: 'Padding',
        desc: 'Inner padding (pixels)',
      },
      lockedEdges: {
        name: 'Locked edges',
        desc: 'Prevent resizing on specific edges',
      },
      seamlessNested: {
        name: 'Seamless nested dashboard',
        desc: 'Remove borders for nested dashboards',
      },
    },

    // Save as modal
    saveAs: {
      title: 'Save dashboard as',
      location: {
        name: 'Location',
        desc: 'Folder to save in',
      },
      filename: {
        name: 'Filename',
        desc: 'Name for the dashboard file',
      },
    },

    // File picker modal
    filePicker: {
      placeholder: 'Search for a file...',
      noResults: 'No files found',
    },

    // Confirm modal
    confirm: {
      title: 'Confirm',
      ok: 'OK',
      cancel: 'Cancel',
    },
  },

  // Edit toolbar
  toolbar: {
    viewMode: 'View',
    editMode: 'Edit',
    insertMode: 'Insert',
    resizeMode: 'Resize',
    undo: 'Undo',
    redo: 'Redo',
    settings: 'Settings',
    saveAs: 'Save as',
    discard: 'Discard',
  },

  // Context menu
  contextMenu: {
    setContent: 'Set content',
    tileSettings: 'Tile settings',
    delete: 'Delete tile',
    insertAbove: 'Insert above',
    insertBelow: 'Insert below',
    insertLeft: 'Insert left',
    insertRight: 'Insert right',
  },

  // Widget labels
  widgets: {
    empty: {
      label: 'Empty tile',
      hint: 'Click to add content',
    },
    embedded: {
      openInNewTab: 'Open in new tab',
      openInSamePane: 'Open in same pane',
      cannotEmbed: 'Cannot embed this file type',
    },
  },

  // Error messages
  errors: {
    invalidDashboard: 'Invalid dashboard file',
    loadFailed: 'Failed to load dashboard',
    saveFailed: 'Failed to save dashboard',
    tileNotFound: 'Tile not found',
    unknownError: 'Unknown error',
  },

  // Accessibility labels
  a11y: {
    dashboard: 'Dashboard',
    tile: 'Tile',
    resizeHandle: 'Resize handle',
    editToolbar: 'Edit toolbar',
  },
} as const;

export type Translations = typeof en;

