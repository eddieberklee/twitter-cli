# Twitter CLI Setup Guide

This guide walks you through setting up your Twitter API credentials for the Twitter CLI.

## Quick Start

The fastest way to get started:

```bash
twitter-cli setup
```

This interactive wizard will:
1. Open the Twitter Developer Portal in your browser
2. Guide you through getting a Bearer Token
3. Validate your token
4. Save the configuration

## Getting a Twitter Bearer Token

### Step 1: Create a Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/projects-and-apps)
2. Sign in with your Twitter account
3. If you don't have a developer account, apply for one
   - Select "Hobbyist" or appropriate use case
   - Fill in the required information
   - Agree to the Developer Agreement

### Step 2: Create a Project and App

1. Click **"+ Create Project"** in the sidebar
2. Name your project (e.g., "Twitter CLI")
3. Select a use case (e.g., "Learning/Student" or "Building tools for Twitter users")
4. Give your project a description
5. Create an **App** within the project
   - Name it something memorable (e.g., "twitter-cli-local")

### Step 3: Get Your Bearer Token

1. In your App settings, go to **"Keys and Tokens"** tab
2. Scroll to **"Authentication Tokens"** section
3. Click **"Generate"** next to Bearer Token
4. **Copy the token immediately** - you won't be able to see it again!

> ⚠️ **Important**: Bearer tokens are long strings, typically starting with `AAAA...`. Make sure you copy the entire token.

### Step 4: Configure Twitter CLI

Use one of these methods:

#### Option A: Setup Wizard (Recommended)
```bash
twitter-cli setup
```

#### Option B: Direct Configuration
```bash
twitter-cli config set bearerToken "YOUR_TOKEN_HERE" --validate
```

#### Option C: Environment Variable
```bash
export TWITTER_BEARER_TOKEN="YOUR_TOKEN_HERE"
```

Add to your shell profile (`.bashrc`, `.zshrc`, etc.) to persist.

## Authentication Methods

Twitter CLI supports three ways to authenticate, checked in this order:

| Method | Precedence | Best For |
|--------|------------|----------|
| `TWITTER_BEARER_TOKEN` env var | 1 (highest) | CI/CD, Docker, scripting |
| Config file (`~/.twitter-cli/config.json`) | 2 | Personal use, development |
| None (demo mode) | 3 | Quick testing with sample data |

### Environment Variable

Best for CI/CD pipelines and containerized environments:

```bash
# Linux/macOS
export TWITTER_BEARER_TOKEN="your-token-here"

# Windows (PowerShell)
$env:TWITTER_BEARER_TOKEN = "your-token-here"

# Docker
docker run -e TWITTER_BEARER_TOKEN="your-token" twitter-cli search "query"

# GitHub Actions
env:
  TWITTER_BEARER_TOKEN: ${{ secrets.TWITTER_BEARER_TOKEN }}
```

### Config File

Located at `~/.twitter-cli/config.json`:

```json
{
  "bearerToken": "your-token-here",
  "cacheEnabled": true,
  "cacheTtlMinutes": 15,
  "defaultLimit": 10
}
```

## Verifying Your Setup

```bash
# Check current configuration
twitter-cli config

# Validate your token
twitter-cli config validate

# Test with a search
twitter-cli search "hello world" --limit 3
```

## Common Errors

### "Invalid or expired token"

**Cause**: Your bearer token is incorrect or has expired.

**Fix**:
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/projects-and-apps)
2. Regenerate your Bearer Token
3. Run `twitter-cli setup` again

### "Access forbidden"

**Cause**: Your app doesn't have the necessary permissions.

**Fix**:
1. Check your app's access level in the Developer Portal
2. Ensure you have at least "Read" permissions
3. Some queries require "Elevated" access

### "Rate limit exceeded"

**Cause**: You've made too many API requests.

**Fix**:
- Wait for the rate limit to reset (shown in error message)
- Use `--limit` to reduce results per request
- Enable caching: `twitter-cli config set cacheEnabled true`

### "User not found"

**Cause**: The Twitter account doesn't exist or is suspended.

**Fix**: Double-check the username spelling.

### "Network error"

**Cause**: Cannot connect to Twitter API.

**Fix**:
- Check your internet connection
- Check if Twitter API is experiencing issues: [Twitter API Status](https://api.twitterstat.us/)

## CI/CD Usage

### GitHub Actions

```yaml
name: Twitter Monitoring
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  search:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install Twitter CLI
        run: npm install -g @eddieberklee/twitter-cli
      
      - name: Search tweets
        env:
          TWITTER_BEARER_TOKEN: ${{ secrets.TWITTER_BEARER_TOKEN }}
        run: |
          twitter-cli search "your query" --json > results.json
```

### Docker

```dockerfile
FROM node:18-alpine
RUN npm install -g @eddieberklee/twitter-cli
ENV TWITTER_BEARER_TOKEN=""
ENTRYPOINT ["twitter-cli"]
```

```bash
docker build -t twitter-cli .
docker run -e TWITTER_BEARER_TOKEN="your-token" twitter-cli search "query"
```

## Security Best Practices

1. **Never commit tokens** to version control
2. **Use environment variables** in production
3. **Rotate tokens** periodically
4. **Use read-only tokens** when write access isn't needed
5. **Store tokens securely** in secrets managers (AWS Secrets Manager, Vault, etc.)

## Upgrading from Demo Mode

Demo mode shows sample data without an API token. To start using real data:

```bash
# You'll see this message in demo mode:
# 📋 DEMO MODE - No API credentials configured

# Run setup to configure your token:
twitter-cli setup
```

## Getting Help

```bash
# General help
twitter-cli --help

# Command-specific help
twitter-cli search --help
twitter-cli config --help
twitter-cli setup --help
```

## Troubleshooting

### Reset Configuration

```bash
# Remove config file
rm ~/.twitter-cli/config.json

# Clear cache
twitter-cli cache clear

# Start fresh
twitter-cli setup
```

### Debug Mode

```bash
# Check token source and status
twitter-cli config

# Validate token manually
twitter-cli config validate
```

---

Still having issues? [Open an issue](https://github.com/eddieberklee/twitter-cli/issues) on GitHub.
