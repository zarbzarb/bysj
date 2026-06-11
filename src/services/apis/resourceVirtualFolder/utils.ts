import { z } from 'zod';

export const timeZ = z.string().transform((s) => new Date(s));
