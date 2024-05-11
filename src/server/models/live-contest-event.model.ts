import mongoose from 'mongoose';

export const liveContestEventSchema = new mongoose.Schema(
  {
    contestId: String, // match liveContestSchema._id
    eventId: Number,
    type: Number,
    solutionId: String,
    userId: String,
    problemAlias: String,
    percentageProgress: Number,
    previousResult: Number,
    result: Number,
    timeValue: Number,
    timeUnit: Number,
  },
  {
    timestamps: true,
    minimize: false,
  },
);

liveContestEventSchema.index({ contestId: 1 });
liveContestEventSchema.index({ contestId: 1, eventId: 1 }, { unique: true });
liveContestEventSchema.index({ contestId: 1, type: 1 });
liveContestEventSchema.index({ contestId: 1, solutionId: 1 });
liveContestEventSchema.index({ contestId: 1, userId: 1 });
liveContestEventSchema.index({ contestId: 1, problemAlias: 1 });

export const LiveContestEventModel = mongoose.model('LiveContestEvent', liveContestEventSchema);
