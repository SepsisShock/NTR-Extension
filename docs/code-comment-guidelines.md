# Source Code Comment Guidelines

Apply these guidelines only to source code comments; intended for AI agents, not humans:

- Skip commenting on behavior already obvious from the code.
- Keep comments literal and succinct.
- Write for agents reading the current code; leave diff or conversations for PRs.
- Document non-obvious constraints only when violating them would cause a problem. Explain what breaks if ignored.
- Verify existing comments against the code rather than assuming they are accurate.
- Update or remove comments when their explanations no longer apply.
- When in doubt, leave no new source code comments.