import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownRenderer } from '@/components/notes/MarkdownRenderer';

describe('MarkdownRenderer Component Security & Feature Tests', () => {
  it('renders headings correctly (h1, h2, h3, h4)', () => {
    const content = '# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('Heading 1');
    expect(html).toContain('Heading 2');
    expect(html).toContain('Heading 3');
    expect(html).toContain('Heading 4');
    expect(html).toContain('<h1');
    expect(html).toContain('<h2');
    expect(html).toContain('<h3');
    expect(html).toContain('<h4');
  });

  it('renders bold, italic, and strikethrough inline elements', () => {
    const content = 'This is **bold text**, this is *italic text*, and ~~strikethrough~~.';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('<strong class="font-bold text-on-surface">bold text</strong>');
    expect(html).toContain('<em class="italic text-on-surface">italic text</em>');
    expect(html).toContain('<del class="line-through text-on-surface-variant/75">strikethrough</del>');
  });

  it('renders code blocks and inline code securely', () => {
    const content = 'Inline `const x = 10;`\n\n```typescript\nconst message = "Hello";\nconsole.log(message);\n```';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('<code');
    expect(html).toContain('const x = 10;');
    expect(html).toContain('<pre');
    expect(html).toContain('const message = &quot;Hello&quot;;');
  });

  it('renders links with rel="noopener noreferrer" and target="_blank"', () => {
    const content = 'Visit [Manageo App](https://manageo.app) now!';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('href="https://manageo.app"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Manageo App');
  });

  it('renders bullet lists and numbered lists', () => {
    const content = '- Item A\n- Item B\n\n1. First Step\n2. Second Step';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('<ul class="list-disc list-inside space-y-1 my-2 pl-1">');
    expect(html).toContain('Item A');
    expect(html).toContain('Item B');
    expect(html).toContain('<ol class="list-decimal list-inside space-y-1 my-2 pl-1">');
    expect(html).toContain('First Step');
    expect(html).toContain('Second Step');
  });

  it('renders interactive checklists properly', () => {
    const content = '- [ ] Pending task\n- [x] Completed task';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked=""');
    expect(html).toContain('Pending task');
    expect(html).toContain('Completed task');
  });

  it('renders blockquotes and dividers safely', () => {
    const content = '> Knowledge is power.\n\n---\n\nNext section';
    const html = renderToStaticMarkup(<MarkdownRenderer content={content} />);

    expect(html).toContain('<blockquote');
    expect(html).toContain('Knowledge is power.');
    expect(html).toContain('<hr class="my-4 border-surface-container-highest"/>');
  });
});
