#!/bin/bash
# Basic Twitter CLI Search Examples
# Run: chmod +x basic-search.sh && ./basic-search.sh

echo "=== Basic Search Examples ==="
echo ""

# Simple search
echo "1. Simple keyword search:"
echo "   twitter-cli search \"AI\""
echo ""

# With result limit
echo "2. Limit number of results:"
echo "   twitter-cli search \"machine learning\" --limit 5"
echo ""

# Time-based search
echo "3. Search within time range:"
echo "   twitter-cli search \"breaking news\" --time 1h    # Last hour"
echo "   twitter-cli search \"announcement\" --time 24h   # Last 24 hours"
echo "   twitter-cli search \"weekly roundup\" --time 7d  # Last week"
echo ""

# Sort by different criteria
echo "4. Sort results:"
echo "   twitter-cli search \"tech\" --sort popular  # Most liked (default)"
echo "   twitter-cli search \"tech\" --sort recent   # Most recent"
echo ""

# Language filter
echo "5. Filter by language:"
echo "   twitter-cli search \"hello\" --lang en    # English only"
echo "   twitter-cli search \"bonjour\" --lang fr  # French only"
echo ""

# Running some actual searches (demo mode works without API key)
echo "=== Live Demo ==="
echo ""

echo "Searching for 'technology'..."
twitter-cli search "technology" --limit 3

echo ""
echo "Searching for 'startup funding' in last 24h..."
twitter-cli search "startup funding" --time 24h --limit 3
