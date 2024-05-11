import mongoose from 'mongoose';

export const liveContestSchema = new mongoose.Schema(
  {
    alias: String,
    name: String,
    contest: Object,
    problems: Array,
    members: Array,
    markers: Array,
    series: Array,
    sorter: Object,
    contributors: Array,
  },
  {
    timestamps: true,
    minimize: false,
  },
);

liveContestSchema.index({ alias: 1 }, { unique: true });
liveContestSchema.index({ name: 'text' });

export const LiveContestModel = mongoose.model('LiveContest', liveContestSchema);
