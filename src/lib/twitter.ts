/**
 * Twitter API utilities for validation and testing
 */

import * as https from 'https';
import { getBearerToken } from './config.js';

const TWITTER_API_BASE = 'api.twitter.com';

export interface TokenValidationResult {
  valid: boolean;
  appName?: string;
  username?: string;
  error?: string;
}

/**
 * Makes a request to the Twitter API
 */
function request(path: string, bearerToken: string): Promise<{ data: unknown; statusCode: number }> {
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
          resolve({ data, statusCode: res.statusCode || 500 });
        } catch {
          reject(new Error('Failed to parse API response'));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Network error: ${err.message}`)));
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

/**
 * Validates a bearer token by making a test API call
 * Uses the /2/tweets/search/recent endpoint with a simple query
 */
export async function validateToken(token?: string): Promise<TokenValidationResult> {
  const bearerToken = token || getBearerToken();
  
  if (!bearerToken) {
    return {
      valid: false,
      error: 'No token provided',
    };
  }

  try {
    // Use a simple search to validate - this uses fewer rate limits than other endpoints
    const params = new URLSearchParams({
      query: 'hello',
      max_results: '10',
    });
    
    const { data, statusCode } = await request(
      `/2/tweets/search/recent?${params.toString()}`,
      bearerToken
    );

    const apiResponse = data as {
      data?: unknown[];
      errors?: Array<{ message: string; code?: number }>;
      detail?: string;
      title?: string;
    };

    // Check for various error conditions
    if (statusCode === 401) {
      return {
        valid: false,
        error: 'Invalid or expired token. Please generate a new Bearer Token.',
      };
    }

    if (statusCode === 403) {
      const detail = apiResponse.detail || apiResponse.title || 'Access forbidden';
      if (detail.includes('not authorized')) {
        return {
          valid: false,
          error: 'Your app does not have access to the Twitter API v2. Check your developer account status.',
        };
      }
      return {
        valid: false,
        error: `Access forbidden: ${detail}`,
      };
    }

    if (statusCode === 429) {
      // Rate limited but token is valid
      return {
        valid: true,
        appName: 'Your Twitter App',
      };
    }

    if (apiResponse.errors) {
      const error = apiResponse.errors[0];
      return {
        valid: false,
        error: error.message || 'Unknown API error',
      };
    }

    if (statusCode >= 400) {
      return {
        valid: false,
        error: apiResponse.detail || `API error (status ${statusCode})`,
      };
    }

    // Success!
    return {
      valid: true,
      appName: 'Your Twitter App',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (message.includes('Network error') || message.includes('timeout')) {
      return {
        valid: false,
        error: 'Could not connect to Twitter API. Check your internet connection.',
      };
    }

    return {
      valid: false,
      error: message,
    };
  }
}

/**
 * Checks if the current environment has a valid token configured
 */
export function hasValidToken(): boolean {
  return !!getBearerToken();
}

/**
 * Returns information about token source (env var vs config file)
 */
export function getTokenSource(): 'env' | 'config' | 'none' {
  if (process.env.TWITTER_BEARER_TOKEN) {
    return 'env';
  }
  if (getBearerToken()) {
    return 'config';
  }
  return 'none';
}
