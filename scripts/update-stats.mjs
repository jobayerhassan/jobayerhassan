import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.github.com';
const COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185'];

export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]);
}

export function languageRepositories(repositories, username) {
  return repositories.filter(repo => !repo.private && !repo.fork && !repo.archived
    && repo.owner?.login?.toLowerCase() === username.toLowerCase()
    && repo.name.toLowerCase() !== username.toLowerCase());
}

export function calculateStreaks(days, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const dayMilliseconds = 86_400_000;
  const dated = [...new Map(days
    .filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && day.date <= today)
    .map(day => [day.date, day])).values()].sort((a, b) => a.date.localeCompare(b.date));
  const active = new Set(dated.filter(day => day.contributionCount > 0).map(day => day.date));
  let longest = 0;
  let run = 0;
  let previous = null;
  for (const day of dated) {
    const timestamp = Date.parse(`${day.date}T00:00:00Z`);
    run = day.contributionCount > 0 ? (previous !== null && timestamp - previous === dayMilliseconds ? run + 1 : 1) : 0;
    longest = Math.max(longest, run);
    previous = timestamp;
  }
  let cursor = Date.parse(`${today}T00:00:00Z`);
  if (!active.has(today)) cursor -= dayMilliseconds;
  let current = 0;
  while (active.has(new Date(cursor).toISOString().slice(0, 10))) {
    current++;
    cursor -= dayMilliseconds;
  }
  return { current, longest };
}

export function buildStats(profile, repositories, languageResults, contributions = null, now = new Date(), streaks = null) {
  const ownedPublic = repositories.filter(repo => !repo.private
    && repo.owner?.login?.toLowerCase() === profile.login.toLowerCase());
  const eligible = new Set(languageRepositories(repositories, profile.login).map(repo => repo.name));
  const byteTotals = new Map();
  for (const { repository, languages } of languageResults) {
    if (!eligible.has(repository)) continue;
    for (const [language, bytes] of Object.entries(languages)) {
      if (Number.isFinite(bytes) && bytes > 0) byteTotals.set(language, (byteTotals.get(language) ?? 0) + bytes);
    }
  }
  const totalBytes = [...byteTotals.values()].reduce((total, bytes) => total + bytes, 0);
  const languages = [...byteTotals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([name, bytes], index) => ({ name, bytes, percent: bytes / totalBytes * 100, color: COLORS[index] }));
  return {
    username: profile.login,
    publicRepos: ownedPublic.length,
    stars: ownedPublic.reduce((total, repo) => total + (repo.stargazers_count ?? 0), 0),
    followers: profile.followers,
    contributions: Number.isInteger(contributions) && contributions >= 0 ? contributions : null,
    currentStreak: Number.isInteger(streaks?.current) ? streaks.current : null,
    longestStreak: Number.isInteger(streaks?.longest) ? streaks.longest : null,
    languages,
    totalBytes,
    languageRepositoryCount: eligible.size,
    timestamp: now.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC'),
  };
}

function shell(title, description, height, contents) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="${height}" viewBox="0 0 850 ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">${escapeXml(description)}</desc>
  <rect x=".5" y=".5" width="849" height="${height - 1}" rx="18" fill="#0d1117" stroke="#30363d"/>
  <path d="M25 1H260" stroke="#38bdf8" stroke-width="2"/>
  <path d="M590 1H825" stroke="#a78bfa" stroke-width="2"/>
  <g font-family="Segoe UI, Arial, sans-serif">${contents}</g>
