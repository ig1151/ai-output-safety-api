import { Router, Request, Response } from 'express';
import { config } from '../utils/config';
export const openapiRouter = Router();
export const docsRouter = Router();

const docsHtml = `<!DOCTYPE html>
<html>
<head>
  <title>AI Output Safety API — Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
    h1 { font-size: 1.8rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1.2rem; margin-top: 2rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px; }
    .post { background: #e8f5e9; color: #2e7d32; }
    .endpoint { background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .path { font-family: monospace; font-size: 1rem; font-weight: bold; }
    .desc { color: #666; font-size: 0.9rem; margin-top: 0.25rem; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 8px; }
    th, td { text-align: left; padding: 8px; border: 1px solid #ddd; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>AI Output Safety API</h1>
  <p>Check any AI-generated text for hallucinations, toxicity, PII, policy violations, bias, misinformation and prompt injection.</p>
  <p><strong>Base URL:</strong> <code>https://ai-output-safety-api.onrender.com</code></p>

  <h2>Quick start</h2>
  <pre>const res = await fetch("https://ai-output-safety-api.onrender.com/v1/check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: aiGeneratedText,
    context: "Customer support chatbot response"
  })
});
const { safe, decision, issues, flagged_segments } = await res.json();
if (!safe) filterOrBlockResponse(flagged_segments);
else displayToUser(aiGeneratedText);</pre>

  <h2>Endpoints</h2>
  <div class="endpoint">
    <div><span class="badge post">POST</span><span class="path">/v1/check</span></div>
    <div class="desc">Check a single AI output for safety issues</div>
    <pre>curl -X POST https://ai-output-safety-api.onrender.com/v1/check \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Your AI output here", "context": "chatbot response"}'</pre>
  </div>
  <div class="endpoint">
    <div><span class="badge post">POST</span><span class="path">/v1/check/batch</span></div>
    <div class="desc">Check up to 20 AI outputs in one request</div>
    <pre>curl -X POST https://ai-output-safety-api.onrender.com/v1/check/batch \\
  -H "Content-Type: application/json" \\
  -d '{"checks": [{"text": "output 1"}, {"text": "output 2"}]}'</pre>
  </div>

  <h2>Safety categories</h2>
  <table>
    <tr><th>Category</th><th>What it detects</th></tr>
    <tr><td>hallucination</td><td>Factually incorrect, fabricated or unverifiable claims</td></tr>
    <tr><td>toxicity</td><td>Harmful, offensive, threatening or abusive content</td></tr>
    <tr><td>pii</td><td>Personal info — names, emails, phones, SSNs, addresses</td></tr>
    <tr><td>policy_violation</td><td>Content violating AI usage policies</td></tr>
    <tr><td>bias</td><td>Discriminatory content based on race, gender, religion etc.</td></tr>
    <tr><td>misinformation</td><td>Deliberately false or misleading information</td></tr>
    <tr><td>prompt_injection</td><td>Attempts to override or manipulate AI instructions</td></tr>
  </table>

  <h2>Example response</h2>
  <pre>{
  "id": "safety_abc123",
  "safe": false,
  "decision": "unsafe",
  "confidence": 0.94,
  "issues": ["pii", "hallucination"],
  "categories": {
    "hallucination": true,
    "toxicity": false,
    "pii": true,
    "policy_violation": false,
    "bias": false,
    "misinformation": false,
    "prompt_injection": false
  },
  "flagged_segments": ["John Smith's SSN is 123-45-6789"],
  "recommendation": "Block this response — contains PII and unverifiable claims.",
  "latency_ms": 1240
}</pre>

  <h2>OpenAPI Spec</h2>
  <p><a href="/openapi.json">Download openapi.json</a></p>
</body>
</html>`;

docsRouter.get('/', (_req: Request, res: Response) => { res.setHeader('Content-Type', 'text/html'); res.send(docsHtml); });

openapiRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    openapi: '3.0.3',
    info: { title: 'AI Output Safety API', version: '1.0.0', description: 'Check AI-generated text for hallucinations, toxicity, PII, policy violations, bias, misinformation and prompt injection.' },
    servers: [{ url: 'https://ai-output-safety-api.onrender.com', description: 'Production' }, { url: `http://localhost:${config.server.port}`, description: 'Local' }],
    paths: {
      '/v1/health': { get: { summary: 'Health check', operationId: 'getHealth', responses: { '200': { description: 'OK' } } } },
      '/v1/check': {
        post: { summary: 'Check a single AI output', operationId: 'checkSafety', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckRequest' }, examples: { basic: { summary: 'Basic check', value: { text: 'The capital of France is Berlin.' } }, with_context: { summary: 'With context', value: { text: 'Here is the response...', context: 'Customer support chatbot' } } } } } }, responses: { '200': { description: 'Safety check result' }, '422': { description: 'Validation error' } } },
      },
      '/v1/check/batch': { post: { summary: 'Check up to 20 AI outputs', operationId: 'checkBatch', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BatchRequest' } } } }, responses: { '200': { description: 'Batch results' } } } },
    },
    components: {
      schemas: {
        CheckRequest: { type: 'object', required: ['text'], properties: { text: { type: 'string', maxLength: 10000 }, context: { type: 'string', maxLength: 2000 }, check_categories: { type: 'array', items: { type: 'string', enum: ['hallucination', 'toxicity', 'pii', 'policy_violation', 'bias', 'misinformation', 'prompt_injection'] } } } },
        BatchRequest: { type: 'object', required: ['checks'], properties: { checks: { type: 'array', items: { $ref: '#/components/schemas/CheckRequest' }, minItems: 1, maxItems: 20 } } },
      },
    },
  });
});
