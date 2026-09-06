# Marketing Skills — Agent Instructions

## For All Agents (Claude Code, Codex CLI, OpenClaw)

This repository contains 44 specialist marketing skills (plus the `marketing-skills` router and the `video-content-strategist` plugin) organized into 8 pods (Content, SEO + AEO, CRO, Channels, Growth, Intelligence, Sales enablement, Marketing ops). All specialist skills live under `skills/`.

### How to Use

1. **Start with routing:** Read `skills/marketing-skills/SKILL.md` (or `skills/marketing-ops/SKILL.md`) — it has a routing matrix that maps user requests to the right skill.
2. **Check context:** If `.claude/product-marketing-context.md` exists, read it first. It has brand voice, personas, and competitive landscape.
3. **Load ONE skill:** Read only the specialist SKILL.md you need. Never bulk-load.

### Skill Map

- `skills/marketing-context/` — Run first to capture brand context
- `skills/marketing-skills/` — Directory + router (read this to know where to go)
- `skills/marketing-ops/` — Request routing matrix, campaign planning, channel selection
- `skills/content-production/` — Write content (blog posts, articles, guides)
- `skills/content-strategy/` — Plan what content to create
- `skills/aeo/` — Answer Engine Optimization (E-E-A-T scoring, schema injection, citation tracking across LLMs)
- `skills/seo-audit/` — Traditional SEO audit
- `skills/page-cro/` — Conversion rate optimization
- `skills/pricing-strategy/` — Pricing and packaging
- `skills/content-humanizer/` — Fix AI-sounding content
- `skills/x-twitter-growth/` — X/Twitter audience growth, tweet composing, competitor analysis
- `video-content-strategist/` — Video content strategy (sibling plugin, own `.claude-plugin/`)

### Python Tools

59 scripts, all stdlib-only. Run directly:
```bash
python3 skills/<skill>/scripts/<tool>.py [args]
```
No pip install needed. Scripts include embedded samples for demo mode (run with no args).

### Anti-Patterns

❌ Don't read all 44 SKILL.md files
❌ Don't skip `.claude/product-marketing-context.md` if it exists
❌ Don't use content-creator (deprecated → use content-production)
❌ Don't install pip packages for Python tools
