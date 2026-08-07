// One place for talking to Claude. Seven views had grown their own copy of the
// same fetch, each with its own spelling of the headers and its own idea of what
// an error message looks like. New callers use this; the older ones still carry
// their copies and can move over when they are next touched.

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const API_KEY_STORAGE = 'nvc.apiKey';

export function loadApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function saveApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

// Resolves to the reply text. Throws with a message meant to be shown as-is:
// the field it lands in is the only place the user hears about a failure.
export async function askClaude(apiKey, prompt, options) {
  const opts = options || {};
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: opts.model || MODEL,
      max_tokens: opts.maxTokens || 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err.error && err.error.message) || `Fehler ${res.status}`);
  }
  const data = await res.json();
  const first = data && data.content && data.content[0];
  return (first && first.text) || '';
}

// Models are asked for one item per line, but they still number them, bullet
// them, or wrap them in quotes often enough that stripping it here is cheaper
// than fighting it in every prompt.
export function parseLines(text, limit) {
  return String(text || '')
    .split('\n')
    .map(s => s.trim())
    .map(s => s.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, ''))
    .map(s => s.replace(/^[„"'](.*)["“']$/, '$1').trim())
    .filter(s => s.length > 0)
    .slice(0, limit || 5);
}
