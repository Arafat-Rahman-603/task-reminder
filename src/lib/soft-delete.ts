import mongoose from "mongoose";

/**
 * Shared Mongoose schema plugin for 7-day soft-delete lifecycle.
 * Automatically adds soft-delete fields and transparent query filtering.
 */
export function applySoftDeleteMiddleware(schema: mongoose.Schema) {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    purgeAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletionBatchId: { type: String, default: null, index: true },
    originalState: { type: mongoose.Schema.Types.Mixed, default: null },
  });

  // Query methods that accept document filters and mutations.
  // Note: estimatedDocumentCount is deliberately omitted because Mongoose metadata counts do not accept document filters.
  const queryMethods = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findByIdAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'countDocuments',
    'distinct',
    'updateOne',
    'updateMany',
    'replaceOne',
  ];
  
  queryMethods.forEach((method) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema.pre(method as any, function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options = (this as any).getOptions?.() || (this as any).options || {};
      if (!options.includeDeleted) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conditions = (this as any)._conditions || (this as any).getQuery?.() || {};
        
        // If an untrusted query attempts to bypass soft-delete filtering by passing
        // isDeleted: true or an object (e.g. { $in: [true, false] }) without options.includeDeleted,
        // sanitize it to strictly enforce non-deleted items only.
        if (conditions.isDeleted !== undefined && conditions.isDeleted !== false && conditions.isDeleted?.$ne !== true) {
          conditions.isDeleted = { $ne: true };
        } else if (conditions.isDeleted === undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any).where({ isDeleted: { $ne: true } });
        }
      }
    });
  });

  // Automatically filter out soft-deleted records from Aggregation pipelines
  schema.pre('aggregate', function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = (this as any).options || {};
    if (!options.includeDeleted) {
      const pipeline = this.pipeline();
      if (pipeline.length === 0) {
        pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstStage = pipeline[0] as Record<string, any>;

      // If the first stage is already a $match specifying isDeleted, preserve it
      if (firstStage.$match && firstStage.$match.isDeleted !== undefined) {
        return;
      }

      // Stages that must strictly be the first stage in a MongoDB aggregation pipeline:
      const mustBeFirst = Boolean(
        firstStage.$search ||
        firstStage.$vectorSearch ||
        firstStage.$geoNear ||
        firstStage.$indexStats ||
        firstStage.$collStats
      );

      if (mustBeFirst) {
        // Insert $match immediately after the mandatory first stage
        pipeline.splice(1, 0, { $match: { isDeleted: { $ne: true } } });
      } else {
        pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
      }
    }
  });
}
