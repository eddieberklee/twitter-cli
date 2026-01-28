/**
 * Mock data generator for demo mode
 */

import type { Tweet, TwitterUser } from '../types/index.js';

const MOCK_USERS: TwitterUser[] = [
  { id: '1', username: 'elonmusk', name: 'Elon Musk', verified: true, followers_count: 170000000 },
  { id: '2', username: 'sama', name: 'Sam Altman', verified: true, followers_count: 3200000 },
  { id: '3', username: 'karpathy', name: 'Andrej Karpathy', verified: true, followers_count: 850000 },
  { id: '4', username: 'naval', name: 'Naval', verified: true, followers_count: 2100000 },
  { id: '5', username: 'paulg', name: 'Paul Graham', verified: true, followers_count: 1600000 },
  { id: '6', username: 'lexfridman', name: 'Lex Fridman', verified: true, followers_count: 3800000 },
  { id: '7', username: 'techcrunch', name: 'TechCrunch', verified: true, followers_count: 12400000 },
  { id: '8', username: 'anotheruser', name: 'Tech Enthusiast', verified: false, followers_count: 45000 },
];

const MOCK_TWEET_TEMPLATES = [
  { text: 'AI agents are going to change everything. The next generation of software will be autonomous and self-improving.', metrics: { likes: 45200, retweets: 12100, replies: 3400, views: 2100000 } },
  { text: 'Just shipped a major update. The feedback loop between building and learning is everything.', metrics: { likes: 18500, retweets: 2300, replies: 890, views: 650000 } },
  { text: 'The best time to start building was yesterday. The second best time is now. Stop planning, start doing.', metrics: { likes: 32100, retweets: 8900, replies: 1200, views: 1800000 } },
  { text: 'Hot take: Most "AI startups" are just wrappers around GPT-4. The real innovation is in the infrastructure layer.', metrics: { likes: 8900, retweets: 2100, replies: 780, views: 420000 } },
  { text: 'Simplicity is the ultimate sophistication. Ship the MVP, gather feedback, iterate. Repeat forever.', metrics: { likes: 15600, retweets: 3400, replies: 450, views: 890000 } },
  { text: 'The terminal is making a comeback. CLI tools are faster, scriptable, and composable. GUIs are overrated.', metrics: { likes: 6700, retweets: 1200, replies: 340, views: 280000 } },
  { text: 'Reading code is more important than writing code. You learn patterns, avoid mistakes, and understand systems deeply.', metrics: { likes: 12300, retweets: 2800, replies: 520, views: 560000 } },
  { text: 'Open source is eating the world. The best software is built in public by passionate communities.', metrics: { likes: 21400, retweets: 5600, replies: 980, views: 1200000 } },
  { text: "Working on something new. Can't share details yet but it's going to be transformative. Stay tuned.", metrics: { likes: 54000, retweets: 8200, replies: 4100, views: 3500000 } },
];

function generateMockId(): string {
  return Math.floor(Math.random() * 1000000000000000000).toString();
}

function randomDate(hoursAgo: number): Date {
  return new Date(Date.now() - Math.random() * hoursAgo * 60 * 60 * 1000);
}

function hashString(str: string): number {
  return str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function generateMockTweets(query: string, limit: number = 10, hoursAgo: number = 168): Tweet[] {
  const seed = hashString(query);
  const tweets: Tweet[] = [];
  const usedTemplates = new Set<number>();

  for (let i = 0; i < Math.min(limit, MOCK_TWEET_TEMPLATES.length); i++) {
    let templateIdx = (seed + i * 7) % MOCK_TWEET_TEMPLATES.length;
    while (usedTemplates.has(templateIdx) && usedTemplates.size < MOCK_TWEET_TEMPLATES.length) {
      templateIdx = (templateIdx + 1) % MOCK_TWEET_TEMPLATES.length;
    }
    usedTemplates.add(templateIdx);

    const template = MOCK_TWEET_TEMPLATES[templateIdx];
    const user = MOCK_USERS[(seed + i * 3) % MOCK_USERS.length];
    const tweetId = generateMockId();

    tweets.push({
      id: tweetId,
      text: template.text,
      author: user,
      created_at: randomDate(hoursAgo),
      metrics: { ...template.metrics },
      url: `https://twitter.com/${user.username}/status/${tweetId}`,
    });
  }

  return tweets.sort((a, b) => b.metrics.likes - a.metrics.likes);
}

export function generateMockReplies(tweetId: string, limit: number = 10): Tweet[] {
  const replyTemplates = [
    { text: 'This is absolutely right. Been saying this for years.', metrics: { likes: 450, retweets: 23, replies: 12, views: 8500 } },
    { text: "I disagree. Here's why...", metrics: { likes: 120, retweets: 8, replies: 45, views: 3200 } },
    { text: '🔥🔥🔥', metrics: { likes: 890, retweets: 12, replies: 5, views: 12000 } },
    { text: 'Can you elaborate on this point?', metrics: { likes: 67, retweets: 2, replies: 8, views: 1800 } },
    { text: 'Bookmarked. This is gold.', metrics: { likes: 234, retweets: 15, replies: 3, views: 4500 } },
    { text: 'The nuance here is important. Most people miss it.', metrics: { likes: 340, retweets: 28, replies: 18, views: 6200 } },
    { text: 'Hard agree. Building in public changed everything for me.', metrics: { likes: 156, retweets: 9, replies: 7, views: 2900 } },
    { text: "This didn't age well lol", metrics: { likes: 78, retweets: 4, replies: 22, views: 2100 } },
  ];

  const replies: Tweet[] = [];
  for (let i = 0; i < Math.min(limit, replyTemplates.length); i++) {
    const template = replyTemplates[i];
    const user = MOCK_USERS[(i + 3) % MOCK_USERS.length];
    const replyId = generateMockId();

    replies.push({
      id: replyId,
      text: template.text,
      author: user,
      created_at: randomDate(48),
      metrics: { ...template.metrics },
      url: `https://twitter.com/${user.username}/status/${replyId}`,
      in_reply_to_id: tweetId,
    });
  }

  return replies.sort((a, b) => b.metrics.likes - a.metrics.likes);
}

export function generateMockUserTweets(username: string, limit: number = 10): Tweet[] {
  const user = MOCK_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? {
    id: '999',
    username,
    name: username.charAt(0).toUpperCase() + username.slice(1),
    verified: false,
    followers_count: 1000,
  };

  const tweets: Tweet[] = [];
  for (let i = 0; i < Math.min(limit, MOCK_TWEET_TEMPLATES.length); i++) {
    const template = MOCK_TWEET_TEMPLATES[i];
    const tweetId = generateMockId();
    tweets.push({
      id: tweetId,
      text: template.text,
      author: user,
      created_at: randomDate(168),
      metrics: { ...template.metrics },
      url: `https://twitter.com/${user.username}/status/${tweetId}`,
    });
  }

  return tweets.sort((a, b) => b.metrics.likes - a.metrics.likes);
}
