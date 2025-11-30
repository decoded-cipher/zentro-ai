
import { nanoid } from 'nanoid';


// Get current Unix timestamp (seconds since epoch)
export const getUnixTimestamp = () => Math.floor(Date.now() / 1000);

/**
 * Adds default id, createdAt, and updatedAt fields to a record
 * @param data - The data object to add defaults to
 * @returns Data object with id, createdAt, and updatedAt added
 */
export function withDefaults<T extends Record<string, any>>(
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): T & { id: string; createdAt: number; updatedAt: number } {
  const now = getUnixTimestamp();
  return {
    ...data,
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
  } as T & { id: string; createdAt: number; updatedAt: number };
}
