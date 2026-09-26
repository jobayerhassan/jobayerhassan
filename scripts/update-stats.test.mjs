import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStats, calculateStreaks, escapeXml, languageRepositories, renderLanguageCard, renderStatsCard } from './update-stats.mjs';

const now = new Date('2026-09-27T00:00:00Z');
const profile = { login: 'example', followers: 3 };
const repo = (name, properties = {}) => ({ name, owner: { login: 'example' }, stargazers_count: 1, ...properties });

test('empty accounts produce finite language output without inventing contributions', () => {
  const stats = buildStats({ ...profile, followers: 0 }, [], [], null, now);
  assert.equal(stats.publicRepos, 0);
  assert.equal(stats.stars, 0);
  assert.equal(stats.totalBytes, 0);
  assert.equal(stats.contributions, null);
  assert.deepEqual(stats.languages, []);
  assert.match(renderStatsCard(stats), /Data unavailable/);
  assert.match(renderLanguageCard(stats), /No language data available/);
  assert.doesNotMatch(renderLanguageCard(stats), /NaN|Infinity/);
});

test('language aggregation excludes forks, archives, private and profile repositories', () => {
  const repositories = [repo('example'), repo('fork', { fork: true }), repo('archived', { archived: true }),
    repo('private', { private: true }), repo('project'), repo('other', { owner: { login: 'someone-else' } })];
  assert.deepEqual(languageRepositories(repositories, 'EXAMPLE').map(item => item.name), ['project']);
  const stats = buildStats(profile, repositories, repositories.map(item => ({
    repository: item.name,
    languages: item.name === 'project' ? { C: 300, Python: 100 } : { SVG: 10000 },
  })), 0, now);
  assert.equal(stats.publicRepos, 4);
  assert.equal(stats.stars, 4);
  assert.equal(stats.contributions, 0);
  assert.equal(stats.languageRepositoryCount, 1);
  assert.equal(stats.totalBytes, 400);
  assert.deepEqual(stats.languages.map(item => [item.name, item.percent]), [['C', 75], ['Python', 25]]);
  assert.match(renderStatsCard(stats), /Past year/);
});

test('top five use all language bytes as denominator and reject invalid byte counts', () => {
  const stats = buildStats(profile, [repo('project')], [{ repository: 'project', languages: {
    A: 60, B: 50, C: 40, D: 30, E: 20, F: 10, bad: -1, invalid: NaN,
  } }], null, now);
  assert.equal(stats.languages.length, 5);
  assert.equal(stats.totalBytes, 210);
  assert.equal(stats.languages[0].percent, 60 / 210 * 100);
  assert.ok(stats.languages.reduce((sum, item) => sum + item.percent, 0) < 100);
});

test('XML special characters cannot inject markup into cards', () => {
  assert.equal(escapeXml(`<tag attr="x">&'</tag>`), '&lt;tag attr=&quot;x&quot;&gt;&amp;&apos;&lt;/tag&gt;');
  const stats = buildStats(profile, [repo('project')], [{ repository: 'project', languages: { '<script>&': 100 } }], null, now);
  const svg = renderLanguageCard(stats);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;&amp;/);
  assert.match(svg, /2026-09-27 00:00:00 UTC/);
  assert.match(svg, /<title/);
  assert.match(svg, /<desc/);
});

test('today with no contributions preserves a streak through yesterday UTC', () => {
  const days = [
    { date: '2026-09-24', contributionCount: 1 },
    { date: '2026-09-25', contributionCount: 2 },
    { date: '2026-09-26', contributionCount: 1 },
    { date: '2026-09-27', contributionCount: 0 },
  ];
  assert.deepEqual(calculateStreaks(days, now), { current: 3, longest: 3 });
  days[3].contributionCount = 1;
  assert.deepEqual(calculateStreaks(days, now), { current: 4, longest: 4 });
});

test('broken streak resets current count but retains longest calendar run', () => {
  const days = [
    { date: '2026-09-22', contributionCount: 1 },
    { date: '2026-09-23', contributionCount: 2 },
    { date: '2026-09-24', contributionCount: 1 },
    { date: '2026-09-25', contributionCount: 0 },
    { date: '2026-09-26', contributionCount: 0 },
    { date: '2026-09-27', contributionCount: 0 },
  ];
  assert.deepEqual(calculateStreaks(days, now), { current: 0, longest: 3 });
  assert.deepEqual(calculateStreaks([], now), { current: 0, longest: 0 });
});

test('missing dates break streaks, duplicate and future dates do not inflate them', () => {
  const days = [
    { date: '2026-09-24', contributionCount: 1 },
    { date: '2026-09-26', contributionCount: 2 },
    { date: '2026-09-26', contributionCount: 2 },
    { date: '2026-09-27', contributionCount: 1 },
    { date: '2026-09-28', contributionCount: 2 },
  ];
  assert.deepEqual(calculateStreaks(days, now), { current: 2, longest: 2 });
});
