import mongoose from 'mongoose';
import type { Contest, Problem, Marker, RankSeries, Sorter, Contributor } from '@algoux/standard-ranklist';

export const liveContestSchema = new mongoose.Schema<{
  alias: string;
  name: string;
  contest: Contest;
  problems: Problem[];
  markers: Marker[];
  series: RankSeries[];
  sorter: Sorter;
  contributors: Contributor[];
}>(
  {
    alias: String,
    name: String,
    contest: mongoose.Schema.Types.Mixed,
    problems: [mongoose.Schema.Types.Mixed],
    markers: [mongoose.Schema.Types.Mixed],
    series: [mongoose.Schema.Types.Mixed],
    sorter: mongoose.Schema.Types.Mixed,
    contributors: [mongoose.Schema.Types.Mixed],
  },
  {
    timestamps: true,
    minimize: false,
    toJSON: {
      versionKey: false,
    },
    toObject: {
      versionKey: false,
    },
  },
);

liveContestSchema.index({ alias: 1 }, { unique: true });
liveContestSchema.index({ name: 'text' });

export const LiveContestModel = mongoose.model('LiveContest', liveContestSchema);
