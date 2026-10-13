# Repository review: 13 October 2026

Reviewed by Codex (ChatGPT).

The review covered the extension modules, stylesheet, manifest, workflow, local test harness, bundled assets and repository instructions. README.md was excluded.

The original review used revision `875ee191cd825f58b0f547ac3b41a25fd0f1839c` (2.53.0). The affected save and agent queue functions were checked again at `e2adef1539d8380c78dcd062075852fce3181aca` (2.54.0); these findings still apply there. The source links below point to that second revision.

All three findings were reproduced in isolated Node checks using the extension code. Card persistence checks used SillyTavern's actual `writeExtensionField` and `deepMerge` functions, with simulated HTTP responses. Runtime behavior was not tested inside SillyTavern: server setup could not reach GitHub through the environment's proxy, and the installed Playwright package had no Chromium executable.

## 1. Deleted picture entries remain in character cards

**ChatGPT review: Bug: P2.** Removing a speaker's full-body picture or an emotion face deletes its entry from the in-memory NTR data. Saving through `writeExtensionField` merges the remaining data into the existing card instead of replacing it. An omitted object key therefore remains on disk. After reload, the old entry returns; if file cleanup deleted the uploaded picture, it points to a missing file.

Source: [index.js, card save](https://github.com/SepsisShock/NTR-Extension/blob/e2adef1539d8380c78dcd062075852fce3181aca/index.js#L4081), with the removals in [cast.js](https://github.com/SepsisShock/NTR-Extension/blob/e2adef1539d8380c78dcd062075852fce3181aca/cast.js#L701).

**Evidence:** Save a sprite and an emotion face, delete their keys in memory, then flush the card again. The saved card retains both keys under SillyTavern's merge behavior.

**Suggested fix:** Include explicit deletion markers for keys removed since the last saved snapshot, using SillyTavern's supported unset value. Preserve the clean in-memory data when the save helper synchronizes its payload. Avoid clearing the whole NTR field before an ordinary save: if the second request fails, that would erase the previously saved data. Keep writes to the same card in order.

**Check in SillyTavern:** Save a face and a full-body picture, reload to confirm they were saved, then remove both and reload again. Check the card's NTR data as well as the menu. Repeat with remote image links so missing-file cleanup cannot mask the problem.

## 2. Failed card saves are marked as successful

**ChatGPT review: Bug: P2.** When the merge endpoint returns an HTTP error, SillyTavern's `writeExtensionField` logs it without throwing. NTR then advances `cardSnap` as though the save succeeded. Another flush with the same data exits early, leaving the changes unsaved. Reloading loses them. The same path can also remove the legacy settings copy even though migration was not saved.

Source: [index.js, snapshot and migration update](https://github.com/SepsisShock/NTR-Extension/blob/e2adef1539d8380c78dcd062075852fce3181aca/index.js#L4082).

**Evidence:** Simulate an HTTP failure while saving a new background. Restore successful responses and flush again without editing the data. No second request occurs, and the saved card still lacks the change.

**Suggested fix:** Use a save path that reports success, such as the bulk helper's `updated` list where supported, or a checked response from the merge endpoint. Update the saved snapshot and remove migration backups only after confirmed success. Keep failed changes available for retry and show a clear save failure.

**Check in SillyTavern:** Make the merge endpoint return an error for one save, then restore it and retry. Confirm that the failed request does not advance the snapshot, that the retry reaches the server, and that reloading preserves the change. Also check that a failed migration keeps its old settings copy.

## 3. Queued agents can run in a different chat

**ChatGPT review: Bug: P2.** Several agents configured to run after a reply execute one after another. Their originating chat is not captured when they are queued; `aim` selects the chat only when each run starts. Switching from chat A to chat B while the first agent is running causes the remaining agents to read chat B and save results there, although chat A's reply queued them.

Source: [agents.js, enqueue](https://github.com/SepsisShock/NTR-Extension/blob/e2adef1539d8380c78dcd062075852fce3181aca/agents.js#L361) and [target selection](https://github.com/SepsisShock/NTR-Extension/blob/e2adef1539d8380c78dcd062075852fce3181aca/agents.js#L268).

**Evidence:** Queue two agents after a reply in A and hold the first response. Switch to B, then finish the first response. The second request contains B's messages and its result is saved on B's message.

**Suggested fix:** Capture the originating chat when a run is queued. Check it before starting the request and again after any wait for the main reply. Skip the run if the chat changed. Keep the existing checks that prevent saving a result onto an edited, removed or swiped message.

**Check in SillyTavern:** Configure two agents to run after replies and save their results. Trigger them in A, then switch to B before the first finishes. Confirm that no queued request reads B and no result is saved there. Repeat with Same as Chat while a run waits for the main reply, and with Run Again on an older message.

## Checks completed

- All nine extension JavaScript files passed module syntax checks.
- Both local browser-driver scripts and the shell harness passed syntax checks.
- All ten version values matched at 2.53.0 in the reviewed checkout.
- Manifest JavaScript and CSS entry points existed.
- Bundled image files and both SVGs passed format validation.
- A targeted check confirmed that imported emotion names were escaped in the avatar menu.

The isolated checks establish the failures above; the SillyTavern checks remain to be run before implementing or approving fixes.

**Review sign-off:** Codex (ChatGPT), 13 October 2026.
