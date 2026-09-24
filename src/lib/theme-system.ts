// Sistema de Temas Customizáveis 100% Local
// CSS Variables + LocalStorage persistência

type ThemePreset = 
  | 'dark'
  | 'light'
  | 'midnight'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'aurora'
  | 'lavender'
  | 'custom';

type ColorScheme = {
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    'primary-foreground': string;
    secondary: string;
    'secondary-foreground': string;
    accent: string;
    'accent-foreground': string;
    muted: string;
    'muted-foreground': string;
    border: string;
    input: string;
    ring: string;
    card: string;
    'card-foreground': string;
    popover: string;
    'popover-foreground': string;
  };
};

const THEME_PRESETS: Record<ThemePreset, ColorScheme> = {
  dark: {
    name: 'Dark',
    colors: {
      background: '#09090b',
      foreground: '#fafafa',
      primary: '#6366f1',
      'primary-foreground': '#ffffff',
      secondary: '#27272a',
      'secondary-foreground': '#fafafa',
      accent: '#8b5cf6',
      'accent-foreground': '#ffffff',
      muted: '#27272a',
      'muted-foreground': '#a1a1aa',
      border: '#27272a',
      input: '#27272a',
      ring: '#6366f1',
      card: '#09090b',
      'card-foreground': '#fafafa',
      popover: '#09090b',
      'popover-foreground': '#fafafa',
    },
  },
  light: {
    name: 'Light',
    colors: {
      background: '#ffffff',
      foreground: '#09090b',
      primary: '#6366f1',
      'primary-foreground': '#ffffff',
      secondary: '#f4f4f5',
      'secondary-foreground': '#09090b',
      accent: '#8b5cf6',
      'accent-foreground': '#ffffff',
      muted: '#f4f4f5',
      'muted-foreground': '#71717a',
      border: '#e4e4e7',
      input: '#e4e4e7',
      ring: '#6366f1',
      card: '#ffffff',
      'card-foreground': '#09090b',
      popover: '#ffffff',
      'popover-foreground': '#09090b',
    },
  },
  midnight: {
    name: 'Midnight',
    colors: {
      background: '#0a0e27',
      foreground: '#e2e8f0',
      primary: '#3b82f6',
      'primary-foreground': '#ffffff',
      secondary: '#1e293b',
      'secondary-foreground': '#e2e8f0',
      accent: '#06b6d4',
      'accent-foreground': '#ffffff',
      muted: '#1e293b',
      'muted-foreground': '#94a3b8',
      border: '#1e293b',
      input: '#1e293b',
      ring: '#3b82f6',
      card: '#0a0e27',
      'card-foreground': '#e2e8f0',
      popover: '#0a0e27',
      'popover-foreground': '#e2e8f0',
    },
  },
  ocean: {
    name: 'Ocean',
    colors: {
      background: '#0c1929',
      foreground: '#e2e8f0',
      primary: '#0ea5e9',
      'primary-foreground': '#ffffff',
      secondary: '#164e63',
      'secondary-foreground': '#e2e8f0',
      accent: '#14b8a6',
      'accent-foreground': '#ffffff',
      muted: '#164e63',
      'muted-foreground': '#94a3b8',
      border: '#164e63',
      input: '#164e63',
      ring: '#0ea5e9',
      card: '#0c1929',
      'card-foreground': '#e2e8f0',
      popover: '#0c1929',
      'popover-foreground': '#e2e8f0',
    },
  },
  forest: {
    name: 'Forest',
    colors: {
      background: '#1a2e1a',
      foreground: '#e2e8f0',
      primary: '#22c55e',
      'primary-foreground': '#ffffff',
      secondary: '#14532d',
      'secondary-foreground': '#e2e8f0',
      accent: '#84cc16',
      'accent-foreground': '#ffffff',
      muted: '#14532d',
      'muted-foreground': '#94a3b8',
      border: '#14532d',
      input: '#14532d',
      ring: '#22c55e',
      card: '#1a2e1a',
      'card-foreground': '#e2e8f0',
      popover: '#1a2e1a',
      'popover-foreground': '#e2e8f0',
    },
  },
  sunset: {
    name: 'Sunset',
    colors: {
      background: '#2d1f1f',
      foreground: '#e2e8f0',
      primary: '#f97316',
      'primary-foreground': '#ffffff',
      secondary: '#4a2c2c',
      'secondary-foreground': '#e2e8f0',
      accent: '#eab308',
      'accent-foreground': '#ffffff',
      muted: '#4a2c2c',
      'muted-foreground': '#94a3b8',
      border: '#4a2c2c',
      input: '#4a2c2c',
      ring: '#f97316',
      card: '#2d1f1f',
      'card-foreground': '#e2e8f0',
      popover: '#2d1f1f',
      'popover-foreground': '#e2e8f0',
    },
  },
  aurora: {
    name: 'Aurora',
    colors: {
      background: '#1a1a2e',
      foreground: '#e2e8f0',
      primary: '#8b5cf6',
      'primary-foreground': '#ffffff',
      secondary: '#2d2d4a',
      'secondary-foreground': '#e2e8f0',
      accent: '#ec4899',
      'accent-foreground': '#ffffff',
      muted: '#2d2d4a',
      'muted-foreground': '#94a3b8',
      border: '#2d2d4a',
      input: '#2d2d4a',
      ring: '#8b5cf6',
      card: '#1a1a2e',
      'card-foreground': '#e2e8f0',
      popover: '#1a1a2e',
      'popover-foreground': '#e2e8f0',
    },
  },
  lavender: {
    name: 'Lavender',
    colors: {
      background: '#1f1f2e',
      foreground: '#e2e8f0',
      primary: '#a78bfa',
      'primary-foreground': '#ffffff',
      secondary: '#2d2d4a',
      'secondary-foreground': '#e2e8f0',
      accent: '#c4b5fd',
      'accent-foreground': '#ffffff',
      muted: '#2d2d4a',
      'muted-foreground': '#94a3b8',
      border: '#2d2d4a',
      input: '#2d2d4a',
      ring: '#a78bfa',
      card: '#1f1f2e',
      'card-foreground': '#e2e8f0',
      popover: '#1f1f2e',
      'popover-foreground': '#e2e8f0',
    },
  },
  custom: {
    name: 'Custom',
    colors: {
      background: '#09090b',
      foreground: '#fafafa',
      primary: '#6366f1',
      'primary-foreground': '#ffffff',
      secondary: '#27272a',
      'secondary-foreground': '#fafafa',
      accent: '#8b5cf6',
      'accent-foreground': '#ffffff',
      muted: '#27272a',
      'muted-foreground': '#a1a1aa',
      border: '#27272a',
      input: '#27272a',
      ring: '#6366f1',
      card: '#09090b',
      'card-foreground': '#fafafa',
      popover: '#09090b',
      'popover-foreground': '#fafafa',
    },
  },
};

