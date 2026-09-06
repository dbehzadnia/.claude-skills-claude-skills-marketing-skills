# Marketing Skills

A standalone Claude Code plugin: 44 production-ready marketing skills across 8 pods — Content, SEO + AEO, CRO, Channels, Growth, Intelligence, Sales enablement, and Ops — plus the `video-content-strategist` companion plugin and 59 stdlib-only Python tools (no pip installs needed).

Extracted from [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) (`marketing-skill/`) for standalone install, under the original MIT license (see [LICENSE](LICENSE)). All credit for the skill content goes to [Alireza Rezvani](https://alirezarezvani.com).

## Install

This repo is its own marketplace, so it installs directly:

```bash
# Add this repo as a marketplace
/plugin marketplace add dbehzadnia/.claude-skills-claude-skills-marketing-skills

# Install the plugin
/plugin install marketing-skills@marketing-skills-marketplace
```

## What's included

- `skills/marketing-skills/` — directory + router, start here to find the right skill
- `skills/marketing-ops/` — routing matrix for ambiguous requests
- `skills/marketing-context/` — run first to capture brand/product context
- 44 specialist skills spanning content, SEO/AEO, CRO, channels, growth, and intelligence (see the [route table](skills/marketing-skills/SKILL.md#route-table) for the full list)
- `video-content-strategist/` — sibling plugin for video content strategy

## Usage

1. First run: load `skills/marketing-context/` to create `.claude/product-marketing-context.md`. Every other skill reads it for brand voice, personas, and competitive landscape.
2. Know your task? Check the [route table](skills/marketing-skills/SKILL.md#route-table) and load only that skill's `SKILL.md`.
3. Ambiguous request? Load `skills/marketing-ops/` — its routing matrix maps phrasings to skills.
4. Load one specialist skill per task — never bulk-load.

Python tools ship per-skill under `skills/<skill>/scripts/`; run with `python3 skills/<skill>/scripts/<tool>.py --help`. All are stdlib-only.

See [CLAUDE.md](CLAUDE.md) for full agent instructions.
