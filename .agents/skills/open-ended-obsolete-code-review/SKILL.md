---
name: open-ended-obsolete-code-review
description: Use only when the user explicitly asks for an open-ended obsolete-code review or OBCR2.
---

Review the requested file for obsolete, redundant, or unnecessary code based on what the implementation actually does. Investigate potential issues without restricting the review to predefined categories or examples.

Report findings with code evidence, why each item is unnecessary or outdated, and any compatibility or behavioral risks.

For each redundancy claim, name the case the code handles and the evidence that the case can't occur now (callers, writers, defaults). Mark the claim unverified if either is missing.
