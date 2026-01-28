# Twitter CLI - Project Brief

## Vision
A simple command-line tool to search Twitter and display popular tweets. No AI, no dashboard, just a fast script you can run yourself.

## Core Functionality

```bash
# Basic search
twitter-cli search "AI agents"

# With options
twitter-cli search "AI agents" --time 24h --min-likes 100 --limit 20

# Show replies to a tweet
twitter-cli replies <tweet_id>

# Export to JSON
twitter-cli search "AI agents" --json > results.json
```

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@elonmusk • 2h ago • ✓ Verified
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI agents are going to change everything. The next 
generation of software will be autonomous.

❤️ 45.2K  🔄 12.1K  💬 3.4K  👁️ 2.1M

🔗 https://twitter.com/elonmusk/status/123456789
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Features

### Search Options
- `--time` / `-t`: Time range (1h, 24h, 7d, 30d)
- `--min-likes` / `-l`: Minimum likes filter
- `--min-retweets` / `-r`: Minimum retweets filter
- `--verified` / `-v`: Only verified accounts
- `--limit` / `-n`: Number of results (default 10)
- `--sort` / `-s`: Sort by (recent, popular, relevant)
- `--lang`: Language filter

### Output Options
- `--json`: Output raw JSON
- `--csv`: Output as CSV
- `--quiet` / `-q`: Minimal output (just links)
- `--no-color`: Disable colors

### Other Commands
- `twitter-cli replies <tweet_id>`: Show top replies
- `twitter-cli user <username>`: Show user's recent popular tweets
- `twitter-cli config`: Set up API credentials
- `twitter-cli cache clear`: Clear cached results

## Technical Requirements

- **Language**: TypeScript/Node.js (compile to single executable with pkg or bun)
- **Dependencies**: Minimal (just Twitter API client, CLI framework)
- **Auth**: Twitter API Bearer Token (stored in ~/.twitter-cli/config.json)
- **Caching**: Cache results for 5 min to avoid rate limits
- **Rate Limits**: Show remaining requests, queue when near limit

## Installation

```bash
# Via npm
npm install -g @eddieberklee/twitter-cli

# Or download binary
curl -fsSL https://raw.githubusercontent.com/eddieberklee/twitter-cli/main/install.sh | bash
```

## Config

```bash
# First-time setup
twitter-cli config

# Or set directly
twitter-cli config set TWITTER_BEARER_TOKEN "your-token"
```

## Success Criteria

- Run search in < 2 seconds
- Clear, readable output
- Works offline with cached data
- Handles rate limits gracefully
- Zero AI/Claude usage
