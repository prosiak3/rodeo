import { supabase } from './supabase';
import packageJson from '../../package.json';

export interface AppVersion {
  version: string;
  build_number: number;
  release_date: string;
  changelog: ChangelogSection[];
  is_critical: boolean;
  assets_hash: string;
}

export interface ChangelogSection {
  category: string;
  items: string[];
}

export interface UpdateCheckResult {
  has_update: boolean;
  latest_version: string;
  build_number: number;
  release_date: string;
  changelog: ChangelogSection[];
  is_critical: boolean;
  assets_hash: string;
}

export interface UpdatePreferences {
  auto_update_enabled: boolean;
  periodic_check_enabled: boolean;
  postponed_version: string | null;
  postponed_until: string | null;
  postpone_count: number;
  last_check_at: string | null;
}

export interface UpdateLog {
  from_version: string | null;
  to_version: string;
  update_type: 'auto_on_startup' | 'periodic_auto' | 'user_accepted' | 'forced';
  update_status: 'started' | 'downloading' | 'installing' | 'completed' | 'failed';
  postponed_count: number;
  device_info: string;
  connection_type: string;
  error_message?: string;
}

const CURRENT_VERSION = packageJson.version;
const CURRENT_BUILD = packageJson.buildNumber;
const LOCAL_VERSION_KEY = 'rodeo_app_version';
const LOCAL_BUILD_KEY = 'rodeo_app_build';

export class VersionManager {
  static getCurrentVersion(): string {
    return CURRENT_VERSION;
  }

  static getCurrentBuild(): number {
    return CURRENT_BUILD;
  }

  static getStoredVersion(): string | null {
    return localStorage.getItem(LOCAL_VERSION_KEY);
  }

  static getStoredBuild(): number | null {
    const build = localStorage.getItem(LOCAL_BUILD_KEY);
    return build ? parseInt(build, 10) : null;
  }

  static setStoredVersion(version: string, build: number): void {
    localStorage.setItem(LOCAL_VERSION_KEY, version);
    localStorage.setItem(LOCAL_BUILD_KEY, build.toString());
  }

  static async checkForUpdates(): Promise<UpdateCheckResult | null> {
    try {
      const { data, error } = await supabase.rpc('check_for_updates', {
        current_version: CURRENT_VERSION,
        current_build: CURRENT_BUILD,
      });

      if (error) {
        console.error('[VersionManager] Error checking for updates:', error);
        return null;
      }

      if (data && data.length > 0) {
        return data[0] as UpdateCheckResult;
      }

      return null;
    } catch (error) {
      console.error('[VersionManager] Failed to check for updates:', error);
      return null;
    }
  }

  static async getLatestVersion(): Promise<AppVersion | null> {
    try {
      const { data, error } = await supabase.rpc('get_latest_version');

      if (error) {
        console.error('[VersionManager] Error getting latest version:', error);
        return null;
      }

      if (data && data.length > 0) {
        return data[0] as AppVersion;
      }

      return null;
    } catch (error) {
      console.error('[VersionManager] Failed to get latest version:', error);
      return null;
    }
  }

  static async getUserPreferences(userId: string): Promise<UpdatePreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_update_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[VersionManager] Error getting user preferences:', error);
        return null;
      }

      if (!data) {
        return await this.createDefaultPreferences(userId);
      }

      return {
        auto_update_enabled: data.auto_update_enabled,
        periodic_check_enabled: data.periodic_check_enabled,
        postponed_version: data.postponed_version,
        postponed_until: data.postponed_until,
        postpone_count: data.postpone_count,
        last_check_at: data.last_check_at,
      };
    } catch (error) {
      console.error('[VersionManager] Failed to get user preferences:', error);
      return null;
    }
  }

  static async createDefaultPreferences(userId: string): Promise<UpdatePreferences> {
    const defaultPrefs: UpdatePreferences = {
      auto_update_enabled: true,
      periodic_check_enabled: true,
      postponed_version: null,
      postponed_until: null,
      postpone_count: 0,
      last_check_at: null,
    };

    try {
      await supabase.from('user_update_preferences').insert({
        user_id: userId,
        ...defaultPrefs,
      });
    } catch (error) {
      console.error('[VersionManager] Failed to create default preferences:', error);
    }

    return defaultPrefs;
  }

  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UpdatePreferences>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_update_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[VersionManager] Error updating preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[VersionManager] Failed to update preferences:', error);
      return false;
    }
  }

  static async postponeUpdate(userId: string, version: string, duration: number): Promise<boolean> {
    const postponedUntil = new Date(Date.now() + duration);

    try {
      const prefs = await this.getUserPreferences(userId);
      const newPostponeCount = (prefs?.postpone_count || 0) + 1;

      const { error } = await supabase
        .from('user_update_preferences')
        .update({
          postponed_version: version,
          postponed_until: postponedUntil.toISOString(),
          postpone_count: newPostponeCount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[VersionManager] Error postponing update:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[VersionManager] Failed to postpone update:', error);
      return false;
    }
  }

  static async logUpdate(userId: string, updateLog: UpdateLog): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_update_logs').insert({
        user_id: userId,
        ...updateLog,
      });

      if (error) {
        console.error('[VersionManager] Error logging update:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[VersionManager] Failed to log update:', error);
      return false;
    }
  }

  static async updateLogStatus(
    userId: string,
    toVersion: string,
    status: UpdateLog['update_status'],
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        update_status: status,
      };

      if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('user_update_logs')
        .update(updateData)
        .eq('user_id', userId)
        .eq('to_version', toVersion)
        .eq('update_status', 'started')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[VersionManager] Error updating log status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[VersionManager] Failed to update log status:', error);
      return false;
    }
  }

  static getDeviceInfo(): string {
    return navigator.userAgent;
  }

  static getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  static isSlowConnection(): boolean {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const effectiveType = connection?.effectiveType;
    return effectiveType === 'slow-2g' || effectiveType === '2g';
  }

  static shouldForceUpdate(postponeCount: number, isCritical: boolean): boolean {
    return isCritical || postponeCount >= 3;
  }

  static isPostponeExpired(postponedUntil: string | null): boolean {
    if (!postponedUntil) return true;
    return new Date(postponedUntil) <= new Date();
  }

  static async getUpdateHistory(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('user_update_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[VersionManager] Error getting update history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[VersionManager] Failed to get update history:', error);
      return [];
    }
  }

  static compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  static updateLastCheckTime(userId: string): void {
    supabase
      .from('user_update_preferences')
      .update({
        last_check_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) {
          console.error('[VersionManager] Error updating last check time:', error);
        }
      });
  }
}
