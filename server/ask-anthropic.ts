/**
 * Claude (Anthropic API) as the brain of Ask PromdiPreneur. Allan chose Claude on 1 Nov 2026 ("go Claude").
 * Official SDK, server-side only. Default model: Claude Haiku 5.5 — fast and the lowest-cost current model.
 * Thinking is turned off: these are short, chat-style answers, and it keeps replies inside Netlify's ~10 s limit.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { ModelRequest, ModelResult } from './ask-core.ts';

export const DEFAULT_CLAUDE_MODEL = 'claude-haiku-5-5';
/** Claude Haiku 5.5 list prices, USD per 1M tokens (prompts up to 100K tokens). Used for the spend caps. */
export const CLAUDE_HAIKU_PRICES = { input: 0.1, output: 0.5 } as const;

const REFUSED_REPLY =
  'Sorry, I can’t help with that one. I’m here for business questions — tell me what you’re working on, or use “Talk to a Person”.';

/** Converts the shared request shape to Claude's Messages API (first message must be from the visitor). */
export function toClaudeMessages(input: ModelRequest['input']): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  let reference = '';
  for (const m of input) {
    if (m.role === 'developer') {
      reference = m.content; // attached to the next visitor message, as untrusted reference data
      continue;
    }
    if (m.role === 'user' && reference) {
      out.push({
        role: 'user',
        content: [
          { type: 'text', text: reference },
          { type: 'text', text: m.content },
        ],
      });
      reference = '';
      continue;
    }
    out.push({ role: m.role, content: m.content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

export function claudeCaller(opts: { apiKey: string; model?: string; timeoutMs?: number; fetch?: typeof fetch }) {
  const client = new Anthropic({
    apiKey: opts.apiKey,
    timeout: opts.timeoutMs ?? 9500, // Netlify sync functions stop at ~10 s
    maxRetries: 0,
    ...(opts.fetch ? { fetch: opts.fetch } : {}), // tests only
  });
  const model = opts.model || DEFAULT_CLAUDE_MODEL;
  return async (req: ModelRequest): Promise<ModelResult> => {
    const res = await client.messages.create({
      model,
      max_tokens: req.maxOutputTokens, // deliberately short answers (cost cap + speed)
      thinking: { type: 'disabled' },
      // The instructions are identical on every request, so Claude can reuse them from cache when long enough.
      system: [{ type: 'text', text: req.instructions, cache_control: { type: 'ephemeral' } }],
      messages: toClaudeMessages(req.input),
    });
    const u = res.usage;
    // Billed-equivalent input tokens: cache writes cost 1.25x, cache reads 0.1x the normal input price.
    const inputTokens =
      (u.input_tokens ?? 0) + 1.25 * (u.cache_creation_input_tokens ?? 0) + 0.1 * (u.cache_read_input_tokens ?? 0);
    if (res.stop_reason === 'refusal') {
      return { text: REFUSED_REPLY, inputTokens, outputTokens: u.output_tokens ?? 0 };
    }
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return { text, inputTokens, outputTokens: u.output_tokens ?? 0, incomplete: res.stop_reason === 'max_tokens' };
  };
}
