# Roadmap [Beta]

Ideas and planned work for Nitwit Tavern Redesign. When something ships, it comes off the list; the PR history is the record.

## Planned

### In Line avatar: spacing and look
In Line looks too bulky next to the text.

- [ ] Tighten the padding and space around the In Line avatar, and check how it sits beside the name, text and message buttons.

### SillyTavern's top bar icons
- [ ] Change the icons in SillyTavern's top menu bar.

### Independent, customizable "favorites" bar

### Folder of pre-generated locations
- [ ] A set of ready-made location backgrounds included with the extension, to pick from when adding a location.

### Agents: follow-ups
- [ ] Options for being able to drag agent order or alphabetical.
- [ ] Character portraits next to the tracked characters.
- [ ] Highlight what changed since the last result.
- [ ] Set fields and values (like scores with rules) instead of free text from the instructions.
- [ ] Decide whether `/sendas` should count as a reply for After Every Reply agents. It does now, so a Quick Reply that uses it also runs them.
- Left out on purpose: import and export, request batching, parallel runs, time-based cooldowns, running on SillyTavern startup. Triggers come from Quick Replies through `/ntr-agent`.
- Agents run after the AI's reply. Running before a reply only matters for a director reacting to your message; leave it until a director is wanted.

### Speech Bubbles: comic dialogue
- [ ] Only the quoted speech in a bubble, with the narration as plain text, so long replies read like a comic or a visual novel in the normal chat. Means picking apart the message text, so it's a bigger job.

### Interface Shape: Square Screen Edges
Interface Shape rounds or squares every corner of SillyTavern's and NTR's windows, even against the screen edge.

- [ ] Optional tick: on Rounded, corners touching the screen edge stay square, so no background shows through the curve. Which corners touch the edge changes with Layout (Menu Bar edge, phone, side panels), so it needs their positions worked out in code.

### Fonts
Font boxes already take any font installed on the device, or a Google Fonts name.

