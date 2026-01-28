#!/bin/bash
# Data Export Examples for Twitter CLI
# Run: chmod +x export-data.sh && ./export-data.sh

echo "=== Data Export Examples ==="
echo ""

# JSON export
echo "1. Export to JSON:"
echo ""
echo "   # Save search results to JSON"
echo "   twitter-cli search \"machine learning\" --json > ml-tweets.json"
echo ""
echo "   # Pretty-print with jq"
echo "   twitter-cli search \"AI\" --json | jq '.'"
echo ""
echo "   # Extract just the text"
echo "   twitter-cli search \"AI\" --json | jq '.[].text'"
echo ""
echo "   # Get tweet URLs only"
echo "   twitter-cli search \"AI\" --json | jq -r '.[].url'"
echo ""

# CSV export
echo "2. Export to CSV:"
echo ""
echo "   # Save to CSV file"
echo "   twitter-cli search \"startup\" --csv > startups.csv"
echo ""
echo "   # Open in Excel/Google Sheets"
echo "   # The CSV includes: id, username, text, likes, retweets, replies, views, created_at, url"
echo ""

# Quiet mode (URLs only)
echo "3. Export URLs only:"
echo ""
echo "   # Get just the tweet URLs"
echo "   twitter-cli search \"tech news\" --quiet > urls.txt"
echo ""
echo "   # Count results"
echo "   twitter-cli search \"AI\" --quiet | wc -l"
echo ""

# Combining with other tools
echo "4. Pipe to other tools:"
echo ""
echo "   # Count tweets by hour (requires jq)"
echo "   twitter-cli search \"news\" --time 24h --limit 100 --json | \\"
echo "     jq -r '.[].created_at' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c"
echo ""
echo "   # Find most mentioned users"
echo "   twitter-cli search \"AI\" --json | grep -oE '@[a-zA-Z0-9_]+' | sort | uniq -c | sort -rn | head"
echo ""
echo "   # Archive tweets to a log"
echo "   twitter-cli search \"breaking\" --time 1h --json >> tweet-archive.jsonl"
echo ""

# Backup user timeline
echo "5. Archive a user's tweets:"
echo ""
echo "   # Full JSON backup"
echo "   twitter-cli user elonmusk --limit 100 --json > elon-backup.json"
echo ""
echo "   # CSV for spreadsheet analysis"
echo "   twitter-cli user naval --limit 50 --csv > naval-tweets.csv"
echo ""

echo "=== Live Demo ==="
echo ""

echo "Exporting 3 AI tweets to JSON..."
twitter-cli search "AI" --limit 3 --json

echo ""
echo "Exporting 3 startup tweets to CSV..."
twitter-cli search "startup" --limit 3 --csv
