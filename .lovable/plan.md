

## Fix Image Uploads & Add Multi-Image Support with Reordering

### Problems Found

1. **Images break on save**: The sanitization config (`sanitization.ts`) strips `style` attributes and `data-*` attributes. When images are inserted with inline styles (`width: 50%`, `margin: 1rem auto`, `border-radius: 8px`), those styles are removed on save, causing images to render at full size with no formatting.

2. **Image upload button is hidden**: The `ImageUploadButton` component has `className="hidden"` on the button itself, making it invisible. There's no way for users to insert inline images.

3. **No multi-image or reordering support**: Images can be inserted but there's no UI to move them between text blocks.

### Plan

#### Step 1: Fix image styling to survive sanitization
- **File**: `src/lib/sanitization.ts` — Add `'data-image-id'` to allowed attributes and add `'style'` to `ALLOWED_ATTR` only for `img` tags using a DOMPurify hook (or switch to CSS classes)
- **File**: `src/index.css` — Add a `.note-image` CSS class with the styling (50% width, auto height, block display, centered, rounded corners) so images don't need inline styles
- **File**: `src/components/notes/NoteEditor.tsx` — Update `insertImageAtCursor` to use CSS classes instead of inline styles

#### Step 2: Make image upload accessible & support multiple images
- **File**: `src/components/notes/NoteEditor.tsx` — Add an image upload button to the editor UI (e.g., in the floating bar or as a persistent button near the editor). Allow multiple images by keeping the upload flow the same but not restricting to one.
- **File**: `src/components/notes/FloatingFormatBar.tsx` — Add an image upload icon to the floating format bar so users can insert images at the cursor position

#### Step 3: Add image reordering arrows
- **File**: `src/components/notes/NoteEditor.tsx` — Add click/hover handlers on images in the editor that show up/down arrow buttons in the top-left corner of each image. Clicking an arrow swaps the image with the adjacent block element (paragraph, heading, etc.) above or below it. This uses DOM manipulation (`insertBefore`/`insertAfter`) and triggers a save.

### Technical Details

- **CSS-based styling**: Replace all inline `style` attributes on images with the `.note-image` class. CSS rule: `img.note-image { width: 50%; height: auto; display: block; margin: 1rem auto; border-radius: 8px; }`
- **Sanitization**: Keep `style` in `FORBID_ATTR` for security. Instead, whitelist `data-image-id` via a DOMPurify `afterSanitizeAttributes` hook, and rely on `.note-image` class for styling.
- **Reordering**: On image click/hover, render floating arrow buttons. Moving an image swaps its DOM position with the previous/next sibling block element, then dispatches an `input` event to trigger auto-save.
- **Upload flow**: Reuse existing `ImageUploadButton` logic but trigger it from the floating format bar or a dedicated button below the editor.

