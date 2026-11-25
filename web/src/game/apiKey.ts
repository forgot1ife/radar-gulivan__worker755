// The player's own API key. It stays in page memory unless they choose to remember it on this
// device (localStorage). It is sent only to this game's server when a shift starts.
import type { Provider } from '../api/types';

const KEY = 'w755-own-key';

export interface SavedKey {
  provider: Provider;
  apiKey: string;
}

/** Preselected for a player with no saved key. Runware sponsors the free shifts. */
export const DEFAULT_PROVIDER: Provider = 'runware';

export function loadKey(): SavedKey | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<SavedKey> | null;
    const providers: Provider[] = ['openrouter', 'gateway', 'anthropic', 'openai', 'deepseek', 'google', 'vertex', 'runware'];
    if (v && v.provider && providers.includes(v.provider) && typeof v.apiKey === 'string' && v.apiKey) {
      return { provider: v.provider, apiKey: v.apiKey };
    }
  } catch {
    /* storage unavailable or malformed */
  }
  return null;
}

export function saveKey(key: SavedKey | null) {
  try {
    if (key) localStorage.setItem(KEY, JSON.stringify(key));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

const PICKS = 'w755-picks';

/** The manager and director models the player last chose, kept for their next shift. */
export interface Picks {
  model?: string;
  director?: string;
  /** Their rewrite of what the manager is told about them; unset for the default. */
  stance?: string;
  persona?: string;
}

export function loadPicks(): Picks {
  try {
    const v = JSON.parse(localStorage.getItem(PICKS) ?? 'null') as Picks | null;
    return {
      model: typeof v?.model === 'string' ? v.model : undefined,
      director: typeof v?.director === 'string' ? v.director : undefined,
      stance: typeof v?.stance === 'string' ? v.stance : undefined,
      persona: typeof v?.persona === 'string' ? v.persona : undefined,
    };
  } catch {
    return {};
  }
}

export function savePicks(picks: Picks) {
  try {
    localStorage.setItem(PICKS, JSON.stringify(picks));
  } catch {
    /* storage unavailable */
  }
}
