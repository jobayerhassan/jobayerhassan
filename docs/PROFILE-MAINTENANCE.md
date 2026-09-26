# Profile maintenance

The profile is rendered from `README.md` in the public `jobayerhassan/jobayerhassan` repository. The banner lives in `assets/profile-banner.svg` and has no external image or font dependencies.

## Updating the profile

- Edit the banner's SVG text and shapes directly. Keep its `viewBox` and accessible title/description.
- Keep project descriptions and development status aligned with their repositories.
- Update contact links in both the introduction and contact section.
- Core skills and technologies being learned are intentionally separate.

## Contribution animation

The existing workflow was moved from `snake.yml` at the repository root to `.github/workflows/snake.yml`, where GitHub Actions can discover it. It runs daily at 00:17 UTC, on manual dispatch, and when its configuration changes on `main`.

After the changes reach `main`, check **Actions → Generate contribution animation**. A successful run publishes two SVG files to the `output` branch. It uses the repository's built-in `GITHUB_TOKEN`; no personal token is needed. Repository or organization policy must permit the job's `contents: write` permission.

The profile's main layout does not depend on a stats-image service or a first successful workflow run. To add the animation later, first confirm both files exist on the `output` branch, then insert this optional section into `README.md`:

```markdown
## Contribution activity

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/jobayerhassan/jobayerhassan/output/github-contribution-grid-snake-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/jobayerhassan/jobayerhassan/output/github-contribution-grid-snake.svg">
  <img alt="Animated view of my GitHub contribution activity" src="https://raw.githubusercontent.com/jobayerhassan/jobayerhassan/output/github-contribution-grid-snake.svg" width="100%">
</picture>
```

The layout uses standard GitHub Markdown and supported HTML, with one locally stored banner. The GitHub profile already shows native contribution activity below the README.

## Optional profile settings

These settings are changed separately from this repository:

- **Bio:** `CSE undergraduate at DIU | Building with C, C++ & Java | Exploring Python, NLP & practical software`
- **Pinned repositories:** ExamGuard-AI, DeliveryRoutePlanner, Smart-Store.
- **Repository description:** `My GitHub profile — projects, learning and collaboration.`
