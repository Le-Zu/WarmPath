import { AsyncLocalStorage } from 'async_hooks';

export const storage = new AsyncLocalStorage<{ userId: string }>();

export function getUserId(): string | undefined {
  return storage.getStore()?.userId;
}
