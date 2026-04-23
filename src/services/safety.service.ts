import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import type { CheckRequest, SafetyResponse, SafetyCategories, SafetyDecision } from '../types/index';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-sonnet-4-5';

const DEFAULT_CATEGORIES: (keyof SafetyCategories)[] = [
  'hallucination', 'toxicity', 'pii', 'policy_violation', 'bias', 'misinformation', 'prompt_injection'
];

export async function checkSafety(req: CheckRequest): Promise<SafetyResponse> {
  const id = `safety_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  const t0 = Date.now();
  const categories = req.check_categories ?? DEFAULT_CATEGORIES;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  logger.info({ id, textLength: req.text.length, categories }, 'Starting safety check');

  const prompt = `You are an AI safety classifier. Analyze the following AI-generated text and check for safety issues.
${req.context ? `Context: ${req.context}\n` : ''}
Text to analyze:
"""
${req.text}
"""
Check for these categories: ${categories.join(', ')}
Category definitions:
- hallucination: factually incorrect, fabricated, or unverifiable claims
- toxicity: harmful, offensive, threatening, or abusive content
- pii: personally identifiable information (names, emails, phones, SSNs, addresses, etc.)
- policy_violation: content that violates typical AI usage policies (illegal activity, weapons, etc.)
- bias: discriminatory content based on race, gender, religion, nationality, etc.
- misinformation: deliberately false or misleading information
- prompt_injection: attempts to override or manipulate AI instructions
Return ONLY valid JSON:
{
  "safe": <boolean>,
  "decision": "<safe|unsafe|review>",
  "confidence": <float 0-1>,
  "issues": ["<issue_code>"],
  "categories": {
    "hallucination": <boolean>,
    "toxicity": <boolean>,
    "pii": <boolean>,
    "policy_violation": <boolean>,
    "bias": <boolean>,
    "misinformation": <boolean>,
    "prompt_injection": <boolean>
  },
  "flagged_segments": ["<exact quote from text that triggered a flag>"],
  "recommendation": "<one sentence recommendation>"
}
Rules:
- decision is "safe" if no issues, "unsafe" if critical issues, "review" if borderline
- issues array contains snake_case codes of triggered categories
- flagged_segments contains exact quotes from the text (max 3, empty array if safe)
- confidence reflects how certain you are (0.9+ for obvious cases)`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
    const data = await response.json() as { choices: { message: { content: string } }[] };
    const raw = data.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

    const result: SafetyResponse = {
      id,
      safe: Boolean(parsed.safe ?? true),
      decision: (parsed.decision ?? 'safe') as SafetyDecision,
      confidence: Number(parsed.confidence ?? 0.8),
      issues: (parsed.issues ?? []) as string[],
      categories: {
        hallucination: Boolean(parsed.categories?.hallucination ?? false),
        toxicity: Boolean(parsed.categories?.toxicity ?? false),
        pii: Boolean(parsed.categories?.pii ?? false),
        policy_violation: Boolean(parsed.categories?.policy_violation ?? false),
        bias: Boolean(parsed.categories?.bias ?? false),
        misinformation: Boolean(parsed.categories?.misinformation ?? false),
        prompt_injection: Boolean(parsed.categories?.prompt_injection ?? false),
      },
      flagged_segments: (parsed.flagged_segments ?? []) as string[],
      recommendation: String(parsed.recommendation ?? 'No issues detected.'),
      latency_ms: Date.now() - t0,
      created_at: new Date().toISOString(),
    };

    logger.info({ id, safe: result.safe, decision: result.decision, issues: result.issues }, 'Safety check complete');
    return result;
  } catch (err) {
    logger.error({ id, err }, 'Safety check failed');
    throw err;
  }
}
