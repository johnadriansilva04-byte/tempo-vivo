// Sistema de Automações Rule-Based 100% Local
// Sem dependências externas

type AutomationTrigger = 
  | 'time_based'
  | 'event_based'
  | 'condition_based'
  | 'schedule';

type AutomationAction = 
  | 'send_notification'
  | 'create_task'
  | 'update_field'
  | 'send_email'
  | 'run_webhook'
  | 'calculate_metric'
  | 'backup_data'
  | 'custom';

type AutomationCondition = {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
};

type Automation = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  triggerConfig: any;
  conditions: AutomationCondition[];
  actions: Array<{
    type: AutomationAction;
    config: any;
  }>;
  createdAt: number;
  lastRun?: number;
  runCount: number;
};

type AutomationContext = {
  eventType?: string;
  data?: any;
  timestamp: number;
  userId?: string;
};

class AutomationSystem {
  private automations: Map<string, Automation> = new Map();
  private readonly STORAGE_KEY = 'perfil-vivo:automations';

  constructor() {
    this.loadAutomations();
    this.setupDefaultAutomations();
  }

  private loadAutomations() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const automationsObj = JSON.parse(stored);
        Object.entries(automationsObj).forEach(([id, automation]) => {
          this.automations.set(id, automation as Automation);
        });
      }
    } catch (e) {
      console.error('Error loading automations:', e);
    }
  }

  private saveAutomations() {
    try {
      const automationsObj = Object.fromEntries(this.automations);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(automationsObj));
    } catch (e) {
      console.error('Error saving automations:', e);
    }
  }

  private setupDefaultAutomations() {
    // Default automation: Daily summary reminder
    if (!this.automations.has('daily_reminder')) {
      this.createAutomation({
        id: 'daily_reminder',
        name: 'Lembrete Diário',
        description: 'Envia notificação para registrar o dia',
        enabled: true,
        trigger: 'time_based',
        triggerConfig: { time: '20:00' },
        conditions: [],
        actions: [
          {
            type: 'send_notification',
            config: { message: 'Não esqueça de registrar seu dia!' },
          },
        ],
        createdAt: Date.now(),
        runCount: 0,
      });
    }

    // Default automation: Streak celebration
    if (!this.automations.has('streak_celebration')) {
      this.createAutomation({
        id: 'streak_celebration',
        name: 'Celebração de Streak',
        description: 'Celebra milestones de streak',
        enabled: true,
        trigger: 'event_based',
        triggerConfig: { event: 'streak_milestone' },
        conditions: [
          { field: 'streak', operator: 'greater_than', value: 7 },
        ],
        actions: [
          {
            type: 'send_notification',
            config: { message: 'Parabéns! Você alcançou um novo milestone!' },
          },
        ],
        createdAt: Date.now(),
        runCount: 0,
      });
    }

    // Default automation: Weekly backup
    if (!this.automations.has('weekly_backup')) {
      this.createAutomation({
        id: 'weekly_backup',
        name: 'Backup Semanal',
        description: 'Backup automático semanal',
        enabled: true,
        trigger: 'schedule',
        triggerConfig: { interval: 'weekly', day: 0 }, // Sunday
        conditions: [],
        actions: [
          {
            type: 'backup_data',
            config: { encrypted: true },
          },
        ],
        createdAt: Date.now(),
        runCount: 0,
      });
    }
  }

  createAutomation(automation: Automation): void {
    this.automations.set(automation.id, automation);
    this.saveAutomations();
  }

  updateAutomation(id: string, updates: Partial<Automation>): void {
    const automation = this.automations.get(id);
    if (automation) {
      this.automations.set(id, { ...automation, ...updates });
      this.saveAutomations();
    }
  }

  deleteAutomation(id: string): void {
    this.automations.delete(id);
    this.saveAutomations();
  }

  getAutomation(id: string): Automation | undefined {
    return this.automations.get(id);
  }

  getAllAutomations(): Automation[] {
    return Array.from(this.automations.values());
  }

  getEnabledAutomations(): Automation[] {
    return this.getAllAutomations().filter(a => a.enabled);
  }

  enableAutomation(id: string): void {
    this.updateAutomation(id, { enabled: true });
  }

  disableAutomation(id: string): void {
    this.updateAutomation(id, { enabled: false });
  }

  // Check and run automations based on context
  async triggerAutomations(context: AutomationContext): Promise<void> {
    const automations = this.getEnabledAutomations();

    for (const automation of automations) {
      if (this.shouldRunAutomation(automation, context)) {
        await this.runAutomation(automation, context);
      }
    }
  }

  private shouldRunAutomation(automation: Automation, context: AutomationContext): boolean {
    // Check trigger type
    if (automation.trigger === 'event_based') {
      if (automation.triggerConfig.event !== context.eventType) {
        return false;
      }
    }

    // Check conditions
    if (automation.conditions.length > 0) {
      for (const condition of automation.conditions) {
        if (!this.evaluateCondition(condition, context.data)) {
          return false;
        }
      }
    }

    return true;
  }

  private evaluateCondition(condition: AutomationCondition, data: any): boolean {
    const fieldValue = this.getFieldValue(data, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value));
      default:
        return false;
    }
  }

  private getFieldValue(data: any, field: string): any {
    const keys = field.split('.');
    let value = data;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    return value;
  }

  private async runAutomation(automation: Automation, context: AutomationContext): Promise<void> {
    try {
      // Execute all actions
      for (const action of automation.actions) {
        await this.executeAction(action, context);
      }

      // Update run stats
      this.updateAutomation(automation.id, {
        lastRun: Date.now(),
        runCount: automation.runCount + 1,
      });
    } catch (e) {
      console.error(`Error running automation ${automation.id}:`, e);
    }
  }

  private async executeAction(action: any, context: AutomationContext): Promise<void> {
    switch (action.type) {
      case 'send_notification':
        this.sendNotification(action.config.message);
        break;
      case 'create_task':
        this.createTask(action.config);
        break;
      case 'update_field':
        this.updateField(action.config);
        break;
      case 'backup_data':
        await this.backupData(action.config);
        break;
      case 'calculate_metric':
        this.calculateMetric(action.config);
        break;
      default:
        console.log(`Unknown action type: ${action.type}`);
    }
  }

  private sendNotification(message: string): void {
    // Use browser notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Perfil Vivo', { body: message });
    } else {
      console.log('Notification:', message);
    }
  }

  private createTask(config: any): void {
    // Create task in local storage or send to app
    console.log('Creating task:', config);
  }

  private updateField(config: any): void {
    // Update field in local storage
    console.log('Updating field:', config);
  }

  private async backupData(config: any): Promise<void> {
    // Trigger backup
    console.log('Backing up data:', config);
  }

  private calculateMetric(config: any): void {
    // Calculate and store metric
    console.log('Calculating metric:', config);
  }

  // Schedule-based automation runner
  startScheduler(): void {
    setInterval(() => {
      this.checkScheduledAutomations();
    }, 60000); // Check every minute
  }

  private checkScheduledAutomations(): void {
    const automations = this.getEnabledAutomations();
    const now = new Date();

    automations.forEach(automation => {
      if (automation.trigger === 'schedule' || automation.trigger === 'time_based') {
        if (this.shouldRunScheduled(automation, now)) {
          this.triggerAutomations({
            timestamp: Date.now(),
          });
        }
      }
    });
  }

  private shouldRunScheduled(automation: Automation, now: Date): boolean {
    const config = automation.triggerConfig;
    
    if (config.time) {
      const [hours, minutes] = config.time.split(':').map(Number);
      return now.getHours() === hours && now.getMinutes() === minutes;
    }

    if (config.interval === 'weekly') {
      return now.getDay() === config.day && now.getHours() === 0 && now.getMinutes() === 0;
    }

    if (config.interval === 'daily') {
      return now.getHours() === config.hour && now.getMinutes() === 0;
    }

    return false;
  }

  // Export/Import
  exportAutomations(): string {
    const automationsObj = Object.fromEntries(this.automations);
    return JSON.stringify(automationsObj, null, 2);
  }

  importAutomations(json: string): void {
    try {
      const automations = JSON.parse(json);
      Object.entries(automations).forEach(([id, automation]) => {
        this.automations.set(id, automation as Automation);
      });
      this.saveAutomations();
    } catch (e) {
      throw new Error('Invalid automations format');
    }
  }
}

// Singleton instance
export const automationSystem = new AutomationSystem();

// React hook for automations
export function useAutomations() {
  return {
    create: (automation: Automation) => 
      automationSystem.createAutomation(automation),
    update: (id: string, updates: Partial<Automation>) => 
      automationSystem.updateAutomation(id, updates),
    delete: (id: string) => 
      automationSystem.deleteAutomation(id),
    get: (id: string) => 
      automationSystem.getAutomation(id),
    getAll: () => 
      automationSystem.getAllAutomations(),
    getEnabled: () => 
      automationSystem.getEnabledAutomations(),
    enable: (id: string) => 
      automationSystem.enableAutomation(id),
    disable: (id: string) => 
      automationSystem.disableAutomation(id),
    trigger: (context: AutomationContext) => 
      automationSystem.triggerAutomations(context),
    startScheduler: () => 
      automationSystem.startScheduler(),
    export: () => 
      automationSystem.exportAutomations(),
    import: (json: string) => 
      automationSystem.importAutomations(json),
  };
}

export type { Automation, AutomationTrigger, AutomationAction, AutomationCondition, AutomationContext };