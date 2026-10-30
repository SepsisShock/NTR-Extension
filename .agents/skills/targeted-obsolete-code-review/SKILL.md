---
name: targeted-obsolete-code-review
description: Use only when the user explicitly asks for a targeted obsolete-code review or OBCR1
---

Review the requested file for dead code, obsolete migration and compatibility logic, copied code, unnecessary guards, and outdated comments.

## Context

- Global settings are written by the menu (maxlength from `strMax`) or validated themes (`validLookValue`, `PICK_KEYS`, `STR_MAX`); resets write `DEFAULTS`; `loadSettings` fills missing keys and runs upgrades for older saves. Check whether module-level normalization, `String()` conversion, slicing, or validation is redundant under these paths.
- Check dynamic key construction (such as `'fg' + p`) before declaring settings unused.
- Potential dead-code signs include unread `DEFAULTS` keys, pick keys with one allowed value, `*Migrated`/`*Moved`/`*Checked` flags, "Before 2.x" comments, and comments describing obsolete labels or behavior. These are examples, not an exhaustive list.
- When removing saved data referencing files, account for cleanup in `loadSettings`, rather than only removing the associated code.
- Before removing or moving measurements, verify initialization order and what has loaded when the measurement runs.

## Output

Report findings with code evidence, why each item is unnecessary or outdated, and any compatibility or behavioral risks.