class ThemeManager {
  private currentTheme: ThemePreset = 'dark';
  private customTheme: ColorScheme | null = null;
  private readonly STORAGE_KEY = 'perfil-vivo:theme';

  constructor() {
    this.loadTheme();
    this.applyTheme();
  }

  private loadTheme() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.currentTheme = parsed.currentTheme || 'dark';
        this.customTheme = parsed.customTheme || null;
      }
    } catch (e) {
      console.error('Error loading theme:', e);
    }
  }

  private saveTheme() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        currentTheme: this.currentTheme,
        customTheme: this.customTheme,
      }));
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  }

  private applyTheme() {
    const scheme = this.currentTheme === 'custom' && this.customTheme 
      ? this.customTheme 
      : THEME_PRESETS[this.currentTheme];

    const root = document.documentElement;
    
    Object.entries(scheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Apply dark/light class
    if (this.currentTheme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }

  setTheme(theme: ThemePreset) {
    this.currentTheme = theme;
    this.applyTheme();
    this.saveTheme();
  }

  getCurrentTheme(): ThemePreset {
    return this.currentTheme;
  }

  getThemePreset(preset: ThemePreset): ColorScheme {
    return THEME_PRESETS[preset];
  }

  getAllPresets(): Record<ThemePreset, ColorScheme> {
    return THEME_PRESETS;
  }

  setCustomTheme(customColors: Partial<ColorScheme['colors']>) {
    const baseTheme = THEME_PRESETS.dark;
    this.customTheme = {
      name: 'Custom',
      colors: {
        ...baseTheme.colors,
        ...customColors,
      },
    };
    this.currentTheme = 'custom';
    this.applyTheme();
    this.saveTheme();
  }

  getCustomTheme(): ColorScheme | null {
    return this.customTheme;
  }

  resetCustomTheme() {
    this.customTheme = null;
    this.currentTheme = 'dark';
    this.applyTheme();
    this.saveTheme();
  }

  // Theme utilities
  toggleTheme() {
    if (this.currentTheme === 'light') {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  isDark(): boolean {
    return this.currentTheme !== 'light';
  }

  isLight(): boolean {
    return this.currentTheme === 'light';
  }
}

// Singleton instance
export const themeManager = new ThemeManager();

// React hook for theme
export function useTheme() {
  return {
    theme: themeManager.getCurrentTheme(),
    setTheme: (theme: ThemePreset) => themeManager.setTheme(theme),
    toggleTheme: () => themeManager.toggleTheme(),
    isDark: themeManager.isDark(),
    isLight: themeManager.isLight(),
    presets: themeManager.getAllPresets(),
    customTheme: themeManager.getCustomTheme(),
    setCustomTheme: (colors: Partial<ColorScheme['colors']>) => 
      themeManager.setCustomTheme(colors),
    resetCustomTheme: () => themeManager.resetCustomTheme(),
  };
}

export type { ThemePreset, ColorScheme };