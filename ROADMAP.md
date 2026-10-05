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

### Custom cursor (UI Display)
Follows the scrollbar settings (see **Done**).

- [ ] Upload a cursor image (through `uploadImage`), with a Size slider and a click point picked on the 3x3 grid.
- [ ] Two slots: Normal, and Pointer for buttons and links. An empty Pointer slot keeps the system hand. The text cursor in typing boxes stays the system one.
- [ ] New `ov*` settings keys, saved in themes with the cursor images embedded on export.
- [ ] Later: a built-in arrow drawn in code with its own color, for people without a cursor image.

## Ideas

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

### Menu Icons
- [ ] Redo the icons on the title headers in the menu.

### Typewriter effect with streaming
- [ ] Visual Novel Mode's typewriter effect with streaming turned on in SillyTavern may cause problems. Not confirmed yet.

### User Instructions
- [ ] Visual instructions (screenshots) for installing extensions in SillyTavern, in general.

## Done

Finished items, newest first.

### Quicker ways to open the menu
- [x] **Show in the wand menu** checkbox at the bottom of UI Display adds Nitwit Tavern Redesign to SillyTavern's wand menu next to the chat box. Off by default; works even when UI Display is off. New settings key `wandEntry`, not saved in themes.
- [x] `/ntr` (or `/NTR`) typed in the chat box opens the menu.
- [x] Both open the menu even when NTR is powered off. The Extensions page bar stays as it was.

### Scrollbar (UI Display)
- [x] New **Scrollbar** part in UI Display: Scrollbar Color, Track Color, Scrollbar Width (4 to 20 px) and Scrollbar Shape (Pill, Rounded, Square). Each has a checkbox; unticked means SillyTavern's look.
- [x] Changes every scrollbar in SillyTavern, the NTR menu and Visual Novel Mode included. Firefox changes only the colors and width (thin or normal); phones mostly keep their own scrollbars.
- [x] Saved in themes with the rest of UI Display. A theme file with a color or shape that isn't valid has it left out. New settings keys only.

### Menu names and Overall Font Scale
- [x] "Display Overrides" is now **UI Display**, and "Reasoning Block" is now **Reasoning Block Design**, so it's clear the section only changes how the block looks.
- [x] Reasoning Block Design explains which SillyTavern setting makes the block show up: "Request model reasoning" (Chat Completion) or "Auto-Parse" (Text Completion).
- [x] Font Scale moved from UI Display to the top of Text Formatting as **Overall Font Scale**, with a note that it scales all of SillyTavern's text. It now follows the Text Formatting switch. Same settings keys, so saved configs keep working.
- [x] Themes keep Overall Font Scale with Text Formatting. Themes saved or exported before keep working.

### Theme bar and removing NTR data
- [x] Themes are picked from a dropdown that's there from the first install. Its first entry, **None (default look)**, can't be renamed or deleted; picking it resets the look to the defaults. The separate Reset button is gone.
- [x] Naming, renaming, deleting, saving over and applying themes ask right in the menu instead of in browser popups. A taken or empty name shows a red hint before anything is saved.
- [x] Themes now hold the Global banner rotation (in Banner look) and the Global banner itself (images, YouTube link, video) as its own section. Older theme files leave both as they are.
- [x] SillyTavern's "Also clean up extension data" option when deleting the extension (the manifest's `clean` hook): removes settings, themes and the uploaded files no character card still uses. Character cards stay as they are.
- [x] New **Data** section at the bottom of the menu with **Remove NTR data**: settings and themes, and/or uploaded files and the NTR data in every character card. Asks first, then reloads the page.

### Shared Global banner
- [x] Global has its own banner: an image gallery (each image with its own Crop), a YouTube link and a video, shown on every character set to Global. Saved under a new settings key `bannerGlobal` (existing keys untouched).
- [x] Char keeps the character's own banner in its card. Lock to top, Overlap messages and Overlap offset stay per character.
- [x] The menu edits the shared banner on Global and the character's own on Char. The shared banner can be edited without a chat open.
- [x] A character switched from Char to Global keeps its own images in its card, so switching back brings them back.
- [x] Updating: a character on Global that already had its own images, YouTube link or video switches to Char, keeping its kind, rotation and look, so nothing on screen changes. Checked once per card (new card field `banner.sharedChecked`), also for cards made with an older version.

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
