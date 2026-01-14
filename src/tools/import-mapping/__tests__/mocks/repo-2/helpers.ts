// File with re-exports and side-effect style (though not actually side-effect)
import { parseCSV, parseJSON } from '@test/utils';
import type { Action } from '@test/core';

// Re-exporting for convenience
export { parseCSV, parseJSON };

export type AppAction = Action;

export const processData = (data: string, format: 'csv' | 'json') => {
  return format === 'csv' ? parseCSV(data) : parseJSON(data);
};
