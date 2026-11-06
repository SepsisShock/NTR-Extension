# Source Code Comment Guidelines

Apply these guidelines only to source code comments. They're read only by LLMs, not humans.

1. Keep comments literal and succinct.
2. Skip what's obvious from the code.
3. If an investigation was conducted and corrected a previous assumption, it was NOT obvious!
4. Document and explain non-obvious constraints or functions only when ignoring or deleting them would cause issues.
5. State what the code guarantees (not might), with its conditions.
6. Leave out change history and chat context (like "changed X to Y" or "per request"); that goes in PRs.
7. Use generic names in examples, never ones from a real setup.
8. Verify existing code source comments against the code in files, rather than assuming they are accurate or only concern one file!
9. When renaming or changing something, search other files that mention it.
10. When an existing or new comment no longer applies, edit or delete it.
