// @test/utils parsers submodule
import { validateRequired } from './validators';

export const parseCSV = (data: string): string[][] => {
  if (!validateRequired(data)) return [];
  return data.split('\n').map(row => row.split(','));
};

export const parseJSON = <T>(data: string): T | null => {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const parseQueryString = (query: string): Record<string, string> => {
  const result: Record<string, string> = {};
  query.replace(/^\?/, '').split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) result[key] = decodeURIComponent(value || '');
  });
  return result;
};
