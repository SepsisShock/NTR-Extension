# Source Code Comment Guidelines

Apply these guidelines only to source code comments. They're read only by LLMs, not humans.

1. Keep comments literal and succinct.
2. Skip what's obvious from the code.
3. It's not obvious if a LLM was wrong about the code during a session.
4. Document and explain non-obvious constraints or functions that would cause issues if not noted.
5. State what the code guarantees (not might), with its conditions.
6. Leave out change history and chat context (like "changed X to Y", "moved to XYZ", or "per request"); that goes in PRs.
7. Use generic names if examples are needed, never ones from a real setup.
8. When renaming or changing something, search other files that mention it.
9. Don't assume existing comments are accurate or only concern one file; verify it against existing or surrounding code.
10. When an existing or new comment no longer applies, edit or delete it.