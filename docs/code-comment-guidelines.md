# Source Code Comment Guidelines

Apply these guidelines only to source code comments. They're read only by LLMs, not humans.

1. Keep comments literal and succinct.
2. Skip what's obvious from the code, including lists of names it already has; they go stale.
3. Document non-obvious constraints only when violating them would cause a problem. Explain what breaks if ignored.
4. State only what the code guarantees, with its conditions; if unsure, leave it out.
5. Leave out change history and chat context (like "changed X to Y" or "per request"); that goes in PRs.
6. Use generic names in examples, never ones from a real setup.
7. Verify existing comments in code you change against the code, rather than assuming they are accurate.
8. When you rename or change something, search other files for comments that mention it.
9. When a comment no longer applies, shorten or delete it; don't add detail to make it accurate.
10. When in doubt, leave no new source code comments.
