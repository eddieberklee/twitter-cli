/**
 * Twitter API client with caching
 */

import * as https from 'https';
import type { Tweet, TwitterUser, TweetMetrics, SearchOptions, ApiResponse, RateLimitInfo } from '../types/index.js';
import { getBearerToken } from './config.js';
import { getCache, setCache } from './cache.js';
import { generateMockTweets, generateMockReplies, generateMockUserTweets } from './mock-data.js';

const TWITTER_API_BASE = 'api.twitter.com';

interface RequestResult {
  data: unknown;
  headers: Record<string, string>;
}

function request(path: string, bearerToken: string): Promise<RequestResult> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TWITTER_API_BASE,
      path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'User-Agent': 'twitter-cli/1.0.0',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode && res.statusCode >= 400) {
            const errorMessage = data.errors?.[0]?.message || data.detail || `API error (${res.statusCode})`;
            reject(new Error(errorMessage));
            return;
          }
          resolve({ data, headers: res.headers as Record<string, string> });
        } catch {
          reject(new Error('Failed to parse API response'));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Network error: ${err.message}`)));
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

function parseRateLimits(headers: Record<string, string>): RateLimitInfo | undefined {
  const remaining = headers['x-rate-limit-remaining'];
  const limit = headers['x-rate-limit-limit'];
  const reset = headers['x-rate-limit-reset'];
  if (remaining && limit && reset) {
    return {
      remaining: parseInt(remaining, 10),
      limit: parseInt(limit, 10),
      resetAt: new Date(parseInt(reset, 10) * 1000),
    };
  }
  return undefined;
}

function getStartTime(time?: string): string | undefined {
  if (!time) return undefined;
  const now = Date.now();
  const hoursMap: Record<string, number> = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
  const h = hoursMap[time];
  if (!h) return undefined;
  return new Date(now - h * 60 * 60 * 1000).toISOString();
}

function parseTweet(tweetData: Record<string, unknown>, userData: Record<string, unknown>): Tweet {
  const metrics = tweetData.public_metrics as Record<string, number> | undefined;
  const userMetrics = userData.public_metrics as Record<string, number> | undefined;

  const author: TwitterUser = {
    id: userData.id as string,
    username: userData.username as string,
    name: userData.name as string,
    verified: (userData.verified as boolean) || false,
    followers_count: userMetrics?.followers_count || 0,
  };

  const tweetMetrics: TweetMetrics = {
    likes: metrics?.like_count || 0,
    retweets: metrics?.retweet_count || 0,
    replies: metrics?.reply_count || 0,
    views: metrics?.impression_count || 0,
  };

  return {
    id: tweetData.id as string,
    text: tweetData.text as string,
    author,
    created_at: new Date(tweetData.created_at as string),
    metrics: tweetMetrics,
    url: `https://twitter.com/${author.username}/status/${tweetData.id}`,
    conversation_id: tweetData.conversation_id as string | undefined,
    in_reply_to_id: tweetData.in_reply_to_user_id as string | undefined,
    lang: tweetData.lang as string | undefined,
  };
}

export function isDemoMode(): boolean {
  return !getBearerToken();
}

export async function searchTweets(options: SearchOptions): Promise<ApiResponse<Tweet[]>> {
  const { query, time, minLikes, minRetweets, verified, limit = 10, sort = 'popular', lang } = options;
  const cacheKey = `search:${JSON.stringify(options)}`;

  const cached = getCache<Tweet[]>(cacheKey);
  if (cached) {
    const tweets = cached.map((t) => ({ ...t, created_at: new Date(t.created_at) }));
    return { data: tweets, fromCache: true };
  }

  if (isDemoMode()) {
    const hoursMap: Record<string, number> = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
    const hours = time ? hoursMap[time] || 168 : 168;
    return { data: generateMockTweets(query, limit, hours), fromCache: false };
  }

  const bearerToken = getBearerToken()!;
  let q = query;
  if (verified) q += ' filter:verified';
  if (minLikes) q += ` min_faves:${minLikes}`;
  if (minRetweets) q += ` min_retweets:${minRetweets}`;
  if (lang) q += ` lang:${lang}`;

  const params = new URLSearchParams({
    query: q,
    max_results: Math.min(Math.max(limit, 10), 100).toString(),
    'tweet.fields': 'created_at,public_metrics,author_id,conversation_id,lang',
    'user.fields': 'username,name,verified,public_metrics',
    expansions: 'author_id',
    sort_order: sort === 'recent' ? 'recency' : 'relevancy',
  });

  const startTime = getStartTime(time);
  if (startTime) params.set('start_time', startTime);

  const path = `/2/tweets/search/recent?${params.toString()}`;
  const { data: response, headers } = await request(path, bearerToken);
  const rateLimit = parseRateLimits(headers);

  const apiResponse = response as {
    data?: Array<Record<string, unknown>>;
    includes?: { users?: Array<Record<string, unknown>> };
  };

  if (!apiResponse.data) return { data: [], fromCache: false, rateLimit };

  const usersMap = new Map<string, Record<string, unknown>>();
  for (const user of apiResponse.includes?.users || []) {
    usersMap.set(user.id as string, user);
  }

  let tweets = apiResponse.data.map((tweet) => {
    const user = usersMap.get(tweet.author_id as string) || { id: tweet.author_id, username: 'unknown', name: 'Unknown', verified: false };
    return parseTweet(tweet, user);
  });

  if (sort === 'popular') tweets.sort((a, b) => b.metrics.likes - a.metrics.likes);
  tweets = tweets.slice(0, limit);
  setCache(cacheKey, tweets);

  return { data: tweets, fromCache: false, rateLimit };
}

