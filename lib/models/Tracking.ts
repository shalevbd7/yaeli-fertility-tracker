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
  // Added for pregnancy medications. No defaults, so fertility medications
  // are stored exactly as before.
  schedule: String,
  weekdays: { type: [Number], default: undefined },
});

const PregnancyTestSchema = new mongoose.Schema({
  id: { type: String, required: true },
  standardKey: String,
  name: String,
  date: String,
  location: String,
  done: Boolean,
  notes: String,
});

const SymptomLogSchema = new mongoose.Schema({
  id: { type: String, required: true },
  symptomKey: String,
  date: String,
  note: String,
});

const AsNeededLogSchema = new mongoose.Schema({
  id: { type: String, required: true },
  medId: String,
  at: Date,
});

const PregnancySchema = new mongoose.Schema(
  {
    lmpDate: String,
    startedAt: Date,
    tests: [PregnancyTestSchema],
    symptomLog: [SymptomLogSchema],
    medications: [MedicationSchema],
    doseLog: { type: Map, of: String, default: {} },
    asNeededLog: [AsNeededLogSchema],
  },
  { _id: false }
);

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
    // Added for pregnancy mode. Existing documents have none of these:
    // missing mode = 'fertility'. Switching to pregnancy never moves or
    // deletes the fertility fields above; they are only hidden in the UI.
    mode: { type: String, enum: ['fertility', 'pregnancy'] },
    fertilityArchivedAt: { type: Date },
    pregnancy: { type: PregnancySchema, default: undefined },
  },
  { timestamps: true }
);

export const Tracker =
  mongoose.models.Tracker || mongoose.model('Tracker', UserCycleTrackerSchema);

export type TrackerDocument = mongoose.InferSchemaType<typeof UserCycleTrackerSchema>;
