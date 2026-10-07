# Roadmap [Beta]

Ideas and planned work for Nitwit Tavern Redesign. When something ships, it comes off the list; the PR history is the record.

## Planned

### Reasoning Block and Text Formatting: follow-ups
The sections themselves and the first batch of text effects have shipped. Still open:

- Separate themes for the normal chat and for Visual Novel Mode, so each can have its own look.
- Reasoning Block background image (upload or link, Cover or Tile, opacity, auto tint for readability).
- Left out for now: line height, letter spacing, background color per Text Formatting part. The reasoning block has Box Color, and its Custom CSS covers the rest.

### Dragging and placement
Pop-out avatars can already be dragged ("Drag it on screen" in Screen Placement). Extend that to portraits and other parts of the screen that support it.

- [ ] Free dragging, plus Snap to Grid with adjustable grid spacing.
- [ ] An Edit Placement mode that turns dragging on; only the selected item can be dragged.
- [ ] A clear Done button to leave Edit Placement.
- [ ] Block page scrolling only while the selected item is being dragged.
- [ ] Undo Last Move, and Reset to the default placement.
- [ ] Consider replacing the pop-out avatar Move Horizontal and Move Vertical sliders with dragging.

### Saving
- [ ] Keep autosave: sliders save when released, dragged items when dropped.
- [ ] Show SillyTavern's blue confirmation popup after a successful save.
- [ ] Find out why saving fails when the connection drops.
- [ ] Consider keeping unsaved changes on the device and retrying when SillyTavern reconnects.

## Ideas

- Built-in cursor. An arrow drawn in code with its own color, for people without a cursor image (Custom Cursor in UI Display).
- Banners in group chats. The shared Global banner could show in group chats too, which have no banner now.
  - Open questions: whether a group can have its own banner like Char; where Lock to top and Overlap are saved for a group.
- Regex. Some functions of SillyTavern's Regex extension, but not regex used to output HTML or CSS. Visual Novel Mode reads the saved message text, so SillyTavern regex that only changes the display has no effect on the VN dialogue box.
  - Open questions: which functions to include (find and replace, trim out, AI or user messages, depth, per character or global, on/off per script); whether it affects only the VN dialogue box or also the normal chat; whether it runs before NTR reads the tags (so it can fix or rename tags) or after (so it only changes the text shown).
- More Avatar Shapes (Avatar Management) beyond SillyTavern's four (Round, Rectangle, Square, Rounded).
  - Open question: whether the extra shapes also apply to NTR Avatars, the avatar backdrop and the VN portrait box, or only the normal chat avatars.
- Graphic borders around profiles. Decorative image frames around profile pictures, beyond the current plain border and shape choices.
  - Open questions: which pictures get them (chat avatars, avatar backdrop, avatar pop-out, VN portrait box); built-in frames drawn in code like the default art, uploaded frames, or both; how a frame fits each shape (round, rounded, square, tall); per character, global, or saved in themes.
