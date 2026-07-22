import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Provider registry.
 * kind:   which LangChain class to use ("openai" covers every OpenAI-compatible API)
 * base:   baseURL for OpenAI-compatible providers
 * envKey: name of the environment variable holding the API key
 */
export const PROVIDERS = {
  openai: {
    label: "OpenAI", kind: "openai", envKey: "OPENAI_API_KEY",
    models: ["gpt-5.6-terra", "gpt-5.6-luna", "gpt-5.4-mini", "gpt-4o-mini"],
  },
  anthropic: {
    label: "Anthropic", kind: "anthropic", envKey: "ANTHROPIC_API_KEY",
    models: ["claude-fable-5", "claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
  },
  google: {
    label: "Google Gemini", kind: "google", envKey: "GOOGLE_API_KEY",
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"],
  },
  mistral: {
    label: "Mistral", kind: "openai", base: "https://api.mistral.ai/v1", envKey: "MISTRAL_API_KEY",
    models: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"],
  },
  groq: {
    label: "Groq", kind: "openai", base: "https://api.groq.com/openai/v1", envKey: "GROQ_API_KEY",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  },
  together: {
    label: "Together AI", kind: "openai", base: "https://api.together.xyz/v1", envKey: "TOGETHER_API_KEY",
    models: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "Qwen/Qwen2.5-72B-Instruct-Turbo"],
  },
  fireworks: {
    label: "Fireworks AI", kind: "openai", base: "https://api.fireworks.ai/inference/v1", envKey: "FIREWORKS_API_KEY",
    models: ["accounts/fireworks/models/llama-v3p1-70b-instruct"],
  },
  deepseek: {
    label: "DeepSeek", kind: "openai", base: "https://api.deepseek.com/v1", envKey: "DEEPSEEK_API_KEY",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  xai: {
    label: "xAI (Grok)", kind: "openai", base: "https://api.x.ai/v1", envKey: "XAI_API_KEY",
    models: ["grok-3", "grok-3-mini"],
  },
  cohere: {
    label: "Cohere", kind: "openai", base: "https://api.cohere.ai/compatibility/v1", envKey: "COHERE_API_KEY",
    models: ["command-a-03-2025", "command-r-plus"],
  },
};

/** Build a LangChain chat model instance for one request. */
export function buildChat(p, { model, apiKey, temperature, maxTokens }) {
  if (p.kind === "anthropic") {
    return new ChatAnthropic({ model, apiKey, temperature, maxTokens });
  }
  if (p.kind === "google") {
    return new ChatGoogleGenerativeAI({ model, apiKey, temperature, maxOutputTokens: maxTokens });
  }
  return new ChatOpenAI({
    model, apiKey, temperature, maxTokens,
    configuration: p.base ? { baseURL: p.base } : undefined,
  });
}