</svg>
`.replace(/[ \t]+$/gm, '');
}

const number = value => new Intl.NumberFormat('en-US').format(value);

export function renderStatsCard(stats) {
  const available = stats.contributions !== null;
  const streakAvailable = stats.currentStreak !== null && stats.longestStreak !== null;
  const description = `${stats.username}: ${stats.publicRepos} public repositories, ${stats.stars} repository stars, ${stats.followers} followers. ${available ? `${stats.contributions} contributions in the past year.` : 'Contribution data unavailable.'} ${streakAvailable ? `Current streak: ${stats.currentStreak} days; longest streak in the past year: ${stats.longestStreak} days. Current streak may end today or yesterday UTC.` : 'Streak data unavailable.'} Updated ${stats.timestamp}.`;
  return shell('GitHub activity — ' + stats.username, description, 414, `
    <text x="30" y="37" fill="#38bdf8" font-size="11" font-weight="700" letter-spacing="2.4">GITHUB / BY THE NUMBERS</text>
    <text x="30" y="73" fill="#e6edf3" font-size="25" font-weight="700">A little progress, every day.</text>
    <path d="M283 120V269M567 120V269" stroke="#21262d"/>
    <text x="142" y="182" text-anchor="middle" fill="#38bdf8" font-size="43" font-weight="700">${available ? number(stats.contributions) : '—'}</text>
    <text x="142" y="216" text-anchor="middle" fill="#e6edf3" font-size="17" font-weight="600">Contributions</text>
    <text x="142" y="240" text-anchor="middle" fill="#8b949e" font-size="13">${available ? 'Past year' : 'Data unavailable'}</text>
    <circle cx="425" cy="185" r="62" fill="#111923" stroke="#253243" stroke-width="7"/>
    ${streakAvailable ? '<circle cx="425" cy="185" r="62" fill="none" stroke="#38bdf8" stroke-width="7" stroke-dasharray="250 140" stroke-linecap="round" transform="rotate(-90 425 185)"/><circle cx="425" cy="185" r="62" fill="none" stroke="#a78bfa" stroke-width="7" stroke-dasharray="104 286" stroke-dashoffset="-265" stroke-linecap="round" transform="rotate(-90 425 185)"/>' : ''}
    <text x="425" y="192" text-anchor="middle" fill="#e6edf3" font-size="43" font-weight="700">${streakAvailable ? number(stats.currentStreak) : '—'}</text>
    <text x="425" y="216" text-anchor="middle" fill="#8b949e" font-size="11" letter-spacing="1">${streakAvailable ? 'DAYS · UTC' : 'UNAVAILABLE'}</text>
    <text x="425" y="280" text-anchor="middle" fill="#38bdf8" font-size="17" font-weight="600">Current streak</text>
    <text x="708" y="182" text-anchor="middle" fill="#a78bfa" font-size="43" font-weight="700">${streakAvailable ? number(stats.longestStreak) : '—'}</text>
    <text x="708" y="216" text-anchor="middle" fill="#e6edf3" font-size="17" font-weight="600">Longest streak</text>
    <text x="708" y="240" text-anchor="middle" fill="#8b949e" font-size="13">${streakAvailable ? 'Days · past year' : 'Data unavailable'}</text>
    <path d="M30 304H820" stroke="#21262d"/>
    <text x="142" y="338" text-anchor="middle" fill="#e6edf3" font-size="15"><tspan font-weight="700" fill="#38bdf8">${number(stats.publicRepos)}</tspan>  Public repos</text>
    <text x="425" y="338" text-anchor="middle" fill="#e6edf3" font-size="15"><tspan font-weight="700" fill="#a78bfa">${number(stats.stars)}</tspan>  Repository stars</text>
    <text x="708" y="338" text-anchor="middle" fill="#e6edf3" font-size="15"><tspan font-weight="700" fill="#38bdf8">${number(stats.followers)}</tspan>  Followers</text>
    <text x="30" y="372" fill="#8b949e" font-size="11">GitHub API · Current streak can end today or yesterday UTC · Streaks use the past-year calendar</text>
    <text x="30" y="396" fill="#8b949e" font-size="11">Public repository counts · Refreshed daily</text>
    <text x="820" y="396" text-anchor="end" fill="#8b949e" font-size="11">Updated ${escapeXml(stats.timestamp)}</text>`);
}

export function renderLanguageCard(stats) {
  const rows = stats.languages.map((language, index) => {
    const y = 117 + index * 43;
    return `
    <circle cx="35" cy="${y - 5}" r="4" fill="${language.color}"/>
    <text x="48" y="${y}" fill="#e6edf3" font-size="15" font-weight="600">${escapeXml(language.name)}</text>
    <rect x="230" y="${y - 13}" width="505" height="10" rx="5" fill="#21262d"/>
    <rect x="230" y="${y - 13}" width="${(505 * language.percent / 100).toFixed(2)}" height="10" rx="5" fill="${language.color}"/>
    <text x="820" y="${y}" text-anchor="end" fill="${language.color}" font-size="14" font-weight="600">${language.percent.toFixed(1)}%</text>`;
  }).join('');
  const height = Math.max(270, 185 + stats.languages.length * 43);
  const footer = height - 66;
  const description = stats.languages.length
    ? `Top languages by code bytes across ${stats.languageRepositoryCount} public, original, non-archived repositories, excluding the profile repository. ${stats.languages.map(language => `${language.name}: ${language.percent.toFixed(1)} percent`).join('; ')}. Language share is not a measure of proficiency. Updated ${stats.timestamp}.`
    : `No code-language data found in eligible public repositories. Updated ${stats.timestamp}.`;
  return shell('Languages in my repositories', description, height, `
    <text x="30" y="37" fill="#a78bfa" font-size="11" font-weight="700" letter-spacing="2.4">CODE / LANGUAGE MIX</text>
    <text x="30" y="73" fill="#e6edf3" font-size="25" font-weight="700">Languages in my repositories.</text>
    ${rows || '<text x="30" y="124" fill="#8b949e" font-size="16">No language data available yet.</text>'}
    <path d="M30 ${footer - 17}H820" stroke="#21262d"/>
    <text x="30" y="${footer + 5}" fill="#8b949e" font-size="12">Top ${stats.languages.length} by code-byte share · ${stats.languageRepositoryCount} eligible repositories · Not a proficiency score</text>
    <text x="30" y="${height - 23}" fill="#8b949e" font-size="11">Excludes forks, archives and this profile</text>
    <text x="820" y="${height - 23}" text-anchor="end" fill="#8b949e" font-size="11">Updated ${escapeXml(stats.timestamp)}</text>`);
}

async function requestJson(endpoint, token, options = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'jobayerhassan-profile-stats',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`GitHub API request failed (HTTP ${response.status}).`);
  return response.json();
}

export async function fetchProfileStats(username, token) {
  const profile = await requestJson(`/users/${username}`, token);
  const repositories = [];
  for (let page = 1; ; page++) {
    const batch = await requestJson(`/users/${username}/repos?type=owner&per_page=100&page=${page}`, token);
    if (!Array.isArray(batch)) throw new Error('GitHub returned an invalid repository list.');
    repositories.push(...batch);
    if (batch.length < 100) break;
  }
  const queue = languageRepositories(repositories, profile.login);
  const languages = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, queue.length) }, async () => {
    while (next < queue.length) {
      const repository = queue[next++];
      const data = await requestJson(`/repos/${username}/${encodeURIComponent(repository.name)}/languages`, token);
      languages.push({ repository: repository.name, languages: data });
    }
  }));
  let contributions = null;
  let streaks = null;
  const now = new Date();
  if (token) {
    try {
      const result = await requestJson('/graphql', token, {
        method: 'POST',
        body: JSON.stringify({
          query: 'query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }',
          variables: { login: username },
        }),
      });
      const calendar = result.data?.user?.contributionsCollection?.contributionCalendar;
      const count = calendar?.totalContributions;
      if (result.errors?.length || !Number.isInteger(count) || !Array.isArray(calendar.weeks)) throw new Error('Contribution response unavailable.');
      contributions = count;
      streaks = calculateStreaks(calendar.weeks.flatMap(week => week.contributionDays), now);
    } catch {
      console.warn('Contribution data unavailable; the card will show an unavailable state.');
    }
  }
  return buildStats(profile, repositories, languages, contributions, now, streaks);
}

async function main() {
  const args = process.argv.slice(2);
  let outputDir = fileURLToPath(new URL('../assets/', import.meta.url));
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output-dir' && args[i + 1]) outputDir = path.resolve(args[++i]);
    else throw new Error('Usage: node scripts/update-stats.mjs [--output-dir DIRECTORY]');
  }
  const username = process.env.GITHUB_USERNAME || process.env.GITHUB_REPOSITORY_OWNER || 'jobayerhassan';
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username)) throw new Error('Invalid GitHub username.');
  const stats = await fetchProfileStats(username, process.env.GITHUB_TOKEN);
  // Finish all API reads before replacing the last successful assets.
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'github-stats.svg'), renderStatsCard(stats));
  await writeFile(path.join(outputDir, 'top-languages.svg'), renderLanguageCard(stats));
  console.log(`Updated cards for ${stats.username}: ${stats.publicRepos} public repos, ${stats.languages.length} displayed languages.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
