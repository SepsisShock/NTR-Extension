# Code comment guidelines

Code comments guide coding agents maintaining the source; UI copy guides people using the extension. Apply these guidelines only to code comments.

- Explain only non-obvious reasons, hidden constraints, or necessary workarounds.
- Do not describe what is already obvious from the code.
- Write for someone reading the current code without the diff or conversation.
- Do not record editing history or discussions; leave those for PRs. Document constraints when violating them would cause a problem; state what breaks if ignored.
- Verify comments against the code; do not assume existing comments are accurate.
- Update or remove comments when their explanation no longer applies.
- Use telegraphic style for code comments. Preserve enough detail for things to be clear.
- When in doubt, leave no comment.
