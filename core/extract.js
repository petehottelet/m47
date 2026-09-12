// Takes an existing DOM; never fetches a URL, executes scripts, or returns raw HTML.
export function extractSpec(document) {
  const root = document.querySelector('article') || document.querySelector('main') || document.body;
  if (!root) throw new Error('No readable document body found.');
  const clone = root.cloneNode(true);
  clone
    .querySelectorAll(
      'script,style,nav,aside,footer,form,button,input,textarea,select,iframe,[hidden],[aria-hidden="true"]',
    )
    .forEach((n) => n.remove());
  const title = (document.querySelector('h1')?.textContent || document.title || 'Imported article')
    .trim()
    .slice(0, 120);
  const paragraphs = [...clone.querySelectorAll('p,h2,h3,li,pre,blockquote')]
    .filter((n) => !n.parentElement?.closest('li,pre,blockquote'))
    .map((n) => n.textContent.trim())
    .filter(Boolean);
  const text = (paragraphs.length ? paragraphs.join('\n\n') : clone.textContent.trim()).slice(
    0,
    50000,
  );
  if (!text)
    throw new Error(
      'No readable text found. Try a page with an article or paste text into the editor.',
    );
  return {
    title,
    subtitle: 'Imported locally · review extracted text',
    sections: [{ type: 'text', title: 'Article', text }],
  };
}
