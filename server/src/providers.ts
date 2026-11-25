// Where model calls go. The hosted game uses the server's Vercel AI Gateway key; a player can bring
// their own key for the gateway or for OpenRouter. Someone running the game themselves can point
// LOCAL_LLM_URL at a model server of their own (Ollama, llama.cpp, vLLM). A player's key lives only in that session's
// memory: it is never logged, stored, or sent back to the browser.

import { randomUUID } from 'node:crypto';
import { createGateway } from 'ai';
import type { LanguageModel } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export type ProviderId = 'gateway' | 'openrouter' | 'anthropic' | 'openai' | 'deepseek' | 'google' | 'vertex' | 'runware' | 'local';

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  keyUrl: string;
  /** False for a local server, which takes no key from the player. */
  needsKey?: boolean;
  /** 'claude-code': the local server is Claude Code on the operator's own sign-in (tools/claude-bridge.mjs). */
  kind?: 'claude-code';
}

export const PROVIDERS: ProviderInfo[] = [
  { id: 'openrouter', label: 'OpenRouter', keyUrl: 'https://openrouter.ai/settings/keys' },
  { id: 'gateway', label: 'Vercel AI Gateway', keyUrl: 'https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys' },
  { id: 'anthropic', label: 'Anthropic', keyUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai', label: 'OpenAI', keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'deepseek', label: 'DeepSeek', keyUrl: 'https://platform.deepseek.com/api_keys' },
  { id: 'google', label: 'Google', keyUrl: 'https://aistudio.google.com/apikey' },
  { id: 'vertex', label: 'Vertex AI', keyUrl: 'https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview' },
  { id: 'runware', label: 'Runware', keyUrl: 'https://runware.ai/api-keys' },
];

/**
 * Models offered when the player's key goes straight to a vendor. Ids stay in the gateway's
 * spelling everywhere in the game; `native` is what the vendor's own API calls them (checked
 * against each API's model list on 2026-11-11).
 */
export const DIRECT_MODELS: Record<'anthropic' | 'openai' | 'deepseek' | 'google' | 'vertex' | 'runware', { id: string; native: string; label: string }[]> = {
  anthropic: [
    { id: 'anthropic/claude-haiku-5.5', native: 'claude-haiku-5-5', label: 'Claude Haiku 5.5' },
    { id: 'anthropic/claude-sonnet-5.5', native: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
  ],
  openai: [
    { id: 'openai/gpt-6-luna', native: 'gpt-6-luna', label: 'GPT-6 Luna' },
    { id: 'openai/gpt-5.4-mini', native: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
  ],
  deepseek: [
    { id: 'deepseek/deepseek-v4.1-flash', native: 'deepseek-flash', label: 'DeepSeek V4.1 Flash' },
    { id: 'deepseek/deepseek-v4-pro', native: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  ],
  google: [
    { id: 'google/gemini-3.1-flash-lite', native: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
    { id: 'google/gemini-4-argon', native: 'gemini-4-argon', label: 'Gemini 4 Argon' },
    { id: 'google/gemini-4-hydrogen', native: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen' },
  ],
  vertex: [
    { id: 'google/gemini-3.1-flash-lite', native: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
    { id: 'google/gemini-3.5-flash', native: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
    { id: 'google/gemini-3.8-flash', native: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
    { id: 'google/gemini-3.1-pro-preview', native: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview' },
    { id: 'google/gemini-4-argon', native: 'gemini-4-argon', label: 'Gemini 4 Argon' },
    { id: 'google/gemini-4-hydrogen', native: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen' },
    { id: 'google/gemini-4-carbon', native: 'gemini-4-carbon', label: 'Gemini 4 Carbon' },
    { id: 'google/gemini-4-neon', native: 'gemini-4-neon', label: 'Gemini 4 Neon' },
  ],
  // Runware names models by AIR. Each of these played whole shifts there on 2026-11-24, review included.
  runware: [
    { id: 'anthropic/claude-haiku-5.5', native: 'anthropic:claude@haiku-5.5', label: 'Claude Haiku 5.5' },
    { id: 'deepseek/deepseek-v4.1-flash', native: 'deepseek:v4.1@flash', label: 'DeepSeek V4.1 Flash' },
    { id: 'zai/glm-5.3-flash', native: 'zai:glm@5.3-flash', label: 'GLM 5.3 Flash' },
    { id: 'moonshotai/kimi-k3', native: 'moonshotai:kimi@k3', label: 'Kimi K3' },
  ],
};

export function isDirect(p: ProviderId): p is 'anthropic' | 'openai' | 'deepseek' | 'google' | 'vertex' | 'runware' {
  return p === 'anthropic' || p === 'openai' || p === 'deepseek' || p === 'google' || p === 'vertex' || p === 'runware';
}

export const VERTEX_EXPRESS_BASE_URL = 'https://aiplatform.googleapis.com/v1/publishers/google';

/**
 * Vertex AI Express Mode base URL. Defaults to Google's project-less Express endpoint; when the
 * operator sets VERTEX_PROJECT (and optionally VERTEX_LOCATION, defaulting to 'global'), targets
 * that project/location so global-only publisher models can be reached with the Express API key.
 */
export function vertexBaseUrl(): string {
  const project = (process.env.VERTEX_PROJECT ?? '').trim();
  if (!project || project === '-' || !/^[A-Za-z0-9-]+$/.test(project)) return VERTEX_EXPRESS_BASE_URL;
  const loc = (process.env.VERTEX_LOCATION ?? 'global').trim() || 'global';
  if (!/^[a-z0-9-]+$/.test(loc)) return VERTEX_EXPRESS_BASE_URL;
  const host =
    loc === 'global'
      ? 'aiplatform.googleapis.com'
      : loc === 'us' || loc === 'eu'
        ? `aiplatform.${loc}.rep.googleapis.com`
        : `${loc}-aiplatform.googleapis.com`;
  return `https://${host}/v1/projects/${project}/locations/${loc}/publishers/google`;
}

/**
 * True when a player's key may run only the models offered for its provider, not any id the
 * provider knows. A Runware key serves many chat models, and only the ones listed here were
 * checked with whole shifts.
 */
export function listedOnly(p: ProviderId | undefined): boolean {
  return p === 'runware';
}

export interface Credentials {
  provider: ProviderId;
  apiKey: string;
}

/**
 * An OpenAI-compatible server the operator runs, e.g. Ollama at http://localhost:11434/v1; null
 * when unset. Only the operator sets it, so players cannot make the server call addresses of
 * their choosing.
 */
export function localUrl(): string | null {
  const url = (process.env.LOCAL_LLM_URL ?? '').trim().replace(/\/+$/, '');
  return /^https?:\/\//.test(url) ? url : null;
}

const LOCAL: ProviderInfo = {
  id: 'local',
  label: 'Local (Ollama, llama.cpp, vLLM)',
  keyUrl: 'https://github.com/gulivan/worker755#local-models',
  needsKey: false,
};

/**
 * True when the local server is Claude Code on the operator's own account. It is then for the
 * operator alone: only a player on this very machine is offered it or may use it (see http.ts).
 */
export function localIsClaudeCode(): boolean {
  return !!localUrl() && process.env.LOCAL_LLM_KIND === 'claude-code';
}

/**
 * Sent with every request to the local server. The Claude Code bridge answers only requests that say
 * the game knows it is Claude Code, so a bridge set up without LOCAL_LLM_KIND (and so without the
 * this-machine-only rule) refuses to work rather than serving everyone.
 */
export function localHeaders(): Record<string, string> {
  return localIsClaudeCode() ? { 'x-worker755-kind': 'claude-code' } : {};
}

const CLAUDE_CODE: ProviderInfo = {
  id: 'local',
  label: 'Claude Code (local)',
  keyUrl: 'https://code.claude.com/docs/en/setup',
  needsKey: false,
  kind: 'claude-code',
};

/** The providers on offer here: the local server comes first when there is one. */
export function providerList(): ProviderInfo[] {
  return localUrl() ? [localIsClaudeCode() ? CLAUDE_CODE : LOCAL, ...PROVIDERS] : PROVIDERS;
}

export function isProviderId(v: unknown): v is ProviderId {
  return typeof v === 'string' && providerList().some((p) => p.id === v);
}

/** A plausible API key: printable, no whitespace, sane length. Never echoed anywhere. */
export function isPlausibleKey(v: unknown): v is string {
  return typeof v === 'string' && v.length >= 16 && v.length <= 512 && /^[\x21-\x7e]+$/.test(v);
}

/** The server's own key, used for free shifts. */
export function hostedCredentials(): Credentials | null {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  return apiKey ? { provider: 'gateway', apiKey } : null;
}

/** Model ids follow the gateway's names; OpenRouter spells a few vendors differently. */
const OPENROUTER_VENDOR: Record<string, string> = { zai: 'z-ai' };

export function providerModelId(provider: ProviderId, id: string): string {
  if (provider === 'local') return id;
  if (isDirect(provider)) return DIRECT_MODELS[provider].find((m) => m.id === id)?.native ?? id.replace(/^[^/]+\//, '');
  if (provider !== 'openrouter') return id;
  const [vendor, ...rest] = id.split('/');
  return OPENROUTER_VENDOR[vendor] ? [OPENROUTER_VENDOR[vendor], ...rest].join('/') : id;
}

export function languageModel(cred: Credentials, id: string): LanguageModel {
  if (cred.provider === 'openrouter') {
    // OpenRouter's app attribution headers.
    const headers: Record<string, string> = { 'X-Title': 'Worker 755' };
    if (process.env.PUBLIC_URL) headers['HTTP-Referer'] = process.env.PUBLIC_URL;
    const openrouter = createOpenRouter({ apiKey: cred.apiKey, headers });
    return openrouter(providerModelId('openrouter', id));
  }
  if (cred.provider === 'local') {
    // The chat completions API: Ollama, llama.cpp and vLLM all serve it, tools included.
    // Each model made here is one conversation (a shift's manager, or its user), so a server that keeps
    // sessions, like the Claude Code bridge, never mixes two of them.
    const local = createOpenAI({
      baseURL: localUrl() ?? undefined,
      apiKey: process.env.LOCAL_LLM_API_KEY || 'local',
      headers: { ...localHeaders(), 'x-worker755-conversation': randomUUID() },
    });
    return local.chat(id);
  }
  if (cred.provider === 'anthropic') return createAnthropic({ apiKey: cred.apiKey })(providerModelId('anthropic', id));
  if (cred.provider === 'openai') return createOpenAI({ apiKey: cred.apiKey })(providerModelId('openai', id));
  if (cred.provider === 'deepseek') return createDeepSeek({ apiKey: cred.apiKey })(providerModelId('deepseek', id));
  if (cred.provider === 'google') return createGoogleGenerativeAI({ apiKey: cred.apiKey })(providerModelId('google', id));
  if (cred.provider === 'vertex') {
    return createGoogleGenerativeAI({ apiKey: cred.apiKey, baseURL: vertexBaseUrl() })(providerModelId('vertex', id));
  }
  // Runware's OpenAI-compatible chat completions; a bare createOpenAI() model would use the Responses API.
  if (cred.provider === 'runware') {
    return createOpenAI({ baseURL: 'https://api.runware.ai/v1', apiKey: cred.apiKey }).chat(providerModelId('runware', id));
  }
  return createGateway({ apiKey: cred.apiKey })(id);
}
