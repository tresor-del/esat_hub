import { Preferences } from '@capacitor/preferences';

const CACHE_KEY = 'esathub_query_cache';

export const capacitorPersister = {
  persistClient: async (client) => {
    await Preferences.set({
      key: CACHE_KEY,
      value: JSON.stringify(client),
    });
  },
  restoreClient: async () => {
    const { value } = await Preferences.get({ key: CACHE_KEY });
    if (!value) return undefined;
    return JSON.parse(value);
  },
  removeClient: async () => {
    await Preferences.remove({ key: CACHE_KEY });
  },
};