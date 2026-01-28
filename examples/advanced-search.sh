#!/bin/bash
# Advanced Twitter CLI Search Examples
# Run: chmod +x advanced-search.sh && ./advanced-search.sh

echo "=== Advanced Search Examples ==="
echo ""

# Engagement filters
echo "1. Filter by engagement:"
echo "   twitter-cli search \"AI\" --min-likes 1000      # At least 1K likes"
echo "   twitter-cli search \"AI\" --min-retweets 500    # At least 500 RTs"
echo "   twitter-cli search \"AI\" --min-likes 100 --min-retweets 50  # Both"
echo ""

# Verified accounts only
echo "2. Verified accounts only:"
echo "   twitter-cli search \"crypto\" --verified"
echo "   twitter-cli search \"politics\" --verified --time 24h"
echo ""

# Combined filters for high-quality results
echo "3. Power combos (find viral tweets):"
echo ""
echo "   # Viral AI tweets from last week"
echo "   twitter-cli search \"artificial intelligence\" \\"
echo "     --time 7d --min-likes 5000 --verified --limit 10"
echo ""
echo "   # Breaking tech news (high engagement, recent)"
echo "   twitter-cli search \"breaking OR announced OR launching\" \\"
echo "     --time 1h --min-likes 100 --sort recent"
echo ""
echo "   # Quality startup discussions"
echo "   twitter-cli search \"YC OR Y Combinator\" \\"
echo "     --verified --min-retweets 20 --time 7d"
echo ""

# User timeline
echo "4. Browse user timelines:"
echo "   twitter-cli user elonmusk --limit 10"
echo "   twitter-cli user sama --limit 5"
echo "   twitter-cli user karpathy --limit 20"
echo ""

# View replies
echo "5. View tweet replies:"
echo "   # First, find a tweet's URL or ID, then:"
echo "   twitter-cli replies 1234567890123456789 --limit 20"
echo ""

# Quiet mode for scripting
echo "6. Get just URLs (for piping):"
echo "   twitter-cli search \"tech\" --quiet"
echo "   twitter-cli user naval --quiet --limit 5"
echo ""

echo "=== Live Demo ==="
echo ""

echo "Finding viral AI tweets with 1000+ likes..."
twitter-cli search "AI" --min-likes 1000 --limit 3

echo ""
echo "Verified accounts discussing startups..."
twitter-cli search "startup" --verified --limit 3
