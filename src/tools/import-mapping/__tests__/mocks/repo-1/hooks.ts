// File with default and named imports combined
import Store, { useStore, createStore } from '@test/core';
import { deepClone } from '@test/utils';

export const useAppStore = () => {
  const store = useStore();
  return deepClone(store);
};

export const initStore = () => {
  return createStore();
};

export { Store };
