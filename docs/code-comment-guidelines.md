# Source Code Comment Guidelines

Apply these guidelines only to source code comments. They're read only by LLMs, not humans.

1. Keep comments literal and succinct.
  - 3rd person if perspective is needed 
2. Skip what's obvious from the code.
  - It's *not* obvious if a LLM was mistaken about the code during a session.
3. Document non-obvious constraints or functions that would cause issues if not noted.
4. Leave out change history and chat context (like "changed X to Y", "moved to XYZ", or "per request").
5. State what the code guarantees (not might), with its conditions.
6. Use generic names if examples are needed, never ones from a real setup.
7. When renaming or changing something, search other files that mention it.
8. Don't assume existing comments are accurate or only concern one file; verify it against existing or surrounding code.
9. When an existing or new comment no longer applies, edit or delete it.