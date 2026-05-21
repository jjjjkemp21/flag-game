import React from 'react';

// Minimal, dependency-free, XSS-safe Markdown renderer for announcement bodies.
// Supports: # / ## / ### headings, **bold**, *italic*, `code`, - bullet lists,
// > blockquotes, and blank-line-separated paragraphs. Builds React elements
// directly (no dangerouslySetInnerHTML), so author content can't inject markup.

function renderInline(text, keyPrefix) {
    const nodes = [];
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
    let last = 0;
    let m;
    let i = 0;
    while ((m = regex.exec(text)) !== null) {
        if (m.index > last) nodes.push(text.slice(last, m.index));
        if (m[2] !== undefined) nodes.push(<strong key={`${keyPrefix}-${i}`}>{m[2]}</strong>);
        else if (m[3] !== undefined) nodes.push(<em key={`${keyPrefix}-${i}`}>{m[3]}</em>);
        else if (m[4] !== undefined) nodes.push(<code key={`${keyPrefix}-${i}`} className="md-code">{m[4]}</code>);
        last = m.index + m[0].length;
        i++;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
}

export default function Markdown({ children, className = '' }) {
    const text = String(children || '').replace(/\r\n/g, '\n');
    const lines = text.split('\n');
    const blocks = [];
    let list = null;
    let quote = null;
    let para = null;
    let key = 0;

    const flushList = () => {
        if (list) { blocks.push(<ul className="md-list" key={key++}>{list}</ul>); list = null; }
    };
    const flushQuote = () => {
        if (quote) { blocks.push(<blockquote className="md-quote" key={key++}>{quote}</blockquote>); quote = null; }
    };
    const flushPara = () => {
        if (para && para.length) {
            blocks.push(<p className="md-p" key={key++}>{renderInline(para.join(' '), `p${key}`)}</p>);
            para = null;
        }
    };
    const flushAll = () => { flushList(); flushQuote(); flushPara(); };

    lines.forEach((raw) => {
        const line = raw.trimEnd();
        if (!line.trim()) { flushAll(); return; }

        const h = line.match(/^(#{1,3})\s+(.*)$/);
        if (h) {
            flushAll();
            const level = h[1].length;
            const Tag = `h${level + 1}`;
            blocks.push(<Tag className={`md-h md-h${level}`} key={key++}>{renderInline(h[2], `h${key}`)}</Tag>);
            return;
        }
        if (/^[-*]\s+/.test(line)) {
            flushQuote(); flushPara();
            if (!list) list = [];
            list.push(<li className="md-li" key={key++}>{renderInline(line.replace(/^[-*]\s+/, ''), `li${key}`)}</li>);
            return;
        }
        if (/^>\s?/.test(line)) {
            flushList(); flushPara();
            if (!quote) quote = [];
            quote.push(<span key={key++}>{renderInline(line.replace(/^>\s?/, ''), `q${key}`)}</span>);
            return;
        }
        flushList(); flushQuote();
        if (!para) para = [];
        para.push(line);
    });
    flushAll();

    return <div className={`md ${className}`.trim()}>{blocks}</div>;
}
