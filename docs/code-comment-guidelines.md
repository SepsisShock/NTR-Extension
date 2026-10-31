# Source Code Comment Guidelines

Apply these guidelines only to source code comments, which are read by AI agents only.

- Skip commenting on behavior already obvious from the code.
- Keep comments literal and succinct.
- Leave out change history and chat context (like "changed X to Y" or "per request"); that goes in PRs.
- Don't copy lists the code already has (menu items, labels, setting names, function names); they go stale when the code changes.
- State only what the code guarantees, including its conditions; if you can't state it exactly, leave it out.
- Use generic names in examples, never ones from a real setup.
- Document non-obvious constraints only when violating them would cause a problem. Explain what breaks if ignored.
- Verify existing comments in code you change against the code, rather than assuming they are accurate. When you rename or change something, also search other files for comments that mention it.
- When a comment no longer applies, shorten or delete it; don't add detail to make it accurate.
- When in doubt, leave no new source code comments.
