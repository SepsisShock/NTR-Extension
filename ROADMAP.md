# Roadmap

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

### Video files and links
- [ ] Banner video from an uploaded mp4 or webm file.
- [ ] Banner video from a link to an mp4 or webm file.
- [ ] Opening video from a link to an mp4 or webm file.
- [ ] Video links follow the privacy setting that blocks files from other websites.
- [ ] Banner video saved under a new per-character field (existing keys untouched).
- Open questions: a separate mode next to YouTube Loop, or one "Video" mode for links and files? Muted with no controls, or with controls?

### Install instructions
- [ ] Visual instructions (screenshots) for installing extensions in SillyTavern, in general.

### Typewriter effect and streaming
- [ ] Check for problems when Visual Novel Mode's typewriter effect is on and streaming is on in SillyTavern.
- [ ] Fix what turns up, or tell users to turn one of them off.

## Ideas

- Save points.
- NTR Visual Novel Card Maker. Undecided whether it belongs in this extension or should be its own. Most useful for cards that are not open world, where people need to set up different chapters and endings.
  - For the author and for everyone else, so it needs to be friendly for first-time card makers.
  - Fills in the card and tag setup, and also validates it (for example an ending that can't be reached, or a flag that is never set).
  - Possible `[[Chapter:Name]]` tag, worked out from the chat like locations. A chapter says what is unlocked (locations, characters, required flags), and endings become a chapter plus flags.
  - Leaning towards an isolated module in this repo, split out later if it earns it. A standalone page that exports the card is the other option.
  - Own menu, separate from the settings menu. Reads and writes the same per-character data as the Visual Novel menu (speakers, emotions, locations, CGs, maps).
  - Open question: how it is opened (a button in the NTR menu, its own button next to the VN toggle, or its own entry in the Extensions panel).
- Ending credits. Would follow the ending title card from Flags and endings.
  - Open questions: where the text comes from (typed per character in the menu, built from speakers, locations and CGs, or both); music or video behind it; what starts it (only an ending tag, or also a button); whether it can be skipped.

## Done

- (move finished items here, newest first)
