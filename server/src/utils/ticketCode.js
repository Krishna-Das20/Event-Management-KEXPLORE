import { randomInt } from 'node:crypto';

// No 0/O, 1/I/L — codes are meant to be read aloud at the door.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const chunk = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

/** e.g. ENC-7KQ2-X9MF — ~8.5 × 10^11 combinations. */
export const generateTicketCode = () => `ENC-${chunk()}-${chunk()}`;
