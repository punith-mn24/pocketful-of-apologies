# Editable Surprise Settings

## Goal
Add a settings panel inside the experience so the nickname, apology message, and every balloon message can be changed without editing code or rebuilding.

## What will change
- Add a small settings icon to the top bar that opens a polished slide-over panel on desktop and a full-height sheet on phones.
- Move nickname selection/custom nickname, the 600-character apology message, and all balloon message fields into this panel.
- Keep the landing screen focused on the sender name and optional photos, with a clear shortcut to open settings.
- Save settings automatically in the browser so edits survive refresh and replay.
- Make the letter, balloon reveals, and final screen read the saved settings immediately.
- Include validation, character counters, restore-defaults, close, and save controls.

## Technical details
- Extend the existing persisted personalization data with editable balloon messages while safely merging older saved data.
- Reuse the current visual tokens, motion style, and accessible focus behavior.
- Prevent empty nickname, apology, or balloon fields from being saved.
- Verify opening, editing, saving, refresh persistence, balloon reveals, and mobile/desktop layouts with no horizontal overflow or console errors.
