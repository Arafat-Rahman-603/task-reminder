export interface SafeCredentialInfo {
  credentialId: string;
  deviceName?: string;
  enrolledAt?: string | Date;
}

function toPlainObject(val: unknown): Record<string, unknown> {
  if (!val) return {};
  if (val instanceof Map) {
    return Object.fromEntries(val.entries());
  }
  if (typeof (val as { toObject?: () => unknown }).toObject === "function") {
    const obj = (val as { toObject: () => unknown }).toObject();
    return obj && typeof obj === "object" ? (obj as Record<string, unknown>) : {};
  }
  if (typeof (val as { get?: (k: string) => unknown }).get === "function") {
    try {
      return Object.fromEntries(val as Iterable<[string, unknown]>);
    } catch {
      return {};
    }
  }
  return typeof val === "object" ? { ...(val as Record<string, unknown>) } : {};
}

export function sanitizePreferencesForClient(rawPrefs: unknown): Record<string, unknown> {
  const prefs = toPlainObject(rawPrefs);
  const result: Record<string, unknown> = { ...prefs };

  if (prefs.modules !== undefined) {
    result.modules = toPlainObject(prefs.modules);
  }

  if (prefs.vaultSettings !== undefined) {
    const vs = toPlainObject(prefs.vaultSettings);
    const hasHash = Boolean(vs.vaultPasswordHash);
    delete vs.vaultPasswordHash;
    result.vaultSettings = {
      ...vs,
      isInitialized: Boolean(vs.isInitialized || hasHash),
    };
  }

  if (prefs.sectionSecurity !== undefined) {
    const ss = toPlainObject(prefs.sectionSecurity);
    const hasHash = Boolean(ss.passwordHash);
    delete ss.passwordHash;
    if (ss.sectionConfigs !== undefined) {
      ss.sectionConfigs = toPlainObject(ss.sectionConfigs);
    }
    result.sectionSecurity = {
      ...ss,
      isInitialized: Boolean(ss.isInitialized || hasHash),
    };
  }

  if (prefs.appLockSettings !== undefined) {
    const al = toPlainObject(prefs.appLockSettings);
    const hasCustomPin = Boolean(al.appLockPinHash);
    delete al.appLockPinHash;
    result.appLockSettings = {
      ...al,
      hasCustomPin,
    };
  }

  if (prefs.biometricSettings !== undefined) {
    const bio = toPlainObject(prefs.biometricSettings);
    const rawCreds = Array.isArray(bio.credentials) ? bio.credentials : [];
    const safeCredentials: SafeCredentialInfo[] = rawCreds
      .map((c) => {
        const item = toPlainObject(c);
        return {
          credentialId: String(item.credentialId || ""),
          deviceName: item.deviceName ? String(item.deviceName) : "Registered Device",
          enrolledAt: item.enrolledAt as string | Date | undefined,
        };
      })
      .filter((c) => Boolean(c.credentialId));

    const isEnrolled = Boolean(
      safeCredentials.length > 0 || (bio.publicKey && bio.credentialId)
    );

    delete bio.publicKey;
    delete bio.credentialId;
    delete bio.counter;
    delete bio.transports;

    result.biometricSettings = {
      ...bio,
      credentials: safeCredentials,
      isEnrolled,
    };
  }

  return JSON.parse(JSON.stringify(result));
}

export function sanitizeUserForClient(rawUser: unknown): Record<string, unknown> | null {
  if (!rawUser || typeof rawUser !== "object") return null;
  const userObj = toPlainObject(rawUser);
  delete userObj.passwordHash;

  if (userObj.preferences !== undefined) {
    userObj.preferences = sanitizePreferencesForClient(userObj.preferences);
  }

  return JSON.parse(JSON.stringify(userObj));
}
