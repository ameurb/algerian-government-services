import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  models: AIModel[];
  requiresApiKey: boolean;
  supported: boolean;
  icon: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  costPer1kTokens: number;
  capabilities: string[];
  recommended: boolean;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Advanced language models from OpenAI including GPT-4 and GPT-3.5',
    requiresApiKey: true,
    supported: true,
    icon: '🤖',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most advanced model with excellent reasoning and multilingual support',
        maxTokens: 128000,
        costPer1kTokens: 0.005,
        capabilities: ['text', 'reasoning', 'multilingual', 'code'],
        recommended: true
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and efficient model, great for most tasks',
        maxTokens: 128000,
        costPer1kTokens: 0.0015,
        capabilities: ['text', 'reasoning', 'multilingual'],
        recommended: true
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Reliable and cost-effective model',
        maxTokens: 16385,
        costPer1kTokens: 0.001,
        capabilities: ['text', 'multilingual'],
        recommended: false
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models known for helpful, harmless, and honest responses',
    requiresApiKey: true,
    supported: true,
    icon: '🔮',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Most capable Claude model with excellent reasoning',
        maxTokens: 200000,
        costPer1kTokens: 0.003,
        capabilities: ['text', 'reasoning', 'multilingual', 'analysis'],
        recommended: true
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fast and efficient Claude model',
        maxTokens: 200000,
        costPer1kTokens: 0.0008,
        capabilities: ['text', 'multilingual'],
        recommended: true
      }
    ]
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini models with strong multilingual capabilities',
    requiresApiKey: true,
    supported: true,
    icon: '🌟',
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Advanced model with large context window',
        maxTokens: 2000000,
        costPer1kTokens: 0.0035,
        capabilities: ['text', 'reasoning', 'multilingual', 'large-context'],
        recommended: true
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast model optimized for speed',
        maxTokens: 1000000,
        costPer1kTokens: 0.001,
        capabilities: ['text', 'multilingual', 'fast'],
        recommended: true
      }
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Open and efficient language models',
    requiresApiKey: true,
    supported: true,
    icon: '🌪️',
    models: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        description: 'Most capable Mistral model',
        maxTokens: 128000,
        costPer1kTokens: 0.004,
        capabilities: ['text', 'reasoning', 'multilingual'],
        recommended: true
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        description: 'Efficient model for most tasks',
        maxTokens: 128000,
        costPer1kTokens: 0.001,
        capabilities: ['text', 'multilingual'],
        recommended: false
      }
    ]
  }
];

export class AIProviderManager {
  private static instance: AIProviderManager;
  private currentProvider: string = 'openai';
  private currentModel: string = 'gpt-4o-mini';

  static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  getCurrentProvider(): string {
    return this.currentProvider;
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  setProvider(providerId: string, modelId: string): boolean {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (!provider) return false;

    const model = provider.models.find(m => m.id === modelId);
    if (!model) return false;

    this.currentProvider = providerId;
    this.currentModel = modelId;
    return true;
  }

  getModel() {
    switch (this.currentProvider) {
      case 'openai':
        return openai(this.currentModel);
      case 'anthropic':
        return anthropic(this.currentModel);
      case 'google':
        return google(this.currentModel);
      case 'mistral':
        return mistral(this.currentModel);
      default:
        return openai('gpt-4o-mini'); // fallback
    }
  }

  getAvailableProviders(): AIProvider[] {
    return AI_PROVIDERS.map(provider => ({
      ...provider,
      supported: this.checkProviderSupport(provider.id)
    }));
  }

  private checkProviderSupport(providerId: string): boolean {
    switch (providerId) {
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      case 'anthropic':
        return !!process.env.ANTHROPIC_API_KEY;
      case 'google':
        return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      case 'mistral':
        return !!process.env.MISTRAL_API_KEY;
      default:
        return false;
    }
  }

  getProviderConfig() {
    const provider = AI_PROVIDERS.find(p => p.id === this.currentProvider);
    const model = provider?.models.find(m => m.id === this.currentModel);
    
    return {
      provider: provider?.name || 'Unknown',
      model: model?.name || 'Unknown',
      maxTokens: model?.maxTokens || 4000,
      capabilities: model?.capabilities || [],
      supported: this.checkProviderSupport(this.currentProvider)
    };
  }
}

export const aiProviderManager = AIProviderManager.getInstance();