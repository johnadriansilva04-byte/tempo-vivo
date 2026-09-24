// Sistema de Keyboard Shortcuts 100% Local
// Sem dependências externas

type ShortcutAction = 
  | 'save'
  | 'new_log'
  | 'search'
  | 'toggle_theme'
  | 'go_dashboard'
  | 'go_agenda'
  | 'go_analytics'
  | 'go_settings'
  | 'undo'
  | 'redo'
  | 'focus_search'
  | 'navigate_next'
  | 'navigate_prev'
  | 'quick_add_task'
  | 'toggle_sidebar'
  | 'export_data'
  | 'custom';

type ShortcutConfig = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: 'navigation' | 'actions' | 'editing' | 'system' | 'custom';
};

type ShortcutBinding = {
  action: ShortcutAction;
  config: ShortcutConfig;
  enabled: boolean;
  global: boolean;
};

const DEFAULT_SHORTCUTS: Record<ShortcutAction, ShortcutConfig> = {
  save: {
    key: 's',
    ctrl: true,
    description: 'Salvar',
    category: 'actions',
  },
  new_log: {
    key: 'n',
    ctrl: true,
    shift: true,
    description: 'Novo registro',
    category: 'actions',
  },
  search: {
    key: 'k',
    ctrl: true,
    description: 'Buscar',
    category: 'system',
  },
  toggle_theme: {
    key: 'd',
    ctrl: true,
    shift: true,
    description: 'Alternar tema',
    category: 'system',
  },
  go_dashboard: {
    key: 'g',
    ctrl: true,
    description: 'Ir para Dashboard',
    category: 'navigation',
  },
  go_agenda: {
    key: 'a',
    ctrl: true,
    description: 'Ir para Agenda',
    category: 'navigation',
  },
  go_analytics: {
    key: 'i',
    ctrl: true,
    description: 'Ir para Analytics',
    category: 'navigation',
  },
  go_settings: {
    key: ',',
    ctrl: true,
    description: 'Ir para Configurações',
    category: 'navigation',
  },
  undo: {
    key: 'z',
    ctrl: true,
    description: 'Desfazer',
    category: 'editing',
  },
  redo: {
    key: 'z',
    ctrl: true,
    shift: true,
    description: 'Refazer',
    category: 'editing',
  },
  focus_search: {
    key: '/',
    description: 'Focar busca',
    category: 'system',
  },
  navigate_next: {
    key: 'Tab',
    description: 'Próximo item',
    category: 'navigation',
  },
  navigate_prev: {
    key: 'Tab',
    shift: true,
    description: 'Item anterior',
    category: 'navigation',
  },
  quick_add_task: {
    key: 'q',
    ctrl: true,
    description: 'Adicionar tarefa rápida',
    category: 'actions',
  },
  toggle_sidebar: {
    key: 'b',
    ctrl: true,
    description: 'Alternar sidebar',
    category: 'system',
  },
  export_data: {
    key: 'e',
    ctrl: true,
    shift: true,
    description: 'Exportar dados',
    category: 'actions',
  },
  custom: {
    key: '',
    description: 'Customizado',
    category: 'custom',
  },
};

class KeyboardShortcutManager {
  private bindings: Map<ShortcutAction, ShortcutBinding> = new Map();
  private callbacks: Map<ShortcutAction, () => void> = new Map();
  private readonly STORAGE_KEY = 'perfil-vivo:shortcuts';

  constructor() {
    this.loadShortcuts();
    this.setupEventListeners();
  }

