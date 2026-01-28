# 🐦 Twitter CLI

A fast, beautiful command-line tool for searching Twitter. No fluff, just tweets.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

## Features

- 🔍 **Search tweets** with powerful filters (time, likes, retweets, verified)
- 👤 **Browse user timelines** sorted by engagement
- 💬 **View top replies** to any tweet
- 📦 **Caching** to avoid rate limits
- 🎨 **Beautiful output** with emoji and colors
- 📤 **Export** to JSON or CSV
- 🎭 **Demo mode** works without API credentials

## Installation

```bash
# Clone and install
git clone https://github.com/eddieberklee/twitter-cli
cd twitter-cli
npm install
npm link

# Or install globally (coming soon)
# npm install -g @eddieberklee/twitter-cli
```

## Quick Start

```bash
# Search for tweets (works immediately with demo data)
twitter-cli search "AI agents"

# Search with filters
twitter-cli search "machine learning" --time 24h --min-likes 100 --limit 20

# Get a user's popular tweets
twitter-cli user elonmusk --limit 5

# View replies to a tweet
twitter-cli replies 1234567890

# Export to JSON
twitter-cli search "startup" --json > results.json
```

## Demo Mode

**No API key? No problem!** The CLI works out of the box with realistic sample data. Perfect for testing and demos.

```bash
twitter-cli search "technology" --limit 5
```

## Setup

To use with real Twitter data, you'll need a Twitter API Bearer Token.

```bash
# Interactive setup wizard (recommended)
twitter-cli setup
```

This will:
1. Open the Twitter Developer Portal in your browser
2. Guide you through getting a Bearer Token
3. Validate and save your credentials

### Alternative Setup Methods

```bash
# Set token directly with validation
twitter-cli config set bearerToken "your-token-here" --validate

# Or use environment variable
export TWITTER_BEARER_TOKEN="your-token-here"
```

See [SETUP.md](SETUP.md) for detailed instructions and troubleshooting.

## Commands

### `search <query>`

Search for tweets matching a query.

```bash
twitter-cli search "AI agents"
```

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --time <range>` | Time range: `1h`, `24h`, `7d`, `30d` |
| `-l, --min-likes <n>` | Minimum likes |
| `-r, --min-retweets <n>` | Minimum retweets |
| `-v, --verified` | Only verified accounts |
| `-n, --limit <n>` | Number of results (default: 10) |
| `-s, --sort <order>` | Sort: `recent`, `popular`, `relevant` |
| `--lang <code>` | Language filter (e.g., `en`, `es`) |
| `--json` | Output as JSON |
| `--csv` | Output as CSV |
| `-q, --quiet` | Output URLs only |
| `--no-color` | Disable colors |

**Examples:**
```bash
# Popular AI tweets from the last 24 hours
twitter-cli search "AI" --time 24h --min-likes 1000

# Verified accounts only, sorted by recent
twitter-cli search "startup" --verified --sort recent

# Export to CSV
twitter-cli search "tech" --csv > tweets.csv
```

### `user <username>`

Get a user's recent popular tweets.

```bash
twitter-cli user karpathy --limit 5
```

### `replies <tweet_id>`

Get the top replies to a tweet.

```bash
twitter-cli replies 1234567890123456789
```

### `setup`

Interactive setup wizard for API credentials.

```bash
twitter-cli setup
```

**Options:**
| Option | Description |
|--------|-------------|
| `--no-browser` | Don't open browser automatically |
| `--skip-validation` | Skip token validation |

### `config`

Manage CLI configuration.

```bash
# Show current config
twitter-cli config

# Set a value
twitter-cli config set bearerToken "your-token" --validate

# Get a value
twitter-cli config get cacheEnabled

# Validate current token
twitter-cli config validate
```

**Config options:**
- `bearerToken` - Your API token
- `cacheEnabled` - Enable/disable caching (default: true)
- `cacheTtlMinutes` - Cache duration (default: 15)
- `defaultLimit` - Default result count (default: 10)

### `cache`

Manage cached data.

```bash
# Show cache status
twitter-cli cache

# Clear all cached data
twitter-cli cache clear

# Show cache statistics
twitter-cli cache stats
```

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@elonmusk ✓ • 2h ago
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI agents are going to change everything. The next 
generation of software will be autonomous.

❤️  45.2K  🔄 12.1K  💬 3.4K  👁️  2.1M

🔗 https://twitter.com/elonmusk/status/123456789
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Scripting

Exit codes for automation:
- `0` - Success
- `1` - Error (API error, invalid input, etc.)

```bash
# Check if search found results
twitter-cli search "rare topic" --quiet && echo "Found!" || echo "Nothing found"

# Pipe to other tools
twitter-cli search "news" --json | jq '.[0].text'
```

## Rate Limits

The Twitter API has rate limits. The CLI handles this by:
- Caching results for 5 minutes (configurable)
- Showing rate limit info after requests
- Gracefully handling rate limit errors

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev -- search "test"

# Build
npm run build

# Run tests
npm test

# Link for local testing
npm link
```

## License

MIT © Eddie Berklee

## Links

- [GitHub Repository](https://github.com/eddieberklee/twitter-cli)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Report Issues](https://github.com/eddieberklee/twitter-cli/issues)