- [ ] A preset list of Google Fonts, each name shown in its own font.
- [ ] Uploading font files (like a downloaded .ttf that isn't installed), saved in SillyTavern's files so they work on any device and need no request to Google.

### Avatar Shapes in Visual Novel Mode
Chat avatars have Circle, Rectangle, Square, Heart and Star, with Corners for Rectangle and Square.

- Open question: whether the shapes also go on the VN portrait box.

### Text effects, second batch
- [ ] Gradient and Shimmer (italics keep their own color; Shimmer stops with "reduce motion").

### Horizontal Scrollbar color
- [ ] Default is grey currently.

- [ ] A second color for the right side of the scrollbar, with Scrollbar Color as the left.
- [ ] Sideways scrollbars (like in wide code blocks) turn it to run top to bottom, so it still goes across the bar.
- [ ] Firefox can show only one flat color, so it keeps the first color.

### Visual Novel Mode and opening video sliders read `NUM_RANGE`
Every slider in `index.js` reads its range, step and unit from `NUM_RANGE`. The ones in `vn.js` and `opening.js` still have their own numbers. Users would see no difference, so this waits until those files are worked on anyway.

- [ ] Have these sliders and the code that applies them use the ranges already shared through `window.NTR`, keeping setting names, defaults and the menu layout the same.
- [ ] Fix two harmless mismatches at the same time: `opening.js` applies the logo size with a 5% minimum while the slider and theme limit say 10%, and keeps the logo fade and lead time above 0 with no upper limit while the sliders stop at 4 s and 15 s. Only a hand-edited settings file can reach these values.

### Graphic borders around profiles

Complicated, not urgent.
Decorative image frames around profile pictures, beyond the current plain border and shape choices.

- Open questions: which pictures get them (chat avatars, avatar backdrop, avatar pop-out, VN portrait box); built-in frames drawn in code like the default art, uploaded frames, or both; how a frame fits each shape (round, rounded, square, tall); per character, global, or saved in themes.

### Graphic borders around the UI

Complicated, not urgent.
Decorative image borders around interface parts, stretched to fit any size.

- Open questions: which parts (VN dialogue box, name tag, choice buttons, map window, NTR menu, SillyTavern's chat messages); built-in, uploaded, or both; one border style for all parts or one per part; saved in themes.

- Open questions: where the images come from and their license; how many, since every install downloads them; how they're picked (a gallery in the Locations menu); whether a picked image is copied into the user's own files or used from the extension folder (a card that uses the extension folder breaks if someone installed the extension under a different folder name).

### Banners in group chats
Optional: revisit if group chats become useful to me or are requested. The shared Global banner could show in group chats too, which have no banner now.

- Open questions: whether a group can have its own banner like Char; where Lock to top and Overlap are saved for a group.

## Misc (Low Priority)

### Replace the once-a-second check with events
`injectExtensionMenuButton` in `index.js` runs a check every second to put back its buttons and the wand menu entry and to keep Visual Novel Mode running. In a sandbox test it was most of NTR's idle cost: about 0.8% CPU with everything on, which no user would notice. Users would see no difference, so this is tidying, not a fix.

- [ ] Run the same steps on SillyTavern's events (app ready, chat changed, settings updated) instead of on a timer.
- [ ] Keep a fallback for anything that has no event, like SillyTavern rebuilding its Extensions panel, using a watcher on just that part instead of the whole page.
- [ ] Check the buttons, the wand entry and Visual Novel Mode still come back after a chat switch, a reload and a theme change.
- Worth it? The gain is small, mostly a little phone battery. The risk is bigger: SillyTavern doesn't send an event for every change, so a missed one leaves a button missing or Visual Novel Mode off until a reload, and event names can change between SillyTavern versions. The timer can't miss anything. Only do this if a speed test on a phone shows NTR's idle cost matters.

**Note: phone performance during streaming under background load.** A phone simulation used a touch viewport, 4× CPU throttling and competing background CPU work. Across three runs per condition, background load increased streaming frames delayed over 50 ms from about 4–7% to about 16%. Disabling the once-a-second check did not consistently reduce those pauses. Scrolling stayed smooth. This was a synthetic test, not a measurement on a real phone.

- [ ] Profile streaming to find which scripts, styling or animations cause pauses.
- [ ] Compare plain SillyTavern with NTR under the same background load.
- [ ] Repeat with commonly used visual effects disabled, then enabled individually.
- [ ] Confirm the findings on a real phone before choosing a fix.
- Replacing the once-a-second check with events remains cleanup; the simulation does not establish it as the main cause of lag.

### Story Memory
Build on saved agent results, Agent Results in Pinned Blocks and Send to Main AI with NTR's own scene memories and optional recall. The basic system uses SillyTavern's chat storage and NTR's existing agent connections; other memory extensions are optional.

- [ ] Add editable scene summaries: what happened, important facts and promises, unresolved matters, and links to source messages.
- [ ] Start with manual scene marking. Reuse NTR's agents for optional automatic tracking and summarizing, after replies or through Quick Replies.
- [ ] Optionally send pinned facts and relevant scene memories with the prompt, within a configurable token budget. The current state already goes through Send to Main AI; reuse its placement settings where practical.
- [ ] Provide separate switches for tracking, summarizing and recall, so users can combine NTR with other tools.
- [ ] Handle edits, swipes, deletions and branches so saved and recalled information stays correct, the way saved agent results already do.
- [ ] Reader Mode, in all its styles, shows state for the point being viewed, without revealing later events.
- [ ] Let users inspect, correct, delete and export memories. Check that chat backups and imports preserve them.
- [ ] Consider integrations and semantic search later; neither is required for the basic system.

- Open questions: where the editor opens; how automatic scene detection works; whether pinned facts belong to one branch or the whole chat.

## Visual Novel Mode (Low Priority)

Will be worked on when the main part is done, unless there are bugs or issues to take care of.

### Flags and endings
Keep the open-world feel, and let a card optionally have endings.

- [ ] `[[Flag:Name]]` tag: the model marks that something happened (e.g. Trust, Betrayal).
- [ ] `[[Ending:Name]]` tag: shows an ending title card.
- [ ] Work out current flags and reached endings by scanning the chat, like locations already work, so swipes, edits and branches stay correct.
- [ ] Add the current flags to the prompt text the extension already sends, so the model doesn't have to remember them.
- [ ] Endings gallery in the Visual Novel part of the Reader page, with seen/unseen state, saved under a new settings key (existing keys untouched).
- [ ] Hide the new tags in the normal chat view, like the other scene tags.
- [ ] Cards with no flag or ending tags behave exactly as they do now.

### Ideas

- Chapters and save points. In Visual Novel Mode, each message is a chapter.
  - Title from a `[[Chapter:Name]]` tag, or "Chapter 1", "Chapter 2" and so on without one.
  - Title card when a chapter starts.
  - Chapter list to jump to any chapter.
  - "Branch from here" on each chapter, using SillyTavern's own branching, so a chapter can be replayed in a new branch.
  - Open question: what SillyTavern makes available to extensions for creating a branch.
- Ending credits. Would follow the ending title card from Flags and endings.
  - Open questions: where the text comes from (typed per character in the menu, built from speakers, locations and CGs, or both); music or video behind it; what starts it (only an ending tag, or also a button); whether it can be skipped.
- NTR Visual Novel Card Maker. Complicated, not urgent. Wait until chapters, flags and endings are stable. Undecided whether it belongs in this extension or should be its own. Most useful for cards that are not open world, where people need to set up different chapters and endings.
  - For the author and for everyone else, so it needs to be friendly for first-time card makers.
  - Fills in the card and tag setup, and also validates it (for example an ending that can't be reached, or a flag that is never set).
  - Uses the `[[Chapter:Name]]` tag from Chapters and save points, where a chapter is one message. A chapter can say what is unlocked (locations, characters, required flags), and endings become a chapter plus flags.
  - Leaning towards an isolated module in this repo, split out later if it earns it. A standalone page that exports the card is the other option.
  - Own menu, separate from the settings menu. Reads and writes the same per-character data as the Visual Novel part of the Reader page (speakers, emotions, locations, CGs, maps).
  - Open question: how it is opened (a button in the NTR menu, its own button next to the VN toggle, or its own entry in the Extensions panel).

## Release Preparation (Low Priority)

Start this work only when the repository owner, SepsisShock, says release is approaching.

### Mobile compatibility testing
Test on phones and fix what breaks. Android and iOS both need checking: every iOS browser uses Safari's engine, which handles video, sound and screen height differently.

- [ ] Android (Chrome).
- [ ] iOS (Safari).
- [ ] NTR menu as a full-screen sheet.
- [ ] Screen height changes when the address bar shows or hides.
- [ ] Notch and home bar areas on iPhone.
- [ ] Dragging popup characters by touch.
- [ ] Visual Novel Mode: dialogue box, sprites, choices, CGs.
- [ ] Maps: pins and popups near the screen edge.
- [ ] Opening video and banner video: autoplay, sound button, YouTube.
- [ ] Reader Mode: Book on a phone held sideways, the page flip, and dragging a Free page bar and banner by touch.