  private loadShortcuts() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const customBindings = JSON.parse(stored);
        Object.entries(customBindings).forEach(([action, binding]) => {
          this.bindings.set(action as ShortcutAction, binding as ShortcutBinding);
        });
      }
    } catch (e) {
      console.error('Error loading shortcuts:', e);
    }

    // Initialize default bindings
    Object.entries(DEFAULT_SHORTCUTS).forEach(([action, config]) => {
      if (!this.bindings.has(action as ShortcutAction)) {
        this.bindings.set(action as ShortcutAction, {
          action: action as ShortcutAction,
          config,
          enabled: true,
          global: false,
        });
      }
    });
  }

  private saveShortcuts() {
    try {
      const bindingsObj = Object.fromEntries(this.bindings);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bindingsObj));
    } catch (e) {
      console.error('Error saving shortcuts:', e);
    }
  }

  private setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Don't trigger shortcuts in input fields unless global
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    for (const [action, binding] of this.bindings) {
      if (!binding.enabled) continue;
      if (isInput && !binding.global) continue;

      if (this.matchesShortcut(e, binding.config)) {
        e.preventDefault();
        const callback = this.callbacks.get(action);
        if (callback) {
          callback();
        }
        break;
      }
    }
  }

  private matchesShortcut(e: KeyboardEvent, config: ShortcutConfig): boolean {
    if (e.key.toLowerCase() !== config.key.toLowerCase()) return false;
    if (config.ctrl && !e.ctrlKey) return false;
    if (config.shift && !e.shiftKey) return false;
    if (config.alt && !e.altKey) return false;
    if (config.meta && !e.metaKey) return false;
    return true;
  }

  registerCallback(action: ShortcutAction, callback: () => void) {
    this.callbacks.set(action, callback);
  }

  unregisterCallback(action: ShortcutAction) {
    this.callbacks.delete(action);
  }

  bindShortcut(action: ShortcutAction, config: ShortcutConfig, global: boolean = false) {
    this.bindings.set(action, {
      action,
      config,
      enabled: true,
      global,
    });
    this.saveShortcuts();
  }

  unbindShortcut(action: ShortcutAction) {
    this.bindings.delete(action);
    this.saveShortcuts();
  }

  enableShortcut(action: ShortcutAction) {
    const binding = this.bindings.get(action);
    if (binding) {
      binding.enabled = true;
      this.saveShortcuts();
    }
  }

  disableShortcut(action: ShortcutAction) {
    const binding = this.bindings.get(action);
    if (binding) {
      binding.enabled = false;
      this.saveShortcuts();
    }
  }

  getShortcut(action: ShortcutAction): ShortcutBinding | undefined {
    return this.bindings.get(action);
  }

  getAllShortcuts(): Map<ShortcutAction, ShortcutBinding> {
    return this.bindings;
  }

  getShortcutsByCategory(category: ShortcutConfig['category']): ShortcutBinding[] {
    return Array.from(this.bindings.values()).filter(
      binding => binding.config.category === category
    );
  }

  getShortcutDisplay(config: ShortcutConfig): string {
    const parts: string[] = [];
    if (config.ctrl) parts.push('Ctrl');
    if (config.shift) parts.push('Shift');
    if (config.alt) parts.push('Alt');
    if (config.meta) parts.push('Cmd');
    parts.push(config.key.toUpperCase());
    return parts.join(' + ');
  }

  resetToDefaults() {
    this.bindings.clear();
    Object.entries(DEFAULT_SHORTCUTS).forEach(([action, config]) => {
      this.bindings.set(action as ShortcutAction, {
        action: action as ShortcutAction,
        config,
        enabled: true,
        global: false,
      });
    });
    this.saveShortcuts();
  }

  exportShortcuts(): string {
    const bindingsObj = Object.fromEntries(this.bindings);
    return JSON.stringify(bindingsObj, null, 2);
  }

  importShortcuts(json: string) {
    try {
      const bindings = JSON.parse(json);
      Object.entries(bindings).forEach(([action, binding]) => {
        this.bindings.set(action as ShortcutAction, binding as ShortcutBinding);
      });
      this.saveShortcuts();
    } catch (e) {
      throw new Error('Invalid shortcuts format');
    }
  }
}

// Singleton instance
export const keyboardShortcuts = new KeyboardShortcutManager();

// React hook for shortcuts
export function useKeyboardShortcuts() {
  return {
    register: (action: ShortcutAction, callback: () => void) => 
      keyboardShortcuts.registerCallback(action, callback),
    unregister: (action: ShortcutAction) => 
      keyboardShortcuts.unregisterCallback(action),
    bind: (action: ShortcutAction, config: ShortcutConfig, global?: boolean) => 
      keyboardShortcuts.bindShortcut(action, config, global),
    unbind: (action: ShortcutAction) => 
      keyboardShortcuts.unbindShortcut(action),
    enable: (action: ShortcutAction) => 
      keyboardShortcuts.enableShortcut(action),
    disable: (action: ShortcutAction) => 
      keyboardShortcuts.disableShortcut(action),
    get: (action: ShortcutAction) => 
      keyboardShortcuts.getShortcut(action),
    getAll: () => 
      keyboardShortcuts.getAllShortcuts(),
    getByCategory: (category: ShortcutConfig['category']) => 
      keyboardShortcuts.getShortcutsByCategory(category),
    getDisplay: (config: ShortcutConfig) => 
      keyboardShortcuts.getShortcutDisplay(config),
    reset: () => 
      keyboardShortcuts.resetToDefaults(),
    export: () => 
      keyboardShortcuts.exportShortcuts(),
    import: (json: string) => 
      keyboardShortcuts.importShortcuts(json),
  };
}

export type { ShortcutAction, ShortcutConfig, ShortcutBinding };