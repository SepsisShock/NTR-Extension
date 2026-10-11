# Repository review report

Reviewed on 2026-10-11 against `main` at [`a965f5454acf7f1e07a985dd3b17ff547d24b99a`](https://github.com/SepsisShock/NTR-Extension/commit/a965f5454acf7f1e07a985dd3b17ff547d24b99a), version 2.35.0.

This report contains findings and suggested fixes only. No implementation changes are included. README is unchanged.

## Scope and verification

The source review covered all eight runtime modules (`index.js`, `vn.js`, `map.js`, `opening.js`, `preview.js`, `reader.js`, `regex.js`, and `agents.js`), shared CSS, the manifest, CI workflow, and bundled development tooling. Repository instructions and the recent Agents PR description and review discussion were checked. Findings already resolved in that discussion are not repeated.

Checks performed:

- All eight runtime modules passed `node --check` as ES modules.
- The bundled `driver.cjs` and `bench.cjs` passed `node --check`; `st.sh` passed `bash -n`.
- The manifest and tooling settings parsed as JSON; both root SVG files parsed as XML.
- Isolated Node VM checks exercised the actual core, VN, and Agents source. Page startup was suppressed, internal functions were exposed in memory, and SillyTavern context, persistence, model requests, and file deletion were stubbed. No real model calls, card writes, or file deletions occurred.
- The existing CI version-check code was executed against disposable copies with each omitted module's version changed separately.

SillyTavern was not run. The isolated checks confirm the stated code behavior, but UI and host integration still need testing in SillyTavern. A headless browser attempt was blocked by a sandbox `setsockopt` restriction before page startup, so the map styling finding is marked **Verify**. Static asset checks do not establish visual correctness. This review does not claim that all possible defects have been found.

## Findings

P1 means high priority because subsequent user data can be lost. P2 means a functional defect. P3 means cleanup or maintenance work. These priorities are suggested, not release decisions.

| ID | Priority | Status | Finding |
| --- | --- | --- | --- |
| 1 | P1 | Bug, isolated reproduction | Failed data removal leaves card saving disabled |
| 2 | P2 | Bug, isolated reproduction | An array as the card's NTR storage silently loses edits |
| 3 | P2 | Bug, isolated reproduction | Agents capture chat context before waiting for a reply |
| 4 | P2 | Bug, isolated reproduction | Deleting an agent does not cancel its waiting request |
| 5 | P2 | Bug, isolated reproduction | Long location names are parsed but lost from scene history |
| 6 | P3 | Bug, isolated reproduction | Uploaded book and agent pictures bypass cleanup |
| 7 | P3 | Bug, workflow reproduction | CI omits three module versions from its consistency check |
| 8 | P2 | Verify, source evidence | Map marker styles also match Pinned Blocks |
| 9 | P2 | Security/privacy, isolated reproduction | Card media bypasses SillyTavern's external-media block |
| 10 | P2 | Verify, credential forwarding traced | Agent endpoints can receive a key saved for another server |

### 1. ChatGPT review: Bug: Failed data removal leaves card saving disabled

**Location:** [index.js:4615](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L4615), [flushCard:4553](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L4553), and [removal error handler:5199](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L5199).

**Trigger and impact:** Start Remove NTR data with character data selected, then encounter a rejected lazy-card load or a thrown persistence error. `removeData` sets `wiping = true` and cancels pending card timers before either operation. Only the specific bulk-save `missed` branch resets the flag. Other exceptions reach the UI error handler, which returns without reloading or restoring the flag. Every later `flushCard` returns immediately, so subsequent card edits appear to work but are not saved until the page is reloaded.

**Evidence:** A stubbed `unshallowCharacter` rejected. After catching that error, changing a foreground path and calling the actual `flushCard` produced **zero** card writes. The same edit without the removal failure produced **one** write as a control.

**Suggested fix:** Restore the save state on every failed removal path and account for canceled pending flushes. Retain the intentional save freeze only after successful removal while waiting for the reload.

**Host check:** Force a lazy-card load failure during removal, dismiss the error, change card art, and reload. Confirm that the new art was persisted.

### 2. ChatGPT review: Bug: An array as the card's NTR storage silently loses edits

**Location:** [cleanStore:4444](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L4444) and [cardData:4464](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L4464).

**Trigger and impact:** Import a malformed card with `data.extensions.ntr = []`, then edit its foreground or VN data. `cleanStore` rejects arrays for cleaning but returns the array unchanged. `cardData` accepts it because `typeof []` is `"object"`. Later code adds named properties such as `fg` to the array. JSON serialization drops those properties, and the saved snapshot can remain unchanged, silently losing the edits.

**Evidence:** With `ntr = []`, the actual foreground helper accepted a new image path. The returned store was still an array, and `JSON.stringify(store)` was exactly `"[]"` despite the in-memory foreground property.

**Suggested fix:** Require the existing `isObj` predicate for the NTR root and its extensions container. Normalize invalid containers before taking the persistence snapshot.

**Host check:** Import such a card, set foreground art, reload, and verify both valid object storage and retained art.

### 3. ChatGPT review: Bug: Agents capture chat context before waiting for a reply

**Location:** [agents.js:110](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/agents.js#L110) and [shared-server wait:136](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/agents.js#L136).

**Trigger and impact:** Press Run Now on a Same as Chat agent while a chat reply is generating. The agent correctly waits for chat generation to finish, but `prompt(a, test)` already captured the chat. Its request therefore uses context from before the wait, omitting the finished reply or retaining only its partial text. Text Completion agents sharing the chat server use the same ordering.

**Evidence:** The actual call function was started while `chatBusy` was true. A finished character reply was appended before `genEnded` released the wait. The captured `generateRaw` request did not contain that reply.

**Suggested fix:** Build the prompt after the idle wait and eligibility check, immediately before issuing the request. Preserve the immediate path for connections that do not need that wait.

**Host check:** Start a long reply, press Run Now during streaming, and inspect the agent's request context after the reply completes.

### 4. ChatGPT review: Bug: Deleting an agent does not cancel its waiting request

**Location:** [agent deletion:354](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/agents.js#L354) and [stillAllowed:106](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/agents.js#L106).

**Trigger and impact:** Start a Same as Chat agent while chat is generating, then delete that agent before generation finishes. Deletion removes its settings and activity records but does not abort `current.ctrl`. The waiting call still owns the removed object, and `stillAllowed` checks the page switch and agent switch, not whether the agent still exists. It sends a model request after deletion. Completion can also recreate activity or answer entries for the deleted ID.

**Evidence:** Removing the agent from `s.agents` while its actual call waited, then ending chat generation, still produced **one** model request. The agent was absent from the list when the request was sent. This differs from queued runs that have not entered `call`, which already check `byId`.

**Suggested fix:** Abort the active controller when deleting its agent, recheck agent membership after waiting, and avoid recording results against removed IDs.

**Host check:** Delete a running agent while it waits for chat; verify that it sends no request afterward and its activity does not return.

### 5. ChatGPT review: Bug: Long location names are parsed but lost from scene history

**Location:** [VN tag parser:255](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/vn.js#L255), [stickyAt:1658](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/vn.js#L1658), and [tag cleaner:383](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/vn.js#L383).

**Trigger and impact:** Use a location name longer than 80 characters, which card cleaning permits up to 200. The narrator parser accepts up to 400 characters and recognizes its `[[Location:...]]` tag, but `stickyAt` only accepts an argument up to 80 characters. The scene can apply within that message but is not carried into later messages or reported as the current or visited location for maps. The ordinary-chat cleaner also uses the shorter limit, allowing the tag to remain visible.

**Evidence:** A tag with a 90-character location argument produced a parsed `loc` segment with the complete name. On the same chat, `currentLoc()` returned `null` and `visitedLocs()` was empty.

**Suggested fix:** Use consistent supported limits and parsing across scene construction, history scanning, and tag removal. Do not silently discard location names accepted by card storage.

**Host check:** Create a 90-character location name, use its tag, and advance to a reply with no location tag. Check the backdrop, map marker, visited state, and normal chat display.

### 6. ChatGPT review: Bug: Uploaded book and agent pictures bypass cleanup

**Location:** [file ownership allowlist:4601](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L4601), [book upload:5529](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L5529), and [agent upload:374](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/agents.js#L374).

**Trigger and impact:** Upload a Reader book picture or agent picture, then replace or clear it, delete the agent, or remove the relevant NTR data. Uploads use the `book` and `agent` prefixes, but `OWN_FILE` includes neither. Both ordinary cleanup and removal cleanup reject these files before checking whether they are unused. Repeated uploads leave orphaned server files.

**Evidence:** With no shallow cards or remaining references, `deleteFileIfUnused` returned `false` for `/user/files/book_123_abcdef.png` and `/user/files/agent_123_abcdef.png`. Neither path caused a delete request.

**Suggested fix:** Add the exact upload prefixes to the ownership allowlist, keeping all existing reference and lazy-loading safeguards. Consider maintaining upload prefixes and cleanup ownership in one place.

**Host check:** Upload, replace, and clear both picture types. Verify that only unreferenced extension-owned files are removed.

### 7. ChatGPT review: Bug: CI omits three module versions from its consistency check

**Location:** [.github/workflows/check.yml:37](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/.github/workflows/check.yml#L37).

**Trigger and impact:** Bump the manifest and the five listed module constants while leaving `REGEX_VERSION`, `READER_VERSION`, or `AGENTS_VERSION` stale. The step compares only six places, although this release has nine. It reports success despite those mismatches, leaving a guard that does not cover the whole runtime. The current release's versions match; the defect is in the check's coverage.

**Evidence:** Executing the existing version-check step against disposable copies returned exit status **0** after separately setting each of `agents.js`, `reader.js`, and `regex.js` to version `0.0.0` while the manifest and other modules remained `2.35.0`.

**Suggested fix:** Include all eight module constants and the manifest, and update the step name and failure text to describe all nine locations.

**Suggested check:** Deliberately mismatch each module constant in a disposable copy and require a nonzero exit status.

### 8. ChatGPT review: Verify: Map marker styles also match Pinned Blocks

**Location:** [map.js:26](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/map.js#L26), [Pinned Block class assignment:3216](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L3216), and [style.css:331](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/style.css#L331).

**Trigger and likely impact:** Create a floating Pinned Block, then open Maps. Map markers and Pinned Blocks both use `ntr_pin`, while the Maps stylesheet applies `.ntr_pin` globally. The Pinned Block rules do not override its `translate(-50%, -50%)` transform. A populated floating block with frame None also has no overriding background, border, or font size. It therefore appears susceptible to a position shift and marker styling. The map stylesheet remains after the map closes.

**Evidence and limit:** The shared class and unscoped selector are present in the reviewed source. A browser check using the actual styles was prepared, but Chromium failed before loading it because of the sandbox restriction. The visual effect has not been observed in SillyTavern.

**Suggested check:** Put a populated floating Pinned Block at a known position with frame None. Compare its position, background, border, and text size before opening Maps, while Maps is open, and after closing it. Also check desktop and phone layouts.

**Suggested fix if confirmed:** Scope marker selectors under `#ntr_map` or give map markers a distinct class, including label and state selectors.

## Additional security review

The follow-up review examined card and theme inputs, HTML rendering, CSS generation and import, media URL validation, uploaded-file handling, file cleanup and export, agent requests and saved key IDs, YouTube messages, Phone Preview, and development tooling. It found the privacy-policy bypass below. It did **not** establish account takeover, arbitrary script execution, or automatic API-key theft through a card or theme import. Further tracing established that user-configured agent endpoints can receive saved credentials; the conditions and verification limits are in finding 10. These are scoped review results, not a guarantee that the extension or its host is secure.

Additional isolated checks and source evidence:

- Seven sample URL payloads were rejected by the actual `cUrl`: JavaScript URLs, HTML and SVG data URLs, protocol-relative URLs, plain and percent-encoded parent-directory traversal, and attribute-breaking quotes. Supported external HTTP(S) URLs are still accepted; that acceptance is relevant to finding 9.
- HTML containing an image error handler was escaped by the core helper, VN dialogue formatter, and agent activity renderer. No executable image element remained in their returned HTML.
- Malicious tag and class strings were removed by `cleanPins`. Invalid font and color strings were omitted from theme sections. A sample JSON `__proto__` property did not pollute the VM's object prototype through `cleanLookSection`. These are sample checks, not proof against every injection payload.
- Exercising the actual theme-import callbacks with all three Custom CSS switches set to true still stored `rbCssOn`, `rbBtnCssOn`, and `ovScrollCssOn` as false. Imported CSS requires a later explicit enable action.
- SillyTavern's inspected host source sets `toastr.options.escapeHtml = true`; unescaped strings passed to those toast calls were therefore not reported as confirmed HTML injection. The extension's key picker retains saved key IDs and labels, and its normal theme sections exclude agent connection settings. No untrusted-card or theme path redirecting a saved API key was established.
- Pinned Blocks clone the host-rendered message DOM. The inspected host formatter sanitizes messages with DOMPurify before that DOM exists. The clone alone is not evidence of a sanitizer bypass. YouTube callbacks check the sending frame, and the embed destination is constructed under YouTube's origin.

Host behavior was cross-checked against SillyTavern `release` at [`06bde939fb1e9c4c8d8641d810f0a916b5bce127`](https://github.com/SillyTavern/SillyTavern/commit/06bde939fb1e9c4c8d8641d810f0a916b5bce127), including [external-media policy](https://github.com/SillyTavern/SillyTavern/blob/06bde939fb1e9c4c8d8641d810f0a916b5bce127/public/scripts/chats.js#L853), [media sanitization](https://github.com/SillyTavern/SillyTavern/blob/06bde939fb1e9c4c8d8641d810f0a916b5bce127/public/scripts/chats.js#L1974), and [toast escaping](https://github.com/SillyTavern/SillyTavern/blob/06bde939fb1e9c4c8d8641d810f0a916b5bce127/public/script.js#L360). The user's installed host version and other extensions were not available for integration testing. No real secrets, hostile servers, or user data were used in the checks.

### 9. ChatGPT review: Bug: Card media bypasses SillyTavern's external-media block

**Location:** [foreground rendering:699](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L699), [media helper:4454](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L4454), and [banner image assignment:1700](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L1700). Similar direct assignments exist for VN art, maps, opening media, and menu thumbnails.

**Attack conditions:** A card author controls a supported external image or media URL in the card's NTR metadata. The victim opens the card with the relevant feature enabled, or with foreground elements left mounted from earlier use. The victim has blocked external media globally or for that character in SillyTavern.

**Impact:** NTR cleans the URL's syntax, then `media` returns the string unchanged and rendering assigns it directly to `src` or a CSS background. It never consults the host's external-media permission. A URL unique to the card or recipient can therefore contact the author's server despite the block, disclosing the user's public IP address and the time the card was viewed. This is unwanted external contact and tracking. It is not, by itself, proof of access to chat contents, host cookies, API keys, or the user's machine.

**Evidence:** With `powerUserSettings.forbid_external_media = true`, an imported card containing `ntr.fg.Left = "https://attacker.invalid/beacon/card-123.png"` was passed through the actual card cleaner and foreground renderer. The mock image element received that exact external `src`. An available false-returning policy stub was never consulted. The assignment occurred with Foreground enabled and again with Foreground disabled when its elements already existed: setting their display to `none` does not prevent a browser from fetching a newly assigned image source. The mock recorded assignment only; it made no external request.

A minimal metadata fragment for a disposable test card is:

```json
{
  "data": {
    "extensions": {
      "ntr": {
        "v": 1,
        "fg": {
          "Left": "https://attacker.invalid/beacon/card-123.png"
        }
      }
    }
  }
}
```

**Suggested fix:** Centralize permission-aware media resolution using SillyTavern's external-media policy, including character overrides, and apply it before all card-supplied `src`, thumbnail, video, embed, and background assignments. Retain local and supported embedded images. Stop assigning or retaining external sources in inactive foreground elements, and clear prohibited sources when the host policy changes. Explicit user approval of an external URL should follow a clearly defined policy rather than silently bypassing the block.

**Host check:** Use a disposable card and a controlled test image server. Block external media globally and through a character override, then open the card with foreground, banners, VN, and menu previews in turn. Record browser network requests. Repeat after turning Foreground off following earlier use. Require zero prohibited external requests while allowing local images and explicitly permitted media.

## API keys and theme sharing

**Normal theme imports and exports:** No automatic saved-key leak was established. [Theme snapshots](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L4687) copy an explicit list of appearance fields, and [the download callback](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/index.js#L5071) exports those sections. Agent connections, selected key IDs, and the host's secret storage are not part of that list. Imports clean the appearance sections and do not accept agent connection fields. Loading external theme images does not itself attach SillyTavern's API-key headers to them.

**Verification:** An isolated check placed a dummy saved-key marker in host API settings, an extra NTR setting, and an agent's instructions. It also populated an agent key ID and untrusted destination. The actual theme download callback produced JSON containing neither the marker nor the key ID. Injected `api_key`, `agents`, and `ccUrl` fields were omitted from the cleaned appearance section. No real keys were read.

**Secrets pasted into appearance data:** Export preserves image links and custom CSS as entered. A dummy image URL containing `?api_key=DUMMY-URL-TOKEN` survived the theme snapshot. A credential, signed URL, or token pasted into an image URL or CSS can therefore be included in a shared theme. This is exposure of user-supplied appearance content, not extraction from SillyTavern's saved-key store. Review those fields before sharing an export. A future export warning or redaction preview could help, without assuming every signed URL is safe to share.

**Key-picker response:** NTR stores the selected ID, not the key value. The host's `/api/secrets/read` endpoint returns IDs, labels, active flags, and value fields masked by default. If the host explicitly enables `allowKeysExposure`, those value fields may be unmasked. NTR's picker uses IDs and labels, and no path from those response values into a normal theme export was established. Keeping key exposure disabled remains relevant to the security of the host as a whole.

### 10. ChatGPT review: Verify: Agent endpoints can receive a key saved for another server

**Location:** [Custom request:130](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/agents.js#L130), [Text Completion request:137](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/agents.js#L137), [default key choice:232](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/agents.js#L232), and [server-link hint:240](https://github.com/SepsisShock/NTR-Extension/blob/a965f5454acf7f1e07a985dd3b17ff547d24b99a/agents.js#L240).

**Conditions and impact:** The user already has an active saved key for Custom or a supported Text Completion server type. They point an agent at a different, untrusted server and press Run Now or Test Connection. For Custom, leaving the key selector at its default means use the active Custom key, not send no key. Text Completion provides no per-agent key choice and uses the active key for its server type. The host attaches that key to the entered destination without checking that it is the server for which the key was originally saved. A server operator can read the received credential. A non-loopback plain-HTTP destination is also accepted, allowing unencrypted transmission if the request is sent that way.

This is a conditional credential-sharing risk. It is **not** an established attack through theme import: agent connection fields are excluded from themes, and a remote card author has not been shown to control the agent destination. Saved-key reuse is intentional and the UI mentions it. The concern is that the generic default key follows a changed recipient, including for a connection test, without destination-specific consent or a keyless choice.

**Evidence and limit:** The actual agent call was exercised with Test Connection and dummy credentials. A Generic Text Completion agent sent no explicit `secret_id`; executing the inspected host's actual additional-header code attached `Authorization: Bearer DUMMY-GENERIC-KEY` for `https://attacker.invalid/v1`. A Custom agent with no selected key ID accepted `http://attacker.invalid/v1`; the inspected host's Custom branch resolved `DUMMY-CUSTOM-KEY`. The host then constructs its Authorization header and sends to that URL's completions endpoint. These checks used stubs for secret storage and model services, with no network traffic. End-to-end behavior on the installed host, including recipient changes in the UI, still needs verification before treating this as a confirmed integration bug.

**Host references:** [Active-key fallback](https://github.com/SillyTavern/SillyTavern/blob/06bde939fb1e9c4c8d8641d810f0a916b5bce127/src/endpoints/secrets.js#L268), [Generic key header](https://github.com/SillyTavern/SillyTavern/blob/06bde939fb1e9c4c8d8641d810f0a916b5bce127/src/additional-headers.js#L194), [Text Completion attachment](https://github.com/SillyTavern/SillyTavern/blob/06bde939fb1e9c4c8d8641d810f0a916b5bce127/src/endpoints/backends/text-completions.js#L334), [Custom URL and key selection](https://github.com/SillyTavern/SillyTavern/blob/06bde939fb1e9c4c8d8641d810f0a916b5bce127/src/endpoints/backends/chat-completions.js#L1800), and [Custom Authorization and send](https://github.com/SillyTavern/SillyTavern/blob/06bde939fb1e9c4c8d8641d810f0a916b5bce127/src/endpoints/backends/chat-completions.js#L2675).

**Suggested check:** Save dummy keys for two controlled test servers. Change an agent's destination, leave its key at the default, and press Test Connection. Inspect the receiving server's headers. Repeat for Custom and Generic Text Completion, with no active key as a control, and with an HTTP destination. Never use a real provider key in this check.

**Suggested hardening:** Show which credential will go to which origin before a test or run. Bind or reconfirm credential use when the destination changes, support an explicit no-key option where the host API permits it, and require HTTPS for remote credential-bearing connections while retaining clearly identified local development exceptions. Until then, use trusted agent destinations and treat Test Connection as an authenticated request.
