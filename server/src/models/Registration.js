import mongoose from 'mongoose';
import { MAX_TICKETS_PER_REGISTRATION } from '../constants.js';

const { Schema } = mongoose;

const registrationSchema = new Schema(
  {
    ticketCode: { type: String, required: true, unique: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    tickets: { type: Number, min: 1, max: MAX_TICKETS_PER_REGISTRATION, default: 1 },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed', index: true },
    cancelledAt: Date,
  },
  { timestamps: true },
);

// One active registration per email per event — enforced by the database, not just the UI.
registrationSchema.index(
  { event: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' }, name: 'one_active_registration_per_email' },
);

export const Registration = mongoose.models.Registration ?? mongoose.model('Registration', registrationSchema);
