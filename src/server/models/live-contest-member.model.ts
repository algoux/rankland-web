import mongoose from 'mongoose';
import type { User } from '@algoux/standard-ranklist';

export type LiveContestMember = User & {
  contestId: string;
  banned: boolean;
  broadcasterToken?: string;
  index: number;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: mongoose.Types.ObjectId;
};

export const liveContestMemberSchema = new mongoose.Schema<LiveContestMember>(
  {
    // relation
    contestId: {
      type: String,
      required: true,
    },

    // srk User fields
    id: String,
    name: mongoose.Schema.Types.Mixed,
    avatar: mongoose.Schema.Types.Mixed,
    photo: mongoose.Schema.Types.Mixed,
    organization: mongoose.Schema.Types.Mixed,
    location: String,
    teamMembers: [mongoose.Schema.Types.Mixed],
    markers: [String],
    official: {
      type: Boolean,
      default: true,
      get: (v) => (v === null || v === undefined ? true : v),
    },

    // private extension fields
    index: {
      type: Number,
      required: true,
    },
    banned: {
      type: Boolean,
      default: false,
      get: (v) => (v === null || v === undefined ? false : v),
    },
    broadcasterToken: String,
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

liveContestMemberSchema.index({ contestId: 1 });
liveContestMemberSchema.index({ contestId: 1, id: 1 }, { unique: true });
liveContestMemberSchema.index({ contestId: 1, markers: 1 });
liveContestMemberSchema.index({ contestId: 1, official: 1 });
liveContestMemberSchema.index({ contestId: 1, name: 1 });
liveContestMemberSchema.index({ contestId: 1, organization: 1 });
liveContestMemberSchema.index({ contestId: 1, 'teamMembers.name': 1 });
liveContestMemberSchema.index({ contestId: 1, index: 1 });
liveContestMemberSchema.index({ contestId: 1, banned: 1 });

export const LiveContestMemberModel = mongoose.model<LiveContestMember>('LiveContestMember', liveContestMemberSchema);