- Graphic borders around the UI. Decorative image borders around interface parts, stretched to fit any size.
  - Open questions: which parts (VN dialogue box, name tag, choice buttons, map window, NTR menu, SillyTavern's chat messages); built-in, uploaded, or both; one border style for all parts or one per part; saved in themes.
- Folder of pre-generated locations. A set of ready-made location backgrounds included with the extension, to pick from when adding a location.
  - Open questions: where the images come from and their license; how many, since every install downloads them; how they're picked (a gallery in the Locations menu); whether a picked image is copied into the user's own files or used from the extension folder (a card that uses the extension folder breaks if someone installed the extension under a different folder name).
- Emotions outside Visual Novel Mode. Move Emotions out of the Visual Novel menu into its own section, so emotion pictures can also show in the normal chat when Visual Novel Mode is off.
  - The new section holds the emotion list and each speaker's emotion pictures. The Visual Novel menu keeps what only it uses (full portrait, keep the face on stage, sprite size) and points to the new section.
  - The emotion code stays out of `index.js`.
  - Saved settings keep their names (`emotions`, `emoDefault`, `delimEmo`, `nodeHideEmo`) so saved configs keep working.
  - Open questions: where the emotion comes from with Visual Novel Mode off (the same speaker tags with their own switch and shorter instructions, or SillyTavern's Character Expressions extension); which pictures change (chat avatars, avatar backdrop, avatar pop-out); whether each message keeps its own emotion or only the latest one changes; which tag wins when a message has several; whether the tag delimiters move too; whether emotions leave the Visual Novel group in saved themes.

## Visual Novel Mode (Low Priority)

Will be worked on when the main part is done, unless there are bugs or issues to take care of.

### Flags and endings
Keep the open-world feel, and let a card optionally have endings.

- [ ] `[[Flag:Name]]` tag: the model marks that something happened (e.g. Trust, Betrayal).
- [ ] `[[Ending:Name]]` tag: shows an ending title card.
- [ ] Work out current flags and reached endings by scanning the chat, like locations already work, so swipes, edits and branches stay correct.
- [ ] Add the current flags to the prompt text the extension already sends, so the model doesn't have to remember them.
- [ ] Endings gallery in the VN menu with seen/unseen state, saved under a new settings key (existing keys untouched).
- [ ] Hide the new tags in the normal chat view, like the other scene tags.
- [ ] Cards with no flag or ending tags behave exactly as they do now.

### Ideas

- Chapters and save points. In Visual Novel Mode, each message is a chapter.
  - Title from a `[[Chapter:Name]]` tag, or "Chapter 1", "Chapter 2" and so on without one.
  - Title card when a chapter starts.
  - Chapter list to jump to any chapter.
  - "Branch from here" on each chapter, using SillyTavern's own branching, so a chapter can be replayed in a new branch.
  - Open question: what SillyTavern makes available to extensions for creating a branch.
- NTR Visual Novel Card Maker. Undecided whether it belongs in this extension or should be its own. Most useful for cards that are not open world, where people need to set up different chapters and endings.
  - For the author and for everyone else, so it needs to be friendly for first-time card makers.
  - Fills in the card and tag setup, and also validates it (for example an ending that can't be reached, or a flag that is never set).
  - Uses the `[[Chapter:Name]]` tag from Chapters and save points, where a chapter is one message. A chapter can say what is unlocked (locations, characters, required flags), and endings become a chapter plus flags.
  - Leaning towards an isolated module in this repo, split out later if it earns it. A standalone page that exports the card is the other option.
  - Own menu, separate from the settings menu. Reads and writes the same per-character data as the Visual Novel menu (speakers, emotions, locations, CGs, maps).
  - Open question: how it is opened (a button in the NTR menu, its own button next to the VN toggle, or its own entry in the Extensions panel).
- Ending credits. Would follow the ending title card from Flags and endings.
  - Open questions: where the text comes from (typed per character in the menu, built from speakers, locations and CGs, or both); music or video behind it; what starts it (only an ending tag, or also a button); whether it can be skipped.

## Misc (Low Priority)

Worth doing, but after the planned work. Includes checks for problems that aren't confirmed yet.

### Mobile compatibility testing
Test on phones and fix what breaks. Android and iOS both need checking: every iOS browser uses Safari's engine, which handles video, sound and screen height differently.

- [ ] Android (Chrome).
- [ ] iOS (Safari).
- [ ] NTR menu as a full-screen sheet.
- [ ] Visual Novel Mode: dialogue box, sprites, choices, CGs.
- [ ] Maps: pins and popups near the screen edge.
- [ ] Opening video and banner video: autoplay, sound button, YouTube.
- [ ] Dragging popup characters by touch.
- [ ] Screen height changes when the address bar shows or hides.
- [ ] Notch and home bar areas on iPhone.

### Visual Novel Mode and opening video sliders read `NUM_RANGE`
Every slider in `index.js` reads its range, step and unit from `NUM_RANGE`. The ones in `vn.js` and `opening.js` still have their own numbers. Users would see no difference, so this waits until those files are worked on anyway.

- [ ] Share `NUM_RANGE` through `window.NTR` and have these sliders and the code that applies them read it, keeping setting names, defaults and the menu layout the same.
- [ ] Fix two harmless mismatches at the same time: `opening.js` applies the logo size with a 5% minimum while the slider and theme limit say 10%, and keeps the logo fade and lead time above 0 with no upper limit while the sliders stop at 4 s and 15 s. Only a hand-edited settings file can reach these values.

### Text effects, second batch
The first batch (Glow, Shadow, Outline) has shipped for Text Formatting.

- [ ] Gradient and Shimmer (italics keep their own color; Shimmer stops with "reduce motion").

### Background Pattern: Fade
- [ ] Fade isn't working correctly yet. Find what's wrong and fix it.
- [ ] Give Fade its own section in Background Pattern (Reasoning Box), so a fade can be combined with Notebook, Lines, Dots or Checkers.
- [ ] Gradient fade options, like how far the fade reaches and how soft it is.

### Reasoning Arrow
A "Basic Style: Reasoning Arrow" card above Advanced, for the arrow on the reasoning button (`.mes_reasoning_arrow`, which ST flips upside down when the block is closed).

- [ ] Arrow: Default, None, Symbol (any character or emoji) or Image (Upload or Link, square, 64×64 px is plenty). None shrinks the button's right padding.
- [ ] Arrow Color, Arrow Size (0.5× to 3× of ST's size, so it scales the same on desktop and mobile; the button's padding grows with it), and Flip When Closed.
- [ ] While Thinking animation: Off, Spin, Pulse or Bounce. Stops when thinking ends; off with ST Reduced Motion.
- [ ] Arrow CSS as a third box in Advanced: Custom CSS, switched off when it comes from someone else's theme.
- [ ] Saved in themes, with the image following the rules for other theme images.

### Fonts
Font boxes already take any font installed on the device, or a Google Fonts name.

- [ ] A preset list of Google Fonts, each name shown in its own font.
- [ ] Uploading font files (like a downloaded .ttf that isn't installed), saved in SillyTavern's files so they work on any device and need no request to Google.

### Interface Shape for the rest of SillyTavern
Interface Shape (UI Display, Whole Interface) rounds or squares the chat panel. Extend it to SillyTavern's own drawers, menus, popups and top bar, so the whole interface matches.

- [ ] Find which of ST's parts set their own corners, and override them only while Interface Shape is ticked; unticked keeps ST's look.
- [ ] Check that rounded corners don't cut off anything inside them, like drawer edges, menu items or popup buttons.
- [ ] Messages, the send box and avatars keep their own Shape; the VN box and Reasoning keep theirs too. Scrollbars keep what their Custom CSS sets.

### Scrollbar vertical color
A Scrollbar Color that changes from top to bottom (a vertical gradient) instead of one flat color.

- [ ] A second color for the bottom of the scrollbar, with Scrollbar Color as the top.
- [ ] Firefox can show only one flat color, so it keeps the top color.

### Replace the once-a-second check with events
`injectExtensionMenuButton` in `index.js` runs a check every second to put back its buttons and the wand menu entry and to keep Visual Novel Mode running. In a sandbox test it was most of NTR's idle cost: about 0.8% CPU with everything on, which no user would notice. Users would see no difference, so this is tidying, not a fix.

- [ ] Run the same steps on SillyTavern's events (app ready, chat changed, settings updated) instead of on a timer.
- [ ] Keep a fallback for anything that has no event, like SillyTavern rebuilding its Extensions panel, using a watcher on just that part instead of the whole page.
- [ ] Check the buttons, the wand entry and Visual Novel Mode still come back after a chat switch, a reload and a theme change.

### Compatibility with other extensions
If NTR ever needs fixes for other extensions (like a top bar or side panel another extension adds), detect them in JavaScript and set a class on the page, like `body.ntr-has-topbar`, then use that class in CSS. A `body:has(...)` rule in CSS makes the browser check the whole page on every change, even for people who don't have that extension: in a sandbox test, rules like that made up about half of another theme's extra work while a reply streamed in. NTR's own two `:has()` rules only look inside small menu parts, so nothing needs changing now.

- [ ] Detect the other extension at load and when the Extensions panel changes, and add or remove the class.
- [ ] Keep the fixes in CSS under that class, so they only apply when the extension is there.
- [ ] Check the speed with `st.sh bench`, with and without the other extension installed.
