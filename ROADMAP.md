# Roadmap [Beta]

Ideas and planned work for Nitwit Tavern Redesign. When something ships, it comes off the list; the PR history is the record.

## Planned

### Flags and endings (Visual Novel Mode)
Keep the open-world feel, and let a card optionally have endings.

- [ ] `[[Flag:Name]]` tag: the model marks that something happened (e.g. Trust, Betrayal).
- [ ] `[[Ending:Name]]` tag: shows an ending title card.
- [ ] Work out current flags and reached endings by scanning the chat, like locations already work, so swipes, edits and branches stay correct.
- [ ] Add the current flags to the prompt text the extension already sends, so the model doesn't have to remember them.
- [ ] Endings gallery in the VN menu with seen/unseen state, saved under a new settings key (existing keys untouched).
- [ ] Hide the new tags in the normal chat view, like the other scene tags.
- [ ] Cards with no flag or ending tags behave exactly as they do now.

### Reasoning Block and Text Formatting: follow-ups
The sections themselves and the first batch of text effects have shipped. Still open:

- Separate themes for the normal chat and for Visual Novel Mode, so each can have its own look.
- A preset list of Google Fonts, each name shown in its own font.
- Uploading font files, so no outside request is needed.
- Text effects, second batch: Gradient and Shimmer (italics keep their own color; Shimmer stops with "reduce motion").
- Reasoning Block background image (upload or link, Cover or Tile, opacity, auto tint for readability), with Corners (Square, Rounded, Pill).
- Left out for now: line height, letter spacing, background color per part. Custom CSS covers these for the reasoning block.

### Sliders read their ranges from one place
The UI Display, Reasoning Block, Text Formatting and Overlays sliders now read their range, step and unit from `NUM_RANGE`, so the menu, the applied value and the theme file limits can't drift apart. The other pages follow, one page per PR, each with a plan first.

- [ ] Banner, then Avatars. Some Banner sliders are saved per character (crop, overlap offset) and have their limits written in the menu and in `cleanStore`; they read the same ranges through `cardNum`, like the Overlays size. Avatars' Move Horizontal and Vertical keep a narrower slider range than their saved limit, both in one entry.
- [ ] Visual Novel Mode and opening video sliders in `vn.js` and `opening.js`, reading `NUM_RANGE` through `window.NTR`.
- [ ] Every piece keeps setting names, defaults and the menu layout the same, and is compared on `main` and the branch with `/run-ntr-extension`.

## Ideas

- Built-in cursor. An arrow drawn in code with its own color, for people without a cursor image (Custom Cursor in UI Display).
- Banners in group chats. The shared Global banner could show in group chats too, which have no banner now.
  - Open questions: whether a group can have its own banner like Char; where Lock to top and Overlap are saved for a group.
- Chapters and save points. In Visual Novel Mode, each message is a chapter.
  - Title from a `[[Chapter:Name]]` tag, or "Chapter 1", "Chapter 2" and so on without one.
  - Title card when a chapter starts.
  - Chapter list to jump to any chapter.
  - "Branch from here" on each chapter, using SillyTavern's own branching, so a chapter can be replayed in a new branch.
  - Open question: what SillyTavern makes available to extensions for creating a branch.
- Regex. Some functions of SillyTavern's Regex extension, but not regex used to output HTML or CSS. Visual Novel Mode reads the saved message text, so SillyTavern regex that only changes the display has no effect on the VN dialogue box.
  - Open questions: which functions to include (find and replace, trim out, AI or user messages, depth, per character or global, on/off per script); whether it affects only the VN dialogue box or also the normal chat; whether it runs before NTR reads the tags (so it can fix or rename tags) or after (so it only changes the text shown).
- Graphic borders around profiles. Decorative image frames around profile pictures, beyond the current plain border and shape choices.
  - Open questions: which pictures get them (chat avatars, avatar backdrop, avatar pop-out, VN portrait box); built-in frames drawn in code like the default art, uploaded frames, or both; how a frame fits each shape (round, rounded, square, tall); per character, global, or saved in themes.
- Graphic borders around the UI. Decorative image borders around interface parts, stretched to fit any size.
  - Open questions: which parts (VN dialogue box, name tag, choice buttons, map window, NTR menu, SillyTavern's chat messages); built-in, uploaded, or both; one border style for all parts or one per part; saved in themes.
- Folder of pre-generated locations. A set of ready-made location backgrounds included with the extension, to pick from when adding a location.
  - Open questions: where the images come from and their license; how many, since every install downloads them; how they're picked (a gallery in the Locations menu); whether a picked image is copied into the user's own files or used from the extension folder (a card that uses the extension folder breaks if someone installed the extension under a different folder name).
- NTR Visual Novel Card Maker. Undecided whether it belongs in this extension or should be its own. Most useful for cards that are not open world, where people need to set up different chapters and endings.
  - For the author and for everyone else, so it needs to be friendly for first-time card makers.
  - Fills in the card and tag setup, and also validates it (for example an ending that can't be reached, or a flag that is never set).
  - Uses the `[[Chapter:Name]]` tag from Chapters and save points, where a chapter is one message. A chapter can say what is unlocked (locations, characters, required flags), and endings become a chapter plus flags.
  - Leaning towards an isolated module in this repo, split out later if it earns it. A standalone page that exports the card is the other option.
  - Own menu, separate from the settings menu. Reads and writes the same per-character data as the Visual Novel menu (speakers, emotions, locations, CGs, maps).
  - Open question: how it is opened (a button in the NTR menu, its own button next to the VN toggle, or its own entry in the Extensions panel).
- Ending credits. Would follow the ending title card from Flags and endings.
  - Open questions: where the text comes from (typed per character in the menu, built from speakers, locations and CGs, or both); music or video behind it; what starts it (only an ending tag, or also a button); whether it can be skipped.

## Low priority

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

### Visual Novel Mode: new replies
Found while checking the typewriter effect with streaming, which works fine. Each was seen in a local SillyTavern.

- [ ] With streaming on and Visual Novel Mode off, emotion tags (like `%%Happy`) show in the normal chat until the reply finishes. The code that hides them waits for the chat to stop changing, and a stream keeps changing it.

### User Instructions
- [ ] Visual instructions (screenshots) for installing extensions in SillyTavern, in general.
