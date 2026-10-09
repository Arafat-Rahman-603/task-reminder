export type PlanType = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  maxMembers: number;
  maxCustomSections: number;
  maxStorageBytes: number;
  features: string[];
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxMembers: 1, // Just the owner for personal
    maxCustomSections: 2,
    maxStorageBytes: 100 * 1024 * 1024, // 100 MB
    features: ['basic_tasks', 'basic_notes']
  },
  pro: {
    maxMembers: 10,
    maxCustomSections: 10,
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    features: ['team_collaboration', 'custom_workflows']
  },
  enterprise: {
    maxMembers: 99999, // Unlimited
    maxCustomSections: 100,
    maxStorageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    features: ['advanced_admin', 'sso', 'audit_logs']
  }
};
