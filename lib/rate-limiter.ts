interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private static cache = new Map<string, RateLimitEntry>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  static {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.resetTime) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  static isRateLimited(
    identifier: string,
    maxRequests: number = 10,
    windowMs: number = 60 * 1000 // 1 minute
  ): { isLimited: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const entry = this.cache.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      this.cache.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { isLimited: false, remaining: maxRequests - 1 };
    }

    if (entry.count >= maxRequests) {
      return { 
        isLimited: true, 
        resetTime: entry.resetTime,
        remaining: 0 
      };
    }

    // Increment count
    entry.count++;
    return { 
      isLimited: false, 
      remaining: maxRequests - entry.count 
    };
  }

  static getRemainingRequests(identifier: string, maxRequests: number = 10): number {
    const entry = this.cache.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - entry.count);
  }

  static cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}