# Pocketful Of Apologies

Create a beautiful, premium, fully responsive interactive apology/surprise website inspired by modern digital love-letter and apology experiences.

IMPORTANT:

Do NOT copy the source code, branding, text, assets, or exact design of any existing website.

Create an original design with a similar emotional, interactive experience.

The website must work perfectly on both mobile and desktop.

Prioritize smooth animations, polished UI, performance, and an emotional storytelling experience.

TECH STACK:

React + Vite

Tailwind CSS

JavaScript/TypeScript

Framer Motion or GSAP for animations

Lucide React icons

Use lightweight CSS/JS animations where appropriate

No unnecessary libraries

WEBSITE FLOW:

SCREEN 1 — LANDING / PERSONALIZATION

Create a beautiful minimal landing page.

Display:

"💌 A Little Something For You"

Subtitle:
"Something small, but straight from my heart."

Ask:
"What do I call you?"

Provide selectable options:

Babe

Jaan

Love

My Girl

Baby

Sunshine

Custom

If Custom is selected, show a text input.

Then ask:

"Your name"

Input:
"So you know who this is from"

Then:

"Your little note"

Large textarea with a 600-character limit.

Show a live character counter.

Add an optional photo upload section.

Allow the user to upload up to 2 photos.

Show image previews after uploading.

Add a "Create My Surprise ✨" button.

Use smooth entrance animations for every section.

SCREEN 2 — PREVIEW

After clicking the button, transition smoothly to a preview screen.

Show a digital envelope/card in the center.

Text:

"Something For You"

"Tap to open 💌"

The envelope should have:

3D-style appearance

subtle floating animation

soft glow

realistic opening animation

particles/hearts when opened

When the user clicks/taps the envelope, animate it opening.

SCREEN 3 — PERSONALIZED LETTER

Reveal a beautiful letter.

Display:

"Dear [nickname],"

Then display the user's personalized note.

Animate the text appearing gradually, like a handwritten/digital letter.

Add subtle background particles.

If a photo was uploaded, reveal it using a smooth image animation.

Add a button:

"There's more... →"

SCREEN 4 — MEMORY / PHOTO EXPERIENCE

Create a cinematic photo section.

If photos were uploaded:

Display the first photo prominently.

Display the second photo as a smaller memory card.

Use smooth fade, scale and slide animations.

Add subtle film-grain / light-leak effects.

If no photo was uploaded:

Show an animated heart or flower illustration instead.

Display small emotional messages such as:

"Some moments are worth keeping."

"Some people make ordinary days feel special."

Do not make the text overly cheesy.

SCREEN 5 — INTERACTIVE BALLOONS

Create a playful interactive section.

Title:

"Pop every balloon 🎈"

Subtitle:

"Each one holds something true."

Display 6–8 floating balloons.

Each balloon should contain a hidden short message.

Example messages:

"Thank you for being you."

"You make my days better."

"You're genuinely special to me."

"Some memories never get old."

"I'm lucky to have you."

"Here's to more moments together."

"a little something, just because."

When the user clicks/taps a balloon:

balloon pops

particle animation appears

message is revealed

small sound effect plays

remaining balloons continue floating

Make the interaction work properly on mobile touchscreens.

SCREEN 6 — FINAL SURPRISE

After all balloons are popped, transition into a beautiful final screen.

Create a large animated heart.

Show:

"One last thing..."

Then reveal:

"I'm really sorry."

Followed by the user's personalized message.

Then:

"Thank you for hearing me out. ❤️"

Add a subtle heart/confetti animation.

Add a button:

"Replay the Surprise ↻"

Clicking it should restart the experience from the beginning.

VISUAL DESIGN

Use a premium romantic aesthetic, but DO NOT make it look childish.

Design direction:

soft cream / warm white background

subtle pink and red accents

elegant typography

glassmorphism used sparingly

rounded cards

soft shadows

subtle gradients

cinematic transitions

lots of whitespace

minimal UI

premium mobile-first design

Use typography similar in feeling to:

Playfair Display for emotional headings

Inter or Manrope for body text

Do not use excessive emojis.

ANIMATIONS

Include:

fade-in

slide-up

scale-in

floating particles

floating hearts

envelope opening

letter reveal

image reveal

balloon floating

balloon popping

heart pulse

final celebration

smooth page transitions

Animations should feel smooth and elegant rather than excessive.

Use spring-based animations where appropriate.

Respect prefers-reduced-motion accessibility settings.

AUDIO

Add optional background music support.

Do NOT automatically play audio without user interaction.

Add a small music toggle button.

Allow the user to enable/disable background music.

Add subtle sound effects for:

envelope opening

balloon popping

final celebration

If no audio files are available, implement the system so audio files can easily be added later.

RESPONSIVENESS

The website must be optimized for:

iPhone

Android phones

tablets

laptops

desktop monitors

The entire experience should work with both:

mouse

touch

Do not rely only on hover interactions.

CODE QUALITY

Create a clean component structure:

src/
components/
LandingScreen
PersonalizationForm
Envelope
Letter
PhotoReveal
BalloonSection
FinalSurprise
MusicToggle
FloatingParticles

pages/
Home

hooks/
utils/
assets/

Keep components reusable.

Store all customizable messages in a single configuration object.

Make it very easy to change:

person's name

nickname

apology message

photos

colors

fonts

balloon messages

final message

Use localStorage so the user's entered information survives a page refresh.

Validate image uploads and limit file sizes.

Do not send uploaded photos to any external server.

FINAL REQUIREMENT

The finished website should feel like a small interactive digital experience rather than a normal webpage.

The user should feel like they are opening a personalized surprise.

Make the transitions cinematic, the interactions satisfying, and the final screen memorable.

Before finishing, test:

mobile layout

desktop layout

touch interactions

image uploads

page transitions

replay functionality

no console errors

no broken buttons

no horizontal scrolling

Return the complete working project with all required files and explain how to run it locally. ask me layout and design and colour will deciding

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5f443c26-bbd9-429d-bfed-fc34236198d8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
