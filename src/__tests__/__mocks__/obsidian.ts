/**
 * Mock implementations for Obsidian API
 * Used in unit tests where Obsidian is not available
 */

export class TFile {
  path: string;
  basename: string;
  extension: string;
  
  constructor(path: string) {
    this.path = path;
    const parts = path.split('/');
    const filename = parts[parts.length - 1] || '';
    const dotIndex = filename.lastIndexOf('.');
    this.basename = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
    this.extension = dotIndex > 0 ? filename.slice(dotIndex + 1) : '';
  }
}

export class TFolder {
  path: string;
  name: string;
  
  constructor(path: string) {
    this.path = path;
    const parts = path.split('/');
    this.name = parts[parts.length - 1] || '';
  }
}

export class Vault {
  private files: Map<string, string> = new Map();
  
  async read(file: TFile): Promise<string> {
    return this.files.get(file.path) || '';
  }
  
  async modify(file: TFile, content: string): Promise<void> {
    this.files.set(file.path, content);
  }
  
  async create(path: string, content: string): Promise<TFile> {
    this.files.set(path, content);
    return new TFile(path);
  }
  
  getAbstractFileByPath(path: string): TFile | TFolder | null {
    if (this.files.has(path)) {
      return new TFile(path);
    }
    return null;
  }
  
  // Test helper to set file content
  _setFileContent(path: string, content: string): void {
    this.files.set(path, content);
  }
}

export class App {
  vault: Vault;
  workspace: Workspace;
  
  constructor() {
    this.vault = new Vault();
    this.workspace = new Workspace();
  }
}

export class Workspace {
  getActiveViewOfType<T>(_type: unknown): T | null {
    return null;
  }
  
  getLeavesOfType(_type: string): WorkspaceLeaf[] {
    return [];
  }
  
  getLeaf(_newLeaf?: boolean): WorkspaceLeaf {
    return new WorkspaceLeaf();
  }
  
  on(_event: string, _callback: (...args: unknown[]) => void): EventRef {
    return { id: 'mock-event' };
  }
  
  onLayoutReady(callback: () => void): void {
    callback();
  }
}

export class WorkspaceLeaf {
  view: unknown = null;
  
  async openFile(_file: TFile): Promise<void> {
    // Mock implementation
  }
}

export interface EventRef {
  id: string;
}

export class Component {
  protected registerEvent(_ref: EventRef): void {
    // Mock implementation
  }
  
  protected register(_fn: () => void): void {
    // Mock implementation
  }
}

export class Plugin extends Component {
  app: App;
  manifest: PluginManifest;
  
  constructor() {
    super();
    this.app = new App();
    this.manifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      minAppVersion: '0.15.0',
      description: 'Test plugin for unit tests',
      isDesktopOnly: false,
    };
  }
  
  async loadData(): Promise<unknown> {
    return {};
  }
  
  async saveData(_data: unknown): Promise<void> {
    // Mock implementation
  }
  
  addCommand(_command: Command): Command {
    return _command;
  }
  
  addRibbonIcon(_icon: string, _title: string, _callback: () => void): HTMLElement {
    return document.createElement('div');
  }
  
  addSettingTab(_tab: PluginSettingTab): void {
    // Mock implementation
  }
  
  registerView(_type: string, _viewCreator: (leaf: WorkspaceLeaf) => unknown): void {
    // Mock implementation
  }
  
  registerExtensions(_extensions: string[], _viewType: string): void {
    // Mock implementation
  }
  
  registerEvent(_ref: EventRef): void {
    // Mock implementation
  }
}

export interface Command {
  id: string;
  name: string;
  callback?: () => void;
  checkCallback?: (checking: boolean) => boolean;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion: string;
  description: string;
  isDesktopOnly: boolean;
  author?: string;
  authorUrl?: string;
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;
  
  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }
  
  display(): void {
    // Mock implementation
  }
  
  hide(): void {
    // Mock implementation
  }
}

export class TextFileView {
  file: TFile | null = null;
  contentEl: MockHTMLElement;
  leaf: WorkspaceLeaf;
  app: App;
  
  constructor(leaf: WorkspaceLeaf) {
    this.leaf = leaf;
    this.contentEl = new MockHTMLElement();
    this.app = new App();
  }
  
  getViewType(): string {
    return 'text';
  }
  
  getDisplayText(): string {
    return this.file?.basename ?? 'Untitled';
  }
  
  getIcon(): string {
    return 'document';
  }
  
  async onOpen(): Promise<void> {
    // Mock implementation
  }
  
  async onClose(): Promise<void> {
    // Mock implementation
  }
  
  getViewData(): string {
    return '';
  }
  
  setViewData(_data: string, _clear: boolean): void {
    // Mock implementation
  }
  
  clear(): void {
    // Mock implementation
  }
  
