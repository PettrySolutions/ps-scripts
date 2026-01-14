// @test/core exports

export const createStore = () => {};
export const useStore = () => {};

export interface StoreConfig {
  persist?: boolean;
  devtools?: boolean;
}

// Types used by repos
export interface Config {
  apiUrl: string;
  timeout: number;
}

export interface Settings {
  theme: 'light' | 'dark';
  language: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export type Action<T = any> = {
  type: string;
  payload?: T;
};

export default class Store {}

// Unused exports for testing
export const deprecatedInit = () => {};
export const oldReducer = () => {};
