> [!WARNING]
> This extension is in beta. Use it at your own risk.

# Nitwit Tavern Redesign

Nitwit Tavern Redesign is a SillyTavern extension that changes how your chats look. It adds header banners, profile picture styling, foreground images, display overrides, saveable themes, and an optional Visual Novel Mode with choices, effects, CG scenes, maps, and opening videos. All settings are in one menu.

## Header Banner

Adds a banner above the chat for each character.

- **Modes:** Image Gallery, YouTube Loop, or Off.
- **Image Gallery:** upload several images per character, step through them, and set the crop position for each image.
- **YouTube Loop:** set a YouTube URL per character.
- **Layout:** banner height (60 to 350 px), gap below the banner (0 to 40 px), lock to top, and an option to overlap messages with an offset (0 to 300 px).
- **Transparent areas:** show either the wallpaper or the chat panel tint.
- Banners work in single-character chats only, not in group chats.

## Foreground Images

Adds image overlays on the left, center, and right of the screen. Each position has its own upload and size (10 to 300%). Opacity is set for all three. You can hide them in Visual Novel Mode, or set each one to appear behind or in front of the sprites there.

## Pfp Management

Styles the AI and user profile pictures separately. Each can use one of two styles:

- **Backdrop:** a faded image behind the message text, with controls for position, fit (Fill, Fit, Original), scale, text padding, top, bottom, left, and right fades, blur, and whether the message background is kept.
- **Pop Out:** a free-floating image that you drag to any position on the screen.

## Display Overrides

Changes SillyTavern's own display settings without editing them. Unticking an override returns to SillyTavern's value.

- Make the chat panel transparent.
- Chat width, font scale, blur strength, and shadow width.
- Chat style: Flat, Bubbles, or Document.
- Avatar shape: Round, Rectangle, Square, or Rounded.

## Themes

A theme stores your current look: Pfp styling, banner height and gap, the Visual Novel box, tags, default art, and display overrides. Character content such as banner images is not part of a theme. You can save, update, rename, delete, import, export, and reset themes.

## Visual Novel Mode

Shows chat messages one line at a time in a dialogue box, with sprites, backgrounds, and scene tags. Visual Novel data is saved per character (or per group).

- **Dialogue box:** typewriter effect with adjustable speed, auto-advance, portrait in the box, and adjustable opacity, size, height, text size, and shape.
- **Speakers and portraits:** character cards and your persona are matched by name. Each speaker can have a portrait per emotion, and you can add custom speakers. Sprites appear on stage and dim while someone else talks.
- **Emotions:** an editable list (Neutral, Happy, Sad, Angry, Surprised, and Dead by default) with a default emotion.
- **Tags and delimiters:** the characters and keywords that mark speakers, narration, emotions, locations, effects, weather, CGs, and choices can all be changed. Tags can be hidden in the normal chat view, and a speaker and emotion picker can be shown above the input box.
- **Locations:** background images matched to location tags.
- **CG scenes:** full-screen illustrations matched to CG tags.
- **Choices:** shown as buttons, with an option to send the choice immediately.
- **Effects and weather:** Shake, Flash, and Fade effects, and Rain, Snow, and Clear weather.
- **Default art:** built-in backgrounds and sprites, drawn in code, that are used until you upload your own.
- **Prompt for your LLM:** instructions that explain the tags are added to every request automatically. This can be turned off if you prefer to paste the instructions into your own preset.
- **Maps:** upload map images and place pins that link to locations or to other maps (for example, city, then building, then room). Visited places are marked and the current place is highlighted. A Map button is added to the dialogue box.
- **Opening video:** plays before the story, from a YouTube link or an uploaded video file (mp4 or webm). You choose when it plays: the first time a new chat starts, every time the chat opens, or every time Visual Novel Mode is switched on. It can end on a logo (the banner image or an uploaded logo) with an adjustable position, and it has a START button and a Skip button.