export async function getReplies(tweetId: string, limit: number = 10): Promise<ApiResponse<Tweet[]>> {
  const cacheKey = `replies:${tweetId}:${limit}`;

  const cached = getCache<Tweet[]>(cacheKey);
  if (cached) {
    const tweets = cached.map((t) => ({ ...t, created_at: new Date(t.created_at) }));
    return { data: tweets, fromCache: true };
  }

  if (isDemoMode()) return { data: generateMockReplies(tweetId, limit), fromCache: false };

  const bearerToken = getBearerToken()!;
  const params = new URLSearchParams({
    query: `conversation_id:${tweetId}`,
    max_results: Math.min(Math.max(limit, 10), 100).toString(),
    'tweet.fields': 'created_at,public_metrics,author_id,in_reply_to_user_id',
    'user.fields': 'username,name,verified,public_metrics',
    expansions: 'author_id',
  });

  const path = `/2/tweets/search/recent?${params.toString()}`;
  const { data: response, headers } = await request(path, bearerToken);
  const rateLimit = parseRateLimits(headers);

  const apiResponse = response as {
    data?: Array<Record<string, unknown>>;
    includes?: { users?: Array<Record<string, unknown>> };
  };

  if (!apiResponse.data) return { data: [], fromCache: false, rateLimit };

  const usersMap = new Map<string, Record<string, unknown>>();
  for (const user of apiResponse.includes?.users || []) {
    usersMap.set(user.id as string, user);
  }

  const tweets = apiResponse.data
    .map((tweet) => {
      const user = usersMap.get(tweet.author_id as string) || { id: tweet.author_id, username: 'unknown', name: 'Unknown', verified: false };
      return parseTweet(tweet, user);
    })
    .sort((a, b) => b.metrics.likes - a.metrics.likes)
    .slice(0, limit);

  setCache(cacheKey, tweets);
  return { data: tweets, fromCache: false, rateLimit };
}

export async function getUserTweets(username: string, limit: number = 10): Promise<ApiResponse<Tweet[]>> {
  const cacheKey = `user:${username.toLowerCase()}:${limit}`;

  const cached = getCache<Tweet[]>(cacheKey);
  if (cached) {
    const tweets = cached.map((t) => ({ ...t, created_at: new Date(t.created_at) }));
    return { data: tweets, fromCache: true };
  }

  if (isDemoMode()) return { data: generateMockUserTweets(username, limit), fromCache: false };

  const bearerToken = getBearerToken()!;

  const userPath = `/2/users/by/username/${username}?user.fields=public_metrics,verified`;
  const { data: userResponse } = await request(userPath, bearerToken);
  const userApiResponse = userResponse as { data?: Record<string, unknown> };

  if (!userApiResponse.data) throw new Error(`User @${username} not found`);

  const userData = userApiResponse.data;
  const userId = userData.id as string;

  const params = new URLSearchParams({
    max_results: Math.min(Math.max(limit, 5), 100).toString(),
    'tweet.fields': 'created_at,public_metrics',
    exclude: 'retweets,replies',
  });

  const tweetsPath = `/2/users/${userId}/tweets?${params.toString()}`;
  const { data: tweetsResponse, headers } = await request(tweetsPath, bearerToken);
  const rateLimit = parseRateLimits(headers);

  const tweetsApiResponse = tweetsResponse as { data?: Array<Record<string, unknown>> };
  if (!tweetsApiResponse.data) return { data: [], fromCache: false, rateLimit };

  const tweets = tweetsApiResponse.data
    .map((tweet) => parseTweet(tweet, userData))
    .sort((a, b) => b.metrics.likes - a.metrics.likes)
    .slice(0, limit);

  setCache(cacheKey, tweets);
  return { data: tweets, fromCache: false, rateLimit };
}
