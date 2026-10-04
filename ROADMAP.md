# Roadmap [Beta]

Ideas and planned work for Nitwit Tavern Redesign. Tick a box when it ships; finished items move to **Done** so there is a record of what changed.

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
The sections themselves shipped (see **Done**). Still open:

- Separate themes for the normal chat and for Visual Novel Mode, so each can have its own look.
- A preset list of Google Fonts, each name shown in its own font.
- Uploading font files, so no outside request is needed.
- Text effects, second batch: Gradient and Shimmer (italics keep their own color; Shimmer stops with "reduce motion").
- Reasoning Block background image (upload or link, Cover or Tile, opacity, auto tint for readability), with Corners (Square, Rounded, Pill).
- Left out for now: line height, letter spacing, background color per part. Custom CSS covers these for the reasoning block.

### Install instructions
- [ ] Visual instructions (screenshots) for installing extensions in SillyTavern, in general. Not done until out of Beta.

## Ideas

- Chapters and save points. In Visual Novel Mode, each message is a chapter.
  - Title from a `[[Chapter:Name]]` tag, or "Chapter 1", "Chapter 2" and so on without one.
  - Title card when a chapter starts.
  - Chapter list to jump to any chapter.
  - "Branch from here" on each chapter, using SillyTavern's own branching, so a chapter can be replayed in a new branch.
  - Open question: what SillyTavern makes available to extensions for creating a branch.
- Regex. Some functions of SillyTavern's Regex extension, but not regex used to output HTML or CSS. Visual Novel Mode reads the saved message text, so SillyTavern regex that only changes the display has no effect on the VN dialogue box.
  - Open questions: which functions to include (find and replace, trim out, AI or user messages, depth, per character or global, on/off per script); whether it affects only the VN dialogue box or also the normal chat; whether it runs before NTR reads the tags (so it can fix or rename tags) or after (so it only changes the text shown).
- Graphic borders around profiles. Decorative image frames around profile pictures, beyond the current plain border and shape choices.
  - Open questions: which pictures get them (chat avatars, Pfp backdrop, Pfp pop-out, VN portrait box); built-in frames drawn in code like the default art, uploaded frames, or both; how a frame fits each shape (round, rounded, square, tall); per character, global, or saved in themes.
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

## Possible bugs

- Visual Novel Mode's typewriter effect with streaming turned on in SillyTavern may cause problems. Not confirmed yet. Low priority, check after Beta.

## Done

Finished items, newest first.

### Video files and links
- [x] Banner video from an uploaded mp4 or webm file: a new **Video** kind next to Image Gallery and YouTube Loop.
- [x] Banner video from a link to an mp4 or webm file.
- [x] Opening video from a link to an mp4 or webm file ("Video file or link").
- [x] Banner video saved under new per-character fields `banner.video` and `banner.videoPos` (existing keys untouched).
- [x] Loops with no controls. A speaker button on the banner turns sound on or off; the choice is saved right away (`bannerVideoSound`). If the browser blocks sound, it plays muted until clicked, without changing the choice.
- [x] Crop slider for the banner video.

### Reasoning Block and Text Formatting (PR #40)
- [x] New menu order: Themes, Header Banner, Pfp Management, Reasoning Block, Text Formatting, Display Overrides, Foreground Images, Visual Novel Mode.
- [x] Reasoning Block: font, size, weight, text color, italics color, border color, color strength.
- [x] Reasoning Block, Header Text: your own label for "Thinking...", "Thought for {time}" and "Thought for some time". `{time}` uses SillyTavern's wording.
- [x] Text Formatting: Names (color, font, size, weight), User Text and AI Text (font, size, main, italics, underline and quote colors).
- [x] "Enable Reasoning Block" and "Enable Text Formatting" switches; off greys out the section and keeps the settings.
- [x] Every setting has a checkbox; unticked means SillyTavern's own value. One note per section.
- [x] Sizes are a multiplier (0.5x to 2x) of SillyTavern's font size.
- [x] Fonts from the device or Google Fonts.
- [x] Text Formatting applies in the Visual Novel box: AI Text on the dialogue, Names on the name tag.
- [x] Both sections saved in themes. New settings keys only.
- [x] Display Overrides labels lose the word "Override".
