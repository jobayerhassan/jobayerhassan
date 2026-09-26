# Profile maintenance

The public profile is rendered from `README.md` in `jobayerhassan/jobayerhassan`. The banner, typing strip, contact buttons, technology icons and statistics cards are stored in this repository.

## Visual assets

- `assets/profile-banner.svg`: animated cyan/violet hero, with a static reduced-motion presentation.
- `assets/typing.svg`: rotating developer introduction; reduced motion shows a complete static line.
- `assets/badges/`: email, LinkedIn and projects buttons. Their actual destinations are the surrounding links in the README.
- `assets/icons/`: recognizable technology logos, grouped by core skills, learning and collaboration.
- [Asset credits](ASSET-CREDITS.md): icon sources and license.

Edit SVG text and shapes directly. Keep accessible titles/descriptions, image alt text and viewBoxes. No external fonts, icon APIs, visitor counters or public stats-image services are required.

## Daily GitHub statistics

`.github/workflows/profile-stats.yml` runs daily at 00:43 UTC, on manual dispatch, and when the generator, its tests or the workflow changes on `main`. It tests the generator, fetches GitHub data and commits only these generated files:

- `assets/github-stats.svg`
- `assets/top-languages.svg`

The workflow uses the built-in `GITHUB_TOKEN` and a job-scoped `contents: write` permission. It does not require a personal token. Automatic updates are attributed to `github-actions[bot]`.

Statistics are labelled according to their source:

- Repository and star counts cover owned public repositories; follower counts come from the public profile.
- Contributions and streaks use GitHub's past-year contribution calendar. The current streak may end today or yesterday in UTC; the longest streak is limited to that calendar, not all time.
- Languages are measured by source-code bytes in original public, non-archived repositories. Forks and the profile repository are excluded. This is not a proficiency score.
- If contribution data cannot be fetched, its numbers display as unavailable, never invented zeroes. Every card includes its update timestamp.

Run locally from the repository:

```sh
node --test scripts/update-stats.test.mjs
node scripts/update-stats.mjs
```

Node.js 22+ is used by the workflow. Local runs can fetch public REST statistics without credentials. Contributions require an authorized `GITHUB_TOKEN` supplied by the execution environment; never paste a token into a source file or chat. `GITHUB_USERNAME` selects the account, and `--output-dir DIRECTORY` selects an alternate output folder. With no overrides, the account is `jobayerhassan` and the output is `assets/`.

## Contribution animation

`.github/workflows/snake.yml` runs daily at 00:17 UTC, manually, and when its configuration changes on `main`. It publishes light and dark SVGs to the `output` branch. The README's picture element selects the appropriate animation for the reader's theme.

Check **Actions → Generate contribution animation** if it stops updating. The last successful output remains visible. Keep the output filenames aligned with the README URLs.

## Content upkeep

Keep featured-project descriptions aligned with their actual development status. Keep core skills separate from technologies being learned. Contact links appear near the top and bottom of the README; update both locations together.

Optional profile settings, managed separately from this repository:

- **Bio:** `CSE undergraduate at DIU | Building with C, C++ & Java | Exploring Python, NLP & practical software`
- **Pinned repositories:** ExamGuard-AI, DeliveryRoutePlanner, Smart-Store.
