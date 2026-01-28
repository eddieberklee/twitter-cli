#!/bin/bash
# Shell Scripting Examples for Twitter CLI
# These examples show how to use twitter-cli in automated scripts

echo "=== Scripting Examples ==="
echo ""

# Exit codes
echo "1. Exit Codes:"
echo "   twitter-cli uses standard exit codes:"
echo "   - 0 = Success (results found)"
echo "   - 1 = Error (API error, invalid input, etc.)"
echo ""

# Conditional execution
echo "2. Check if tweets exist:"
echo ""
cat << 'SCRIPT'
# Check if a topic is trending
if twitter-cli search "breaking news" --time 1h --quiet > /dev/null 2>&1; then
    echo "Breaking news found!"
else
    echo "No breaking news right now"
fi
SCRIPT
echo ""

# Monitoring script
echo "3. Simple Tweet Monitor:"
echo ""
cat << 'SCRIPT'
#!/bin/bash
# monitor.sh - Check for new tweets about a topic every 5 minutes

TOPIC="$1"
CACHE_FILE="/tmp/twitter-monitor-last.txt"

while true; do
    echo "[$(date)] Checking for tweets about: $TOPIC"
    
    # Get latest tweet URL
    LATEST=$(twitter-cli search "$TOPIC" --time 1h --limit 1 --quiet 2>/dev/null)
    
    if [ -n "$LATEST" ]; then
        # Check if it's new
        LAST=$(cat "$CACHE_FILE" 2>/dev/null)
        if [ "$LATEST" != "$LAST" ]; then
            echo "New tweet found: $LATEST"
            echo "$LATEST" > "$CACHE_FILE"
            # Optional: send notification
            # notify-send "New tweet about $TOPIC" "$LATEST"
        fi
    fi
    
    sleep 300  # 5 minutes
done

# Usage: ./monitor.sh "AI agents"
SCRIPT
echo ""

# Daily digest
echo "4. Generate Daily Digest:"
echo ""
cat << 'SCRIPT'
#!/bin/bash
# digest.sh - Generate a daily digest of top tweets

DATE=$(date +%Y-%m-%d)
OUTPUT="digest-$DATE.md"

echo "# Twitter Digest - $DATE" > "$OUTPUT"
echo "" >> "$OUTPUT"

# Top AI tweets
echo "## AI & Machine Learning" >> "$OUTPUT"
twitter-cli search "AI OR machine learning" --time 24h --min-likes 500 --limit 5 --quiet >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Top startup tweets
echo "## Startups" >> "$OUTPUT"
twitter-cli search "startup funding" --time 24h --min-likes 100 --limit 5 --quiet >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "Digest saved to $OUTPUT"
SCRIPT
echo ""

# Engagement tracker
echo "5. Track Account Engagement:"
echo ""
cat << 'SCRIPT'
#!/bin/bash
# engagement.sh - Track engagement metrics for accounts

USERS=("elonmusk" "sama" "naval")

echo "username,avg_likes,avg_retweets,total_tweets"

for user in "${USERS[@]}"; do
    # Get metrics from JSON output
    DATA=$(twitter-cli user "$user" --limit 10 --json 2>/dev/null)
    
    if [ -n "$DATA" ]; then
        AVG_LIKES=$(echo "$DATA" | jq '[.[].metrics.likes] | add / length | floor')
        AVG_RTS=$(echo "$DATA" | jq '[.[].metrics.retweets] | add / length | floor')
        COUNT=$(echo "$DATA" | jq 'length')
        
        echo "$user,$AVG_LIKES,$AVG_RTS,$COUNT"
    fi
done

# Usage: ./engagement.sh > engagement.csv
SCRIPT
echo ""

# Archive tweets
echo "6. Archive Tweets to JSONL:"
echo ""
cat << 'SCRIPT'
#!/bin/bash
# archive.sh - Continuously archive tweets about a topic

TOPIC="$1"
ARCHIVE_FILE="archive-$(date +%Y%m%d).jsonl"

echo "Archiving tweets about: $TOPIC"
echo "Output: $ARCHIVE_FILE"

# Get current tweets
twitter-cli search "$TOPIC" --time 1h --limit 50 --json | jq -c '.[]' >> "$ARCHIVE_FILE"

echo "Archived $(wc -l < "$ARCHIVE_FILE") tweets"

# Usage: ./archive.sh "cryptocurrency"
# Run periodically via cron: */30 * * * * /path/to/archive.sh "crypto"
SCRIPT
echo ""

# Error handling
echo "7. Robust Error Handling:"
echo ""
cat << 'SCRIPT'
#!/bin/bash
# robust.sh - Script with proper error handling

set -e  # Exit on error

search_tweets() {
    local query="$1"
    local output
    
    if ! output=$(twitter-cli search "$query" --json 2>&1); then
        echo "Error searching for: $query" >&2
        echo "Details: $output" >&2
        return 1
    fi
    
    echo "$output"
}

# Use it
if results=$(search_tweets "AI agents"); then
    count=$(echo "$results" | jq 'length')
    echo "Found $count tweets"
else
    echo "Search failed, will retry later"
fi
SCRIPT
echo ""

echo "=== Pro Tips ==="
echo ""
echo "• Use --quiet for scripting (returns just URLs)"
echo "• Use --json | jq for structured data processing"
echo "• Add 2>/dev/null to suppress info messages"
echo "• Check exit codes for success/failure"
echo "• Cache results locally to avoid rate limits"
echo "• Run periodic jobs with cron"
