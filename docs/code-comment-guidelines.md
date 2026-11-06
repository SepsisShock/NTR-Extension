# Source Code Comment Guidelines

Apply these guidelines only to source code comments. They're read only by LLMs, not humans.

1. Keep comments literal and succinct.
2. Skip what's obvious from the code.
3. If an investigation was conducted during a session and corrected a previous assumption, it was ambiguous.
4. Document and explain non-obvious constraints or functions that would cause issues if not noted.
5. State what the code guarantees (not might), with its conditions.
6. Leave out change history and chat context (like "changed X to Y" or "per request"); that goes in PRs.
7. Use generic names if examples are needed, never ones from a real setup.
9. When renaming or changing something, search other files that mention it.
10. Don't assume existing comments are accurate or only concern one file; verify it against existing or surrounding code.
11. When an existing or new comment no longer applies, edit or delete it.
