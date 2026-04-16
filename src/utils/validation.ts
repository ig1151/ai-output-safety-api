import Joi from 'joi';
const VALID_CATEGORIES = ['hallucination', 'toxicity', 'pii', 'policy_violation', 'bias', 'misinformation', 'prompt_injection'];
export const checkSchema = Joi.object({
  text: Joi.string().min(1).max(10000).required().messages({ 'any.required': 'text is required', 'string.max': 'text must be under 10,000 characters' }),
  context: Joi.string().max(2000).optional(),
  check_categories: Joi.array().items(Joi.string().valid(...VALID_CATEGORIES)).optional(),
});
export const batchSchema = Joi.object({
  checks: Joi.array().items(checkSchema).min(1).max(20).required().messages({ 'array.max': 'Batch accepts a maximum of 20 checks per request' }),
});
