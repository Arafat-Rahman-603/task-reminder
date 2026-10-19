export type PlanType = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  name: string;
  price: string;
  priceNum: number;
  period: string;
  description: string;
  target: 'individual' | 'team' | 'enterprise';
  maxMembers: number;
  maxCustomSections: number;
  maxStorageBytes: number;
  features: string[];
  featureLabels: string[];
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    name: 'Starter',
    price: '$0',
    priceNum: 0,
    period: '/mo',
    description: 'Complete Manageo for individuals organizing daily life, habits, and tasks.',
    target: 'individual',
    maxMembers: 5,
    maxCustomSections: 3,
    maxStorageBytes: 100 * 1024 * 1024, // 100 MB
    features: ['basic_tasks', 'basic_notes', 'money_vault'],
    featureLabels: [
      'Full Manageo (Tasks, Routines, Notes, Ideas)',
      'Personal Money & AES-256 Encrypted Vault',
      'Up to 3 Custom Sections',
      'Up to 5 Workspace Collaborators (Early Access)',
      '100 MB Cloud Storage',
    ],
  },
  pro: {
    name: 'Professional',
    price: '$3.69',
    priceNum: 3.69,
    period: '/mo',
    description: 'Designed for team owners and power users who need advanced collaboration and custom workflows.',
    target: 'team',
    maxMembers: 10,
    maxCustomSections: 10,
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    features: ['team_collaboration', 'custom_workflows', 'priority_support'],
    featureLabels: [
      'Everything in Starter',
      'Up to 10 Custom Database Sections',
      'Up to 10 Team Members with Role Management',
      'Team Dashboards & Shared Workspaces',
      '5 GB Cloud Document & Asset Storage',
      'Priority Email Support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    priceNum: 0,
    period: '',
    description: 'High-scale workspace governance, unlimited teams, custom limits, and enterprise SLA.',
    target: 'enterprise',
    maxMembers: 99999,
    maxCustomSections: 100,
    maxStorageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    features: ['advanced_admin', 'sso', 'audit_logs', 'dedicated_sla'],
    featureLabels: [
      'Everything in Professional',
      'Up to 100 Custom Sections',
      'Unlimited Workspace Members',
      'Advanced Access Logs & Audit Trails',
      '50 GB Storage with Custom Retention',
      'Dedicated Account Management',
    ],
  },
};
