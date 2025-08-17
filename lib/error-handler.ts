export class ChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

export const ERROR_CODES = {
  DATABASE_CONNECTION: 'DATABASE_CONNECTION',
  OPENAI_API_ERROR: 'OPENAI_API_ERROR',
  MCP_CONNECTION: 'MCP_CONNECTION',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  RATE_LIMIT: 'RATE_LIMIT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.DATABASE_CONNECTION]: {
    en: 'Database connection failed. Please try again later.',
    ar: 'فشل الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى لاحقاً.',
  },
  [ERROR_CODES.OPENAI_API_ERROR]: {
    en: 'AI service is temporarily unavailable. Please try again.',
    ar: 'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. يرجى المحاولة مرة أخرى.',
  },
  [ERROR_CODES.MCP_CONNECTION]: {
    en: 'Service connection failed. Please try again.',
    ar: 'فشل الاتصال بالخدمة. يرجى المحاولة مرة أخرى.',
  },
  [ERROR_CODES.SESSION_EXPIRED]: {
    en: 'Your session has expired. Please refresh the page.',
    ar: 'انتهت صلاحية جلستك. يرجى تحديث الصفحة.',
  },
  [ERROR_CODES.RATE_LIMIT]: {
    en: 'Too many requests. Please wait a moment before trying again.',
    ar: 'عدد كبير جداً من الطلبات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.',
  },
  [ERROR_CODES.VALIDATION_ERROR]: {
    en: 'Invalid input. Please check your message and try again.',
    ar: 'إدخال غير صحيح. يرجى التحقق من رسالتك والمحاولة مرة أخرى.',
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    en: 'An unexpected error occurred. Please try again.',
    ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  },
} as const;

export function getErrorMessage(code: string, language: 'ar' | 'en' = 'ar'): string {
  const errorConfig = ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];
  return errorConfig ? errorConfig[language] : ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR][language];
}

export function handleError(error: unknown, context?: string): ChatError {
  console.error(`Error in ${context}:`, error);

  if (error instanceof ChatError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('prisma') || error.message.includes('database')) {
      return new ChatError(
        error.message,
        ERROR_CODES.DATABASE_CONNECTION,
        500,
        getErrorMessage(ERROR_CODES.DATABASE_CONNECTION)
      );
    }

    if (error.message.includes('openai') || error.message.includes('API key')) {
      return new ChatError(
        error.message,
        ERROR_CODES.OPENAI_API_ERROR,
        503,
        getErrorMessage(ERROR_CODES.OPENAI_API_ERROR)
      );
    }

    if (error.message.includes('session')) {
      return new ChatError(
        error.message,
        ERROR_CODES.SESSION_EXPIRED,
        401,
        getErrorMessage(ERROR_CODES.SESSION_EXPIRED)
      );
    }

    if (error.message.includes('rate limit')) {
      return new ChatError(
        error.message,
        ERROR_CODES.RATE_LIMIT,
        429,
        getErrorMessage(ERROR_CODES.RATE_LIMIT)
      );
    }
  }

  return new ChatError(
    'Unknown error occurred',
    ERROR_CODES.UNKNOWN_ERROR,
    500,
    getErrorMessage(ERROR_CODES.UNKNOWN_ERROR)
  );
}

export const fallbackResponses = {
  ar: [
    'عذراً، لم أتمكن من معالجة طلبك في الوقت الحالي. يمكنك المحاولة مرة أخرى أو التواصل مع خدمة العملاء.',
    'أواجه صعوبة في الوصول إلى المعلومات المطلوبة. يرجى تجربة صياغة سؤالك بطريقة مختلفة.',
    'خدماتنا تواجه حملاً زائداً حالياً. يرجى المحاولة مرة أخرى خلال بضع دقائق.',
  ],
  en: [
    'Sorry, I cannot process your request at the moment. Please try again or contact customer service.',
    'I\'m having difficulty accessing the required information. Please try rephrasing your question.',
    'Our services are experiencing heavy load. Please try again in a few minutes.',
  ],
};

export function getFallbackResponse(language: 'ar' | 'en' = 'ar'): string {
  const responses = fallbackResponses[language];
  return responses[Math.floor(Math.random() * responses.length)];
}