import mongoose from 'mongoose';

const StageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: String,
  relativeStartDay: Number,
  durationDays: Number,
  type: String,
  description: String,
  medicationId: String,
  color: String,
});

const MedicationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: String,
  dosage: String,
  timesPerDay: Number,
  hours: [String],
  durationDays: Number,
  isContinuous: Boolean,
  notes: String,
  color: String,
});

const UserCycleTrackerSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    hasActiveCycle: { type: Boolean, default: false },
    cycleStartDate: { type: Date },
    stages: [StageSchema],
    medications: [MedicationSchema],
    completedTasks: {
      type: Map,
      of: String,
      default: {},
    },
    // Added for partner linking: User._id strings of linked partners.
    // No default, so existing documents are not changed until a partner is approved.
    memberUserIds: { type: [String], default: undefined, index: true },
  },
  { timestamps: true }
);

export const Tracker =
  mongoose.models.Tracker || mongoose.model('Tracker', UserCycleTrackerSchema);

export type TrackerDocument = mongoose.InferSchemaType<typeof UserCycleTrackerSchema>;
