import mongoose from 'mongoose';
import { CATEGORIES, EVENT_MODES } from '../constants.js';

const { Schema } = mongoose;

const venueSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    lat: Number,
    lng: Number,
  },
  { _id: false },
);

const agendaItemSchema = new Schema({ time: String, title: String, description: String }, { _id: false });
const personSchema = new Schema({ name: String, role: String }, { _id: false });
const faqSchema = new Schema({ question: String, answer: String }, { _id: false });

const eventSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    tagline: { type: String, trim: true, maxlength: 200 },
    description: { type: String, required: true },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    tags: { type: [String], default: [] },
    image: { type: String, required: true },
    gallery: { type: [String], default: [] },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    mode: { type: String, enum: EVENT_MODES, default: 'in-person' },
    venue: { type: venueSchema, required: true },
    price: { type: Number, default: 0, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    registeredCount: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false, index: true },
    organizer: {
      name: { type: String, trim: true },
      verified: { type: Boolean, default: false },
    },
    highlights: { type: [String], default: [] },
    agenda: { type: [agendaItemSchema], default: [] },
    speakers: { type: [personSchema], default: [] },
    faqs: { type: [faqSchema], default: [] },
  },
  { timestamps: true },
);

eventSchema.index({ category: 1, startDate: 1 });

export const Event = mongoose.models.Event ?? mongoose.model('Event', eventSchema);

/** Shape an event document for API responses (works for lean objects and documents). */
export function toEventDTO(doc, { full = false } = {}) {
  if (!doc) return null;
  const e = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const now = Date.now();
  const seatsLeft = Math.max(0, e.capacity - e.registeredCount);
  const status =
    new Date(e.endDate).getTime() < now
      ? 'ended'
      : new Date(e.startDate).getTime() <= now
        ? 'live'
        : seatsLeft === 0
          ? 'sold-out'
          : 'upcoming';

  const base = {
    id: String(e._id),
    slug: e.slug,
    title: e.title,
    tagline: e.tagline,
    category: e.category,
    tags: e.tags,
    image: e.image,
    startDate: e.startDate,
    endDate: e.endDate,
    mode: e.mode,
    venue: e.venue,
    price: e.price,
    capacity: e.capacity,
    registeredCount: e.registeredCount,
    seatsLeft,
    featured: e.featured,
    status,
    organizer: e.organizer,
  };

  if (!full) return base;
  return {
    ...base,
    description: e.description,
    gallery: e.gallery,
    highlights: e.highlights,
    agenda: e.agenda,
    speakers: e.speakers,
    faqs: e.faqs,
  };
}
