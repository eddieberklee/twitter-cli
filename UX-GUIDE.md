# UX Guide for Twitter CLI

This document outlines the UX decisions and design principles for the Twitter CLI.

## Design Philosophy

**"Fast, friendly, and scriptable."**

The CLI should be:
- **Fast** - Minimal output, quick to scan
- **Friendly** - Clear errors with actionable suggestions
- **Scriptable** - Multiple output formats, respects NO_COLOR

## Output Formatting

### Tweet Display

Tweets use Unicode box-drawing characters for visual structure:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@username ✓ • 2h ago
────────────────────────────────────────────────────────
Tweet text with proper word wrapping at 54 characters
to ensure readability in standard terminals.

❤️  45.2K   🔄 12.1K   💬 3.4K    👁️  2.1M

🔗 https://twitter.com/username/status/1234567890123456789
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Design decisions:
- **56-character width** - Fits standard 80-col terminals with room for line numbers
- **Heavy separators (━)** - Mark tweet boundaries clearly
- **Light separators (─)** - Separate header from content
- **Fixed-width metrics** - Aligned columns for easy scanning
- **Emoji icons** - Universal, work in most terminals
- **Verification badge (✓)** - Blue when colors enabled

### Number Formatting

Large numbers use K/M suffixes for readability:
- `1234` → `1.2K`
- `45678` → `45.7K`
- `1234567` → `1.2M`

Trailing zeros are stripped: `1.0K` → `1K`

### Time Formatting

Relative times are human-friendly:
- `just now` - Under 60 seconds
- `5m ago` - Minutes
- `2h ago` - Hours
- `3d ago` - Days
- `2w ago` - Weeks
- `Jan 15` - Older than a month (includes year if different)

### Color Coding

Colors convey meaning at a glance:

| Color  | Usage                        |
|--------|------------------------------|
| Green  | Viral tweets (10K+ likes), success messages |
| Cyan   | Popular tweets (1K+ likes), URLs, verification badges |
| Blue   | Good engagement (100+ likes), info messages |
| Yellow | Warnings, demo mode |
| Red    | Errors |
| Dim    | Secondary info, hints, low engagement |

Colors are disabled when:
- `--no-color` flag is passed
- `NO_COLOR` environment variable is set
- Output is piped (non-TTY)

## Progress Indicators

### Spinner

Used during network requests to show activity:

```
⠋ Searching tweets...
⠙ Searching tweets...
⠹ Searching tweets...
✓ Found 10 tweets
```

The spinner:
- Uses braille patterns for smooth animation
- Updates every 80ms
- Falls back to simple text in non-TTY environments
- Shows final count on completion

### Progress Bar (for pagination)

```
█████████████████░░░░░░░░░░░░░░ 56% Fetching page 3/5
```

Used when fetching multiple pages of results.

## Error Messages

Errors follow a consistent pattern:

```
✗ [What went wrong]

[Why it happened / Context]
[How to fix it]
```

Example:
```
✗ User @nonexistent not found

Double-check the username and try again.
Note: The username is case-insensitive.
```

### Error Types and Suggestions

| Error | Suggestion |
|-------|------------|
| Rate limit | Wait time, use cache |
| Auth failed | Run `config init` |
| Not found | Check ID/username |
| Network error | Check connection |
| Invalid input | Show expected format |

## Help Text

### Command Help

Each command includes:
1. Description
2. Options with defaults
3. Examples (most useful first)
4. Tips and advanced usage

Example structure:
```
$ twitter-cli search --help

Usage: twitter-cli search [options] <query>

Search for tweets matching a query

Options:
  -t, --time <range>        Time range: 1h, 24h, 7d, 30d
  -n, --limit <count>       Number of results (default: 10)
  ...

Examples:
  $ twitter-cli search "AI agents"              # Basic search
  $ twitter-cli search "OpenAI" -t 24h          # Last 24 hours
  ...

Tips:
  • Combine search operators for precise results
```

### Main Help

Running `twitter-cli` without arguments shows:
1. Welcome banner
2. Quick start examples
3. Overview of commands
4. Link to documentation

## Demo Mode

When no API credentials are configured:

```
📋 DEMO MODE
No API credentials configured. Showing sample data.
Run `twitter-cli config init` to set up your Twitter API token.
```

Demo mode:
- Uses realistic mock data
- Allows users to explore the CLI without setup
- Prominently suggests configuration

## Configuration

### Interactive Setup

`twitter-cli config init` provides a guided setup:

1. Welcome message
2. Instructions for getting API token
3. Prompt for token (can skip)
4. Confirmation and next steps

### Config Display

`twitter-cli config` shows current settings clearly:

```
🔧 Twitter CLI Configuration

✓ API credentials configured
   Token: AAAAA...xxxxx

Settings:
   Cache enabled:  yes
   Cache TTL:      15 minutes
   Default limit:  10 tweets

Files:
   Config:  ~/.twitter-cli/config.json
   Cache:   ~/.twitter-cli/cache.json
```

## Output Formats

### Default (Pretty)
Human-readable with colors and formatting.

### Compact (`-c`)
Single-line tweets for quick scanning:
```
@user ✓ (2h ago) ❤️ 45.2K  🔄 12.1K
  Tweet text truncated to 60 characters...
  https://twitter.com/user/status/123
```

### JSON (`--json`)
Machine-readable, properly indented:
```json
[
  {
    "id": "123",
    "text": "...",
    "author": { ... },
    "metrics": { ... }
  }
]
```

### CSV (`--csv`)
Spreadsheet-friendly with proper escaping:
```
id,username,text,likes,retweets,replies,views,created_at,url
123,user,"Tweet text",45200,12100,3400,2100000,2024-01-28T12:00:00Z,https://...
```

### Quiet (`-q`)
Just URLs, one per line:
```
https://twitter.com/user/status/123
https://twitter.com/user/status/456
```

## Accessibility

- **NO_COLOR support** - Respects environment variable
- **Screen reader friendly** - Logical output order
- **High contrast** - Color choices work in light/dark modes
- **No blinking/animation** - Spinner is subtle, stops cleanly

## Keyboard Shortcuts

The CLI is designed for efficient workflows:

```bash
# Pipe to clipboard (macOS)
twitter-cli search "AI" -q | pbcopy

# Open first result
twitter-cli search "AI" -q | head -1 | xargs open

# Save to file
twitter-cli search "AI" --json > results.json

# Process with jq
twitter-cli search "AI" --json | jq '.[0].text'
```

## Responsive Design

The CLI adapts to terminal width:
- 56-char content width fits 80-col terminals
- Long URLs are not truncated (important for copying)
- Word wrapping respects word boundaries
- Very long words (URLs) are broken at max width
