# Setup Guide

Get your Twitter CLI up and running in 5 minutes.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Twitter Developer Account** - Free tier works fine

## Step 1: Install the CLI

```bash
# Clone the repository
git clone https://github.com/eddieberklee/twitter-cli
cd twitter-cli

# Install dependencies
npm install

# Link globally so you can run `twitter-cli` anywhere
npm link
```

Verify installation:
```bash
twitter-cli --version
# Should output: 1.0.0
```

## Step 2: Get Twitter API Access

### Create a Developer Account

1. Go to [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your Twitter account
3. Apply for a developer account (if you don't have one)
   - Select "Hobbyist" → "Exploring the API"
   - Fill out the form (a few sentences about your use case is fine)
   - Approval is usually instant for personal use

### Create a Project and App

1. Once approved, go to the [Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click **"Create Project"**
   - Name: `twitter-cli` (or anything you like)
   - Use case: Select appropriate option
   - Description: "Personal CLI tool for searching tweets"
3. Click **"Create App"** within the project
   - App name: `twitter-cli-app`

### Get Your Bearer Token

1. In your app settings, go to **"Keys and tokens"**
2. Find **"Bearer Token"** under "Authentication Tokens"
3. Click **"Generate"** (or "Regenerate" if one exists)
4. **Copy the token** - you'll only see it once!

> ⚠️ **Keep your token secret!** Don't commit it to git or share it publicly.

## Step 3: Configure the CLI

### Option A: Interactive Setup (Recommended)

```bash
twitter-cli config init
```

Follow the prompts to enter your Bearer Token.

### Option B: Direct Configuration

```bash
twitter-cli config set TWITTER_BEARER_TOKEN "AAAAAAAAAAAAAAAAAAAAAxxxxxx..."
```

### Option C: Environment Variable

```bash
export TWITTER_BEARER_TOKEN="AAAAAAAAAAAAAAAAAAAAAxxxxxx..."
```

Add this to your `~/.bashrc` or `~/.zshrc` to make it permanent.

## Step 4: Verify Your Setup

Test with a real search:

```bash
twitter-cli search "hello world" --limit 3
```

If configured correctly, you'll see real tweets! 🎉

If you see **"DEMO MODE"** banner, your token isn't configured properly.

## Configuration File Location

Your config is stored at:
```
~/.twitter-cli/config.json
```

You can view it with:
```bash
cat ~/.twitter-cli/config.json
```

Or check your settings:
```bash
twitter-cli config
```

## Troubleshooting

### "Demo Mode" still showing

1. Check your token is set:
   ```bash
   twitter-cli config get TWITTER_BEARER_TOKEN
   ```
2. Make sure there are no extra spaces or quotes
3. Try the environment variable method as a test:
   ```bash
   TWITTER_BEARER_TOKEN="your-token" twitter-cli search "test"
   ```

### "Unauthorized" or "401" errors

- Your Bearer Token might be invalid or revoked
- Go back to the Developer Portal and regenerate it
- Make sure you're using the **Bearer Token**, not the API Key

### "Rate limit exceeded"

- Twitter limits requests to ~450 per 15-minute window
- The CLI caches results for 5 minutes to help with this
- Wait a few minutes and try again

### "User not found" or "Tweet not found"

- The account might be private or suspended
- The tweet might have been deleted
- Double-check the username/tweet ID

### Connection errors

- Check your internet connection
- If behind a proxy, you may need to configure it:
  ```bash
  export HTTPS_PROXY="http://your-proxy:port"
  ```

## API Limits (Free Tier)

Twitter's free tier includes:
- **Tweet lookup**: 450 requests / 15 min
- **User lookup**: 300 requests / 15 min  
- **Search**: 180 requests / 15 min

The CLI shows remaining quota after each request. Caching helps you stay under limits.

## Next Steps

Now that you're set up:

```bash
# Search for popular tweets
twitter-cli search "AI agents" --min-likes 100

# Check out a user's timeline
twitter-cli user elonmusk

# Export data for analysis
twitter-cli search "startup" --json > data.json
```

See the [README](README.md) for full documentation.

## Security Notes

- Never commit your Bearer Token to git
- Add `~/.twitter-cli/` to your global gitignore if needed
- Rotate your token if you suspect it's been exposed
- The CLI stores your token locally in `~/.twitter-cli/config.json`
