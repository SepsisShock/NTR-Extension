# agents.js cleancom audit

- Reviewed commit: `46266a1b1ee6c0b699dd11e7752d7db664e002a2` (`main`).
- Scope: `agents.js`, with core and Layout integration inspected.
- Skill: [cleancom](../.agents/skills/cleancom/SKILL.md).
- Purpose: record findings for follow-up implementation.

## Findings

### 1. Uploaded picture is not cleaned up after agent deletion

Source: [agents.js:1814](https://github.com/SepsisShock/NTR-Extension/blob/46266a1b1ee6c0b699dd11e7752d7db664e002a2/agents.js#L1814).

**ChatGPT review: Bug:** If an agent is deleted while its picture upload is in progress, the upload completion still calls setPic with the captured agent object. setPic assigns the new path to that removed object and only checks the old picture for deletion. The new upload remains on disk without an agent referencing it.

Suggested follow-up: Before applying an upload result, check that the same agent object is still in list(). If it has been removed, pass the new upload to deleteFileIfUnused instead.

Validation: An isolated check of the actual setPic function with an agent absent from the current list assigned the new path to the discarded object and called cleanup only for the old path. The complete browser upload/delete flow was not exercised.

### 2. Canceled chat waits retain their timer and waiter

Source: [agents.js:529](https://github.com/SepsisShock/NTR-Extension/blob/46266a1b1ee6c0b699dd11e7752d7db664e002a2/agents.js#L529).

**ChatGPT review: Cleanup:** When a Same as Chat run waiting in chatIdle is stopped, abortable rejects its wrapper but does not cancel the underlying chatIdle wait. Its five-minute timer and waiters entry remain until generation ends. If the timer expires first, its waiters entry still remains until genEnded clears the array.

Suggested follow-up: Make chatIdle cancellation remove its own waiter and clear its timer; also remove the waiter when the timer expires.

Validation: With the real chatIdle and abortable functions and mocked timers, canceling the wrapper returned Stopped while one waiter and a 300000 ms timer remained.

### 3. Saved-results comment describes the wrong target for targeted runs

Source: [agents.js:309](https://github.com/SepsisShock/NTR-Extension/blob/46266a1b1ee6c0b699dd11e7752d7db664e002a2/agents.js#L309).

**ChatGPT review: Cleanup:** The Saved results comment says an answer is saved on the message that was newest when the run started. enqueue and aim also support a specific message through at, including Run Again on an older result and message-triggered jobs that waited in the queue.

Suggested follow-up: Describe saving on the run's target message, using the newest message at execution time only when at is null.

Validation: Checked enqueue, aim, keep, and the Pinned Block Run Again handler by code inspection.

### 4. Since Its Last Result comment includes a message the code excludes

Source: [agents.js:549](https://github.com/SepsisShock/NTR-Extension/blob/46266a1b1ee6c0b699dd11e7752d7db664e002a2/agents.js#L549).

**ChatGPT review: Cleanup:** The readMsgs comment says Since Its Last Result reads from its last result on. sinceFrom returns r.mes + 1, so the message holding that result is excluded.

Suggested follow-up: Change the comment to say that reading starts after the message holding the last result, subject to the context limit.

Validation: An isolated check of the real readMsgs and sinceFrom functions returned only the message after the prior result; the message holding that result was excluded.

## Validation limits

No naming, old-reference, loading-order, or duplicate-initialization issues were found.
The isolated checks used extracted or instrumented production functions with browser, API, and timer stubs. They do not establish SillyTavern runtime behavior.
Runtime behavior was not tested in SillyTavern. The repository test suite was not run for this documentation-only PR.
No JavaScript or CSS changes are included; no version bump is required.
