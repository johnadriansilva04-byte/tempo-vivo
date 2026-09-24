// Sistema de Backup Local Criptografado 100% Local
// Web Crypto API + LocalStorage (sem dependências externas)

type BackupData = {
  version: string;
  timestamp: number;
  data: any;
  checksum: string;
};

type BackupInfo = {
  id: string;
  timestamp: number;
  size: number;
  encrypted: boolean;
  checksum: string;
};

class EncryptedBackup {
  private readonly STORAGE_KEY = 'perfil-vivo:backups';
  private readonly BACKUP_VERSION = '1.0';

  // Generate encryption key from password
  private async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('perfil-vivo-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt data
  private async encrypt(data: any, password: string): Promise<string> {
    const key = await this.deriveKey(password);
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const dataStr = JSON.stringify(data);
    const dataBytes = encoder.encode(dataStr);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBytes
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  }

  // Decrypt data
  private async decrypt(encryptedStr: string, password: string): Promise<any> {
    try {
      const key = await this.deriveKey(password);
      const combined = Uint8Array.from(atob(encryptedStr), c => c.charCodeAt(0));
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const dataStr = decoder.decode(decrypted);
      return JSON.parse(dataStr);
    } catch (e) {
      throw new Error('Decryption failed. Invalid password or corrupted data.');
    }
  }

  // Generate checksum
  private async generateChecksum(data: any): Promise<string> {
    const dataStr = JSON.stringify(data);
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataStr));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verify checksum
  private async verifyChecksum(data: any, checksum: string): Promise<boolean> {
    const computed = await this.generateChecksum(data);
    return computed === checksum;
  }

  // Create backup
  async createBackup(data: any, password: string, encrypted: boolean = true): Promise<string> {
    const checksum = await this.generateChecksum(data);
    
    const backupData: BackupData = {
      version: this.BACKUP_VERSION,
      timestamp: Date.now(),
      data,
      checksum,
    };

    let backupStr: string;
    if (encrypted) {
      backupStr = await this.encrypt(backupData, password);
    } else {
      backupStr = JSON.stringify(backupData);
    }

    const backupId = crypto.randomUUID();
    const backupInfo: BackupInfo = {
      id: backupId,
      timestamp: Date.now(),
      size: backupStr.length,
      encrypted,
      checksum,
    };

    this.saveBackup(backupId, backupStr, backupInfo);
    return backupId;
  }

  // Restore backup
  async restoreBackup(backupId: string, password: string): Promise<any> {
    const backupStr = this.getBackup(backupId);
    if (!backupStr) {
      throw new Error('Backup not found');
    }

    const backupInfo = this.getBackupInfo(backupId);
    if (!backupInfo) {
      throw new Error('Backup info not found');
    }

    let backupData: BackupData;
    if (backupInfo.encrypted) {
      backupData = await this.decrypt(backupStr, password);
    } else {
      backupData = JSON.parse(backupStr);
    }

    // Verify checksum
    const valid = await this.verifyChecksum(backupData.data, backupData.checksum);
    if (!valid) {
      throw new Error('Backup checksum verification failed');
    }

    return backupData.data;
  }

  // List all backups
  listBackups(): BackupInfo[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const backups = JSON.parse(stored);
      return Object.values(backups).sort((a: any, b: any) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error('Error listing backups:', e);
      return [];
    }
  }

  // Delete backup
  deleteBackup(backupId: string): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const backups = JSON.parse(stored);
      delete backups[backupId];
      delete backups[`${backupId}:info`];
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
    } catch (e) {
      console.error('Error deleting backup:', e);
    }
  }

  // Export backup to file
  async exportBackup(backupId: string, password: string): Promise<Blob> {
    const backupStr = this.getBackup(backupId);
    if (!backupStr) {
      throw new Error('Backup not found');
    }

    const backupInfo = this.getBackupInfo(backupId);
    const exportData = {
      ...backupInfo,
      data: backupStr,
    };

    const dataStr = JSON.stringify(exportData);
    return new Blob([dataStr], { type: 'application/json' });
  }

  // Import backup from file
  async importBackup(file: File, password: string): Promise<string> {
    const dataStr = await file.text();
    const importData = JSON.parse(dataStr);

    if (!importData.data || !importData.id) {
      throw new Error('Invalid backup file format');
    }

    this.saveBackup(importData.id, importData.data, importData);
    return importData.id;
  }

  // Private methods
  private saveBackup(id: string, data: string, info: BackupInfo): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const backups = stored ? JSON.parse(stored) : {};
      
      backups[id] = data;
      backups[`${id}:info`] = info;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
    } catch (e) {
      console.error('Error saving backup:', e);
      throw new Error('Failed to save backup');
    }
  }

  private getBackup(id: string): string | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const backups = JSON.parse(stored);
      return backups[id] || null;
    } catch (e) {
      console.error('Error getting backup:', e);
      return null;
    }
  }

  private getBackupInfo(id: string): BackupInfo | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const backups = JSON.parse(stored);
      return backups[`${id}:info`] || null;
    } catch (e) {
      console.error('Error getting backup info:', e);
      return null;
    }
  }

  // Backup size info
  getTotalBackupSize(): number {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return 0;
      
      const backups = JSON.parse(stored);
      let totalSize = 0;
      
      Object.keys(backups).forEach(key => {
        if (!key.endsWith(':info')) {
          totalSize += (backups[key] as string).length;
        }
      });
      
      return totalSize;
    } catch (e) {
      console.error('Error calculating backup size:', e);
      return 0;
    }
  }

  // Clean old backups (keep last 5)
  cleanOldBackups(): void {
    const backups = this.listBackups();
    if (backups.length <= 5) return;

    const toDelete = backups.slice(5);
    toDelete.forEach(backup => {
      this.deleteBackup(backup.id);
    });
  }
}

// Singleton instance
export const encryptedBackup = new EncryptedBackup();

export type { BackupData, BackupInfo };