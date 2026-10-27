import mongoose from "mongoose";

export interface TransactionOptions {
  /**
   * If true, requires replica-set transactions and throws if transactions are not supported.
   * In production (process.env.NODE_ENV === 'production'), this defaults to TRUE for financial mutations.
   */
  requireTransactions?: boolean;
}

/**
 * Executes a callback within a MongoDB multi-document ACID transaction when supported.
 * 
 * Production Safety Invariant:
 * In production (NODE_ENV === 'production'), financial operations strictly require a replica set.
 * Silent fallback to non-atomic execution is strictly blocked to prevent double-entry ledger imbalance.
 * 
 * Non-production (dev / test environments without replica sets):
 * Gracefully logs an explicit warning and executes without transactions only when requireTransactions is false.
 */
export async function executeInTransaction<T>(
  fn: (session: mongoose.ClientSession | null) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  const isProd = process.env.NODE_ENV === "production";
  const strictlyRequire = options?.requireTransactions ?? isProd;

  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } catch (error: unknown) {
    const errObj = error as { message?: string; code?: number; codeName?: string } | null;
    const isUnsupportedError =
      errObj?.message?.includes("replica set") ||
      errObj?.message?.includes("Transactions are not supported") ||
      errObj?.code === 20 ||
      errObj?.codeName === "IllegalOperation";

    if (isUnsupportedError) {
      if (strictlyRequire) {
        throw new Error(
          "Database transaction error: MongoDB replica set is required for atomic financial operations in production. " +
          "Silent non-atomic fallback is blocked to prevent financial ledger imbalance."
        );
      }
      console.warn(
        "[WARN] MongoDB replica set not available. Executing without transaction atomicity. " +
        "(Permitted strictly in development / non-production test mode)."
      );
      return await fn(null);
    }
    // Re-throw genuine aborts / write conflicts / validation errors
    throw error;
  } finally {
    if (session) {
      await session.endSession().catch(() => {});
    }
  }
}
