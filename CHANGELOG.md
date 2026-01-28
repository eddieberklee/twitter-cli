# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-28

### Added
- Initial release 🎉
- `search` command with powerful filtering options
  - Time range filtering (1h, 24h, 7d, 30d)
  - Minimum likes/retweets filters
  - Verified accounts filter
  - Language filtering
  - Sort by recent, popular, or relevant
- `user` command to view a user's popular tweets
- `replies` command to view top replies to a tweet
- `config` command for managing API credentials
  - Interactive setup with `config init`
  - Get/set individual values
- `cache` command for managing cached data
  - Clear cache
  - View cache statistics
- Demo mode with realistic sample data (no API key required)
- Multiple output formats
  - Beautiful terminal output with colors and emoji
  - JSON export
  - CSV export
  - Quiet mode (URLs only)
- File-based caching to reduce API calls
- Rate limit tracking and display
- Comprehensive error handling with helpful messages
- Full TypeScript implementation
- Unit tests for core functionality

### Technical
- Built with Commander.js for CLI parsing
- Chalk for terminal colors
- Native Node.js https for API requests (zero HTTP dependencies)
- Jest for testing
- TypeScript strict mode enabled
