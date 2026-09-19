# Inline Arc Editing in the Format Bar

## Goal
Let writers highlight text and ask Arc to improve only that selection without opening the full chat. The existing Arc bubble remains available for longer conversations.

## Experience
1. Add the current Arc AI logo to the selection format bar beside the writing controls.
2. Selecting Arc expands the bar into a compact editor anchored near the highlighted text.
3. Offer fast actions:
   - Improve
   - Make shorter
   - Make longer
   - Fix writing
   - Rewrite
   - Custom instruction
4. Preserve the exact selected range while the Arc menu is open and while the request runs.
5. Show an animated “Arc is editing…” state without hiding the selected text.
6. Present a focused before/after preview with the original text muted and Arc’s suggestion emphasized.
7. Provide clear actions: **Replace**, **Try again**, and **Cancel**. Replacing changes only the selected text.
8. After replacement, keep the editor focused and make the change immediately reversible through the existing Undo/Redo buttons and keyboard shortcuts.

## Interaction Details
- Clicking outside or pressing Escape closes the Arc editor without changing the note.
- Enter submits a custom instruction; Shift+Enter adds a line.
- Prevent duplicate requests while Arc is working.
- Keep the panel inside the viewport on desktop and mobile, repositioning above or below the selection when needed.
- If the selected text changed before acceptance, stop and explain that the selection is no longer available rather than editing the wrong sentence.
- Respect read-only notes and the existing “AI features” preference.
- Use the existing Arc AI mark and the app’s semantic colors in every theme.
- Use a short scale/fade transition for opening, a restrained shimmer while working, and a smooth crossfade into the suggestion. Respect reduced-motion settings.

## Implementation
- Extend `FloatingFormatBar` with an Arc trigger and an expanded inline-edit state.
- Add a small focused component for action choices, custom instructions, loading, preview, and error states instead of growing the toolbar file further.
- In `NoteEditor`, capture both the DOM range and exact selected text before focus leaves the editor. Restore that range only after validating its current contents.
- Send the selected text, requested action, and limited surrounding context through the existing authenticated `ai-assist` function. Add an explicit inline-edit request mode so the response is only the replacement text, not chat prose or an `arc-edits` block.
- Sanitize the returned inline formatting before previewing or inserting it.
- Replace the selected range directly, dispatch the normal editor input/save flow, and call the existing note snapshot callback so one undo restores the pre-Arc version and redo reapplies it.
- Keep inline requests out of chat history; the chat panel’s conversations remain unchanged.

## Validation
- Test every quick action and a custom instruction on one sentence, multiple sentences, formatted text, and text spanning inline formatting.
- Verify only the selection changes and surrounding note structure remains intact.
- Verify Undo/Redo after accept, including keyboard shortcuts.
- Verify cancel, retry, stale-selection protection, loading, error, and signed-out states.
- Verify placement and text fit on desktop and mobile in light and dark themes.
