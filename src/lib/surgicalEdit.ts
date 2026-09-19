/**
 * Surgical edits: Arc can return precise sentence-level edits instead of
 * rewriting a whole note. Each edit names the exact original text and its
 * replacement; we locate that text inside the note's HTML and swap only it,
 * leaving every other character (and all formatting) untouched.
 */

export type ArcEdit = {
  id: string;
  find: string;
  replace: string;
  reason?: string;
};

const EDIT_BLOCK = /```arc-edits\s*([\s\S]*?)```/g;

/** Pull any arc-edits blocks out of an assistant message. */
export function parseArcEdits(text: string): { edits: ArcEdit[]; cleaned: string } {
  const edits: ArcEdit[] = [];
  let cleaned = text;
  let match: RegExpExecArray | null;
  EDIT_BLOCK.lastIndex = 0;
  while ((match = EDIT_BLOCK.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const list = Array.isArray(parsed) ? parsed : parsed?.edits;
      if (Array.isArray(list)) {
        list.forEach((e: any, i: number) => {
          if (typeof e?.find === 'string' && typeof e?.replace === 'string' && e.find.trim()) {
            edits.push({
              id: `${match!.index}-${i}`,
              find: e.find,
              replace: e.replace,
              reason: typeof e.reason === 'string' ? e.reason : undefined,
            });
          }
        });
      }
    } catch {
      // Ignore malformed blocks; the prose still renders.
    }
    cleaned = cleaned.replace(match[0], '');
  }
  return { edits, cleaned: cleaned.trim() };
}

const normalize = (s: string) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, ' ');

type Mapped = { text: string; map: { node: Text; offset: number }[] };

function mapTextNodes(root: HTMLElement): Mapped {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let text = '';
  const map: { node: Text; offset: number }[] = [];
  let lastWasSpace = true;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const t = node as Text;
    const raw = normalize(t.data);
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === ' ' && lastWasSpace) continue;
      lastWasSpace = ch === ' ';
      text += ch;
      map.push({ node: t, offset: Math.min(i, t.data.length - 1) });
    }
  }
  return { text, map };
}

/**
 * Replace `find` with `replace` inside `html`, matching on visible text only
 * so surrounding markup survives. Returns null when the text isn't found.
 */
export function applySurgicalEdit(html: string, find: string, replace: string): string | null {
  const root = document.createElement('div');
  root.innerHTML = html;

  const { text, map } = mapTextNodes(root);
  const needle = normalize(find).trim();
  if (!needle) return null;

  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1 || map.length === 0) return null;

  const start = map[idx];
  const endEntry = map[Math.min(idx + needle.length - 1, map.length - 1)];
  if (!start || !endEntry) return null;

  const range = document.createRange();
  range.setStart(start.node, Math.min(start.offset, start.node.data.length));
  range.setEnd(endEntry.node, Math.min(endEntry.offset + 1, endEntry.node.data.length));
  range.deleteContents();

  if (replace.trim()) {
    const holder = document.createElement('div');
    holder.innerHTML = replace;
    const fragment = document.createDocumentFragment();
    while (holder.firstChild) fragment.appendChild(holder.firstChild);
    range.insertNode(fragment);
  }

  root.normalize();
  return root.innerHTML;
}

/** Apply several edits in order, skipping any that no longer match. */
export function applySurgicalEdits(html: string, edits: ArcEdit[]): { html: string; applied: number; missed: number } {
  let current = html;
  let applied = 0;
  let missed = 0;
  for (const edit of edits) {
    const next = applySurgicalEdit(current, edit.find, edit.replace);
    if (next === null) missed++;
    else {
      current = next;
      applied++;
    }
  }
  return { html: current, applied, missed };
}