  requestSave(): void {
    // Mock implementation
  }
}

export class Setting {
  constructor(_containerEl: HTMLElement) {
    // Mock implementation
  }
  
  setName(_name: string): this {
    return this;
  }
  
  setDesc(_desc: string): this {
    return this;
  }
  
  addText(_callback: (text: TextComponent) => void): this {
    return this;
  }
  
  addToggle(_callback: (toggle: ToggleComponent) => void): this {
    return this;
  }
  
  addSlider(_callback: (slider: SliderComponent) => void): this {
    return this;
  }
  
  addDropdown(_callback: (dropdown: DropdownComponent) => void): this {
    return this;
  }
  
  addButton(_callback: (button: ButtonComponent) => void): this {
    return this;
  }
}

export class TextComponent {
  setValue(_value: string): this {
    return this;
  }
  
  setPlaceholder(_placeholder: string): this {
    return this;
  }
  
  onChange(_callback: (value: string) => void): this {
    return this;
  }
}

export class ToggleComponent {
  setValue(_value: boolean): this {
    return this;
  }
  
  onChange(_callback: (value: boolean) => void): this {
    return this;
  }
}

export class SliderComponent {
  setValue(_value: number): this {
    return this;
  }
  
  setLimits(_min: number, _max: number, _step: number): this {
    return this;
  }
  
  setDynamicTooltip(): this {
    return this;
  }
  
  onChange(_callback: (value: number) => void): this {
    return this;
  }
}

export class DropdownComponent {
  addOption(_value: string, _label: string): this {
    return this;
  }
  
  setValue(_value: string): this {
    return this;
  }
  
  onChange(_callback: (value: string) => void): this {
    return this;
  }
}

export class ButtonComponent {
  setButtonText(_text: string): this {
    return this;
  }
  
  setIcon(_icon: string): this {
    return this;
  }
  
  setCta(): this {
    return this;
  }
  
  onClick(_callback: () => void): this {
    return this;
  }
}

export class Modal {
  app: App;
  contentEl: MockHTMLElement;
  
  constructor(app: App) {
    this.app = app;
    this.contentEl = new MockHTMLElement();
  }
  
  open(): void {
    // Mock implementation
  }
  
  close(): void {
    // Mock implementation
  }
  
  onOpen(): void {
    // Mock implementation
  }
  
  onClose(): void {
    // Mock implementation
  }
}

export class Notice {
  constructor(_message: string, _timeout?: number) {
    // Mock implementation
  }
  
  hide(): void {
    // Mock implementation
  }
}

export class Menu {
  addItem(_callback: (item: MenuItem) => void): this {
    return this;
  }
  
  showAtMouseEvent(_event: MouseEvent): void {
    // Mock implementation
  }
}

export class MenuItem {
  setTitle(_title: string): this {
    return this;
  }
  
  setIcon(_icon: string): this {
    return this;
  }
  
  onClick(_callback: () => void): this {
    return this;
  }
  
  setSection(_section: string): this {
    return this;
  }
}

// Mock HTMLElement that provides Obsidian-like methods
class MockHTMLElement {
  private children: MockHTMLElement[] = [];
  private classList: Set<string> = new Set();
  innerHTML = '';
  textContent = '';
  style: Record<string, string> = {};
  
  empty(): void {
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
  }
  
  createEl(tag: string, opts?: { cls?: string; text?: string }): MockHTMLElement {
    const el = new MockHTMLElement();
    if (opts?.cls) el.addClass(opts.cls);
    if (opts?.text) el.textContent = opts.text;
    this.children.push(el);
    return el;
  }
  
  createDiv(opts?: { cls?: string; text?: string }): MockHTMLElement {
    return this.createEl('div', opts);
  }
  
  addClass(cls: string): void {
    this.classList.add(cls);
  }
  
  removeClass(cls: string): void {
    this.classList.delete(cls);
  }
  
  toggleClass(cls: string, condition: boolean): void {
    if (condition) {
      this.classList.add(cls);
    } else {
      this.classList.delete(cls);
    }
  }
  
  hasClass(cls: string): boolean {
    return this.classList.has(cls);
  }
  
  addEventListener(_event: string, _callback: (e: Event) => void): void {
    // Mock implementation
  }
  
  removeEventListener(_event: string, _callback: (e: Event) => void): void {
    // Mock implementation
  }
  
  querySelector(_selector: string): MockHTMLElement | null {
    return null;
  }
  
  querySelectorAll(_selector: string): MockHTMLElement[] {
    return [];
  }
  
  closest(_selector: string): MockHTMLElement | null {
    return null;
  }
  
  appendChild(_child: unknown): void {
    // Mock implementation
  }
  
  insertBefore(_newChild: unknown, _refChild: unknown): void {
    // Mock implementation
  }
  
  remove(): void {
    // Mock implementation
  }
}

