import { Music2, Cpu, Palette, Trophy, UtensilsCrossed, Briefcase, Hammer, Laugh, Gamepad2 } from 'lucide-react';

export const SITE = {
  name: 'Encore',
  tagline: 'Events worth showing up for.',
  url: 'https://encore-kexplore.vercel.app',
  repo: 'https://github.com/Krishna-Das20/Event-Management-KEXPLORE',
};

export const CATEGORIES = [
  { id: 'music', label: 'Music', icon: Music2, color: '#ff4d8d', blurb: 'Gigs, festivals & club nights' },
  { id: 'tech', label: 'Tech', icon: Cpu, color: '#2fc7f0', blurb: 'Hackathons, summits & meetups' },
  { id: 'arts', label: 'Arts & Film', icon: Palette, color: '#ffa920', blurb: 'Galleries, screenings & walks' },
  { id: 'sports', label: 'Sports & Fitness', icon: Trophy, color: '#2fcf8f', blurb: 'Runs, leagues & yoga' },
  { id: 'food', label: 'Food & Drink', icon: UtensilsCrossed, color: '#ff7a45', blurb: 'Carnivals, tastings & trails' },
  { id: 'business', label: 'Business', icon: Briefcase, color: '#6e8bff', blurb: 'Founders, pitches & forums' },
  { id: 'workshop', label: 'Workshops', icon: Hammer, color: '#b57bff', blurb: 'Hands-on & skill-building' },
  { id: 'comedy', label: 'Comedy', icon: Laugh, color: '#f5c518', blurb: 'Stand-up & open mics' },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, color: '#ff5252', blurb: 'Esports, LAN & arcades' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const WHEN_OPTIONS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'past', label: 'Past' },
];

export const SORT_OPTIONS = [
  { id: 'date', label: 'Soonest first' },
  { id: 'popular', label: 'Most popular' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'newest', label: 'Recently added' },
];

export const PRICE_OPTIONS = [
  { id: 'all', label: 'Any price' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
];

export const MAX_TICKETS = 5;
