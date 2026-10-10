# Roadmap [Beta]

Ideas and planned work for Nitwit Tavern Redesign. When something ships, it comes off the list; the PR history is the record.

## Planned

### Reasoning Block and Text Formatting: follow-ups
The sections themselves and the first batch of text effects have shipped. Still open:

- Separate themes for the normal chat and for Visual Novel Mode, so each can have its own look.
- Reasoning Block background image (upload or link, Cover or Tile, opacity, auto tint for readability).
- Left out for now: line height, letter spacing, background color per Text Formatting part. The reasoning block has Box Color, and its Custom CSS covers the rest.

### Dragging and placement
Edit Placement has shipped for pop-out avatars and foreground images (drag, Snap to Grid, Undo, Reset, Done), and Layout for the chat panel, menu bar and send bar. Still open:

- [ ] Add more parts of the screen, like the header banner.
- [ ] Grid spacing as a percent of the screen, so a layout made on a computer lands in the same place on a phone.
- [ ] Message looks: chat messages shaped like speech bubbles, or a phone texting look.
- Comes before Reader Mode and the Tracker panel below, since both need parts of the screen to be adjustable.

### Reader Mode
Read the chat a page at a time instead of scrolling up and down. Makes it easier to keep things like trackers in one place on screen.

- [ ] One or two messages per page. The opening message gets its own page.
- [ ] Click left and right to turn pages. It has to be clear this isn't swiping (left and right are only for regens now).
- [ ] Leave room for SillyTavern's branch buttons: Create branch and Create checkpoint in the message's "..." menu, and the checkpoint flag by the name.
- [ ] Styles:
  - Plain: no frills. A long message scrolls up and down; it never spills onto another page.
  - Book, static: a book picture behind the text, like a foreground image, so the text, stats and so on line up with the pages.
  - Book, animated: pages flip along with the message text.
  - Maybe an adjusted Visual Novel Mode.
- Other messages are only hidden on screen, like Visual Novel Mode does. This isn't SillyTavern's `/hide`, which also takes messages out of the prompt.
- SillyTavern only draws the last 100 messages by default, so turning back past them has to load older ones ("Show more messages").
- SillyTavern's Left and Right arrow keys already swipe, so page turns need other keys.
- Open questions: show SillyTavern's own messages (keeps swipes, branch buttons and formatting) or draw its own like Visual Novel Mode; which messages share a page (your message and the reply after it, or a reply and your answer to it); in the book, your message on the left page and the reply on the right, or the reply across both; a reply too long for the book scrolls inside the page or goes on to the next pages; where the message's name, "..." menu and checkpoint flag go in the book; one book picture for everything (saved in themes) or one per character.

### Tracker panel
One panel that stays on screen with the current state, instead of a tracker block repeated in every message. Works with a lorebook-based cast; group chat isn't needed.

- [ ] Tracks location, time, weather, inventory, injuries, relationships, objectives, and other character or world values that can be set up.
- [ ] Shows the current state in a panel that can be moved and hidden, next to the normal chat or Visual Novel Mode. Character portraits, recent changes and active objectives make it easier to read.
- [ ] Values can be checked and fixed by hand. Relationship scores need set rules; plain facts like an item changing hands are easier to keep track of.
- [ ] Saves a snapshot on the message it describes. The panel shows the snapshot that applies; earlier ones keep the history.
- [ ] A snapshot belongs to the message and swipe it describes, so changing a reply doesn't leave the wrong state showing.
- [ ] Optionally sends the chosen parts of the state to the model with the prompt. Can also be display only.
- Without NTR, the saved snapshots stay in the chat file but nothing shows them or sends them. A plain-text snapshot in the message itself would still be readable.
- zTracker is an example of the saving part: it keeps tracker data on a message, shows a tracker block inside that message, and can send saved snapshots in later prompts. NTR's difference is showing the current state in a panel that stays on screen.
- Still being worked out.

### Saving
- [ ] Keep autosave: sliders save when released, dragged items when dropped.
- [ ] Show SillyTavern's green confirmation popup after a successful save.
- [ ] Find out why saving fails when the connection drops.
- [ ] Consider keeping unsaved changes on the device and retrying when SillyTavern reconnects.

### Menu order
Rearrange the NTR menu pages:

- [ ] Themes, Layout, Avatars, Text, UI Display, Scenery, Reasoning, Regexes, then a divider line, then VN.
- [ ] Scenery joins Header Banner and Foreground Images (Overlays) into one page. Background images may go there later too, not only for Visual Novel Mode.
- [ ] Regexes is the page for Regex (below) once it's built.
- [ ] Page ids stay the same, so the saved last open page keeps working.

