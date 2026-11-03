# Source Code Comment Guidelines

Apply these guidelines only to source code comments. They're read only by LLMs, not humans.

1. Keep comments literal and succinct.
2. Skip what's obvious from the code.
3. If an investigation was conducted and corrected a previous assumption, it might not be obvious.
4. Document and explain non-obvious constraints or functions only when ignoring or deleting them would cause issues.
5. State what the code guarantees (not might), with its conditions.
6. Leave out change history and chat context (like "changed X to Y" or "per request"); that goes in PRs.
7. Use generic names in examples, never ones from a real setup.
8. Verify existing code source comments against the code, rather than assuming they are accurate.
9. When renaming or changing something, search other files for comments that mention it.
10. When an existing or new comment no longer applies, edit or delete it.
11. When in doubt, leave no new source code comments.
