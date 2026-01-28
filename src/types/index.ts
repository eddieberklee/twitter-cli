/**
 * Type definitions for Twitter CLI
 */

// ============================================================================
// Twitter User Types
// ============================================================================

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  verified: boolean;
  verified_type?: 'blue' | 'business' | 'government' | 'none';
  followers_count?: number;
}

// ============================================================================
// Tweet Types
// ============================================================================

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
}

export interface Tweet {
  id: string;
  text: string;
  author: TwitterUser;
  created_at: Date;
  metrics: TweetMetrics;
  url: string;
  in_reply_to_id?: string;
  conversation_id?: string;
  lang?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  fromCache: boolean;
  rateLimit?: RateLimitInfo;
}

// ============================================================================
// CLI Configuration Types
// ============================================================================

export interface Config {
  bearerToken?: string;
  cacheEnabled?: boolean;
  cacheTtlMinutes?: number;
  defaultLimit?: number;
}

export interface SearchOptions {
  query: string;
  time?: '1h' | '24h' | '7d' | '30d';
  minLikes?: number;
  minRetweets?: number;
  verified?: boolean;
  limit?: number;
  sort?: 'recent' | 'popular' | 'relevant';
  lang?: string;
}

export interface OutputOptions {
  json?: boolean;
  csv?: boolean;
  quiet?: boolean;
  noColor?: boolean;
  compact?: boolean;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