### Custom Cursor: follow-ups
- [ ] Keep Size (CSS can't resize a cursor picture, so NTR redraws it at that size).
- [ ] An Advanced box with Custom CSS for anything the settings don't cover.

### Send box
- [ ] Show the Visual Novel Mode button (chat bubbles icon) only while VN Mode is on, so it works as a quick way out. VN Mode is switched on from the VN page.
- [ ] Look at how SillyTavern's CSS lays out the Quick Reply buttons in the send box.
- [ ] Maybe let the send box stretch across the whole screen, keeping its contents in the center.

### Message details
Find out how to make these movable and designable, and which details SillyTavern makes available.

- [ ] Details like message number, time spent thinking (outside the reasoning block), token count and date.
- [ ] Move the time and date.
- [ ] Move the character and user names, maybe with a background image or border behind them.
- [ ] Text alignment for chat messages: left, right, center or justified.

### Regex
Some functions of SillyTavern's Regex extension, but not regex used to output HTML or CSS. Visual Novel Mode reads the saved message text, so SillyTavern regex that only changes the display has no effect on the VN dialogue box.

- Open questions: which functions to include (find and replace, trim out, AI or user messages, depth, per character or global, on/off per script); whether it affects only the VN dialogue box or also the normal chat; whether it runs before NTR reads the tags (so it can fix or rename tags) or after (so it only changes the text shown).

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

### In Line avatar: spacing and look
In Line looks too bulky next to the text.

- [ ] Tighten the padding and space around the In Line avatar, and check how it sits beside the name, text and message buttons.

### Avatar fades: clear all
- [ ] A button in the avatar Fades section that sets all eight fades to 0 at once.

### Typing in slider values
- [ ] Everywhere in the menu a slider shows a value in % or px, let the value be typed in as well as dragged. Typed values stay within the slider's range.

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

### Scrollbar side-to-side color
A Scrollbar Color that changes from one side of the scrollbar to the other (a horizontal gradient) instead of one flat color.

- [ ] A second color for the right side of the scrollbar, with Scrollbar Color as the left.
- [ ] Sideways scrollbars (like in wide code blocks) turn it to run top to bottom, so it still goes across the bar.
- [ ] Firefox can show only one flat color, so it keeps the first color.

### Replace the once-a-second check with events
`injectExtensionMenuButton` in `index.js` runs a check every second to put back its buttons and the wand menu entry and to keep Visual Novel Mode running. In a sandbox test it was most of NTR's idle cost: about 0.8% CPU with everything on, which no user would notice. Users would see no difference, so this is tidying, not a fix.

- [ ] Run the same steps on SillyTavern's events (app ready, chat changed, settings updated) instead of on a timer.
- [ ] Keep a fallback for anything that has no event, like SillyTavern rebuilding its Extensions panel, using a watcher on just that part instead of the whole page.
- [ ] Check the buttons, the wand entry and Visual Novel Mode still come back after a chat switch, a reload and a theme change.
- Worth it? The gain is small, mostly a little phone battery. The risk is bigger: SillyTavern doesn't send an event for every change, so a missed one leaves a button missing or Visual Novel Mode off until a reload, and event names can change between SillyTavern versions. The timer can't miss anything. Only do this if a speed test on a phone shows NTR's idle cost matters.

### Compatibility with other extensions
If NTR ever needs fixes for other extensions (like a top bar or side panel another extension adds), detect them in JavaScript and set a class on the page, like `body.ntr-has-topbar`, then use that class in CSS. A `body:has(...)` rule in CSS makes the browser check the whole page on every change, even for people who don't have that extension: in a sandbox test, rules like that made up about half of another theme's extra work while a reply streamed in. NTR's own two `:has()` rules only look inside small menu parts, so nothing needs changing now.

- [ ] Detect the other extension at load and when the Extensions panel changes, and add or remove the class.
- [ ] Keep the fixes in CSS under that class, so they only apply when the extension is there.
- [ ] Check the speed with `st.sh bench`, with and without the other extension installed.

### Built-in cursor
An arrow drawn in code with its own color, for people without a cursor image (Custom Cursor in UI Display).

### Banners in group chats
The shared Global banner could show in group chats too, which have no banner now.

- Open questions: whether a group can have its own banner like Char; where Lock to top and Overlap are saved for a group.

### Avatar Shapes in Visual Novel Mode
Chat avatars have Circle, Rectangle, Square, Heart and Star, with Corners for Rectangle and Square.

- Open question: whether the shapes also go on the VN portrait box.

### Graphic borders around profiles
Decorative image frames around profile pictures, beyond the current plain border and shape choices.

- Open questions: which pictures get them (chat avatars, avatar backdrop, avatar pop-out, VN portrait box); built-in frames drawn in code like the default art, uploaded frames, or both; how a frame fits each shape (round, rounded, square, tall); per character, global, or saved in themes.

### Graphic borders around the UI
Decorative image borders around interface parts, stretched to fit any size.

- Open questions: which parts (VN dialogue box, name tag, choice buttons, map window, NTR menu, SillyTavern's chat messages); built-in, uploaded, or both; one border style for all parts or one per part; saved in themes.

### Folder of pre-generated locations
A set of ready-made location backgrounds included with the extension, to pick from when adding a location.

- Open questions: where the images come from and their license; how many, since every install downloads them; how they're picked (a gallery in the Locations menu); whether a picked image is copied into the user's own files or used from the extension folder (a card that uses the extension folder breaks if someone installed the extension under a different folder name).

### Emotions outside Visual Novel Mode
Move Emotions out of the Visual Novel menu into its own section, so emotion pictures can also show in the normal chat when Visual Novel Mode is off.

- The new section holds the emotion list and each speaker's emotion pictures. The Visual Novel menu keeps what only it uses (full portrait, keep the face on stage, sprite size) and points to the new section.
- The emotion code stays out of `index.js`.
- Saved settings keep their names (`emotions`, `emoDefault`, `delimEmo`, `nodeHideEmo`) so saved configs keep working.
- Open questions: where the emotion comes from with Visual Novel Mode off (the same speaker tags with their own switch and shorter instructions, or SillyTavern's Character Expressions extension); which pictures change (chat avatars, avatar backdrop, avatar pop-out); whether each message keeps its own emotion or only the latest one changes; which tag wins when a message has several; whether the tag delimiters move too; whether emotions leave the Visual Novel group in saved themes.

### SillyTavern's top bar icons
- [ ] Change the icons in SillyTavern's top menu bar.
