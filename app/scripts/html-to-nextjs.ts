// html-to-nextjs.ts
// Node.js script to convert HTML to Next.js + React + Tailwind + Framer Motion + TypeScript
// This is a minimal proof-of-concept for a single page.

import fs from 'fs';

import * as cheerio from 'cheerio';
import { Element as DomElement, Text, Comment, isTag, isText, isComment, AnyNode } from 'domhandler';

const html = fs.readFileSync('input.html', 'utf-8');
const $ = cheerio.load(html);

function mapStyleToTailwind(style: string): string {
  // Very basic mapping for demo; real mapping would be much more complex
  if (!style) return '';
  let classes = [];
  if (style.includes('color: red')) classes.push('text-red-500');
  if (style.includes('font-size: 24px')) classes.push('text-2xl');
  return classes.join(' ');
}
function convertElement(node: AnyNode): string {
  if (isText(node)) return node.data || '';
  if (isComment(node)) return `{/* ${node.data} */}`;
  if (!isTag(node)) return '';
  const tag = node.tagName;
  let children = '';
  if (node.children) children = node.children.map(convertElement).join('');

    // Map styl to Tailwind
  const style = $(node).attr('style') || '';
  const className = [$(node).attr('class') || '', mapStyleToTailwind(style)].filter(Boolean).join(' ');

  if (tag === 'img') {
    const src = $(node).attr('src') || '';
    const alt = $(node).attr('alt') || '';
    return `<Image src="${src}" alt="${alt}" width={100} height={40} className="${className}" />`;
  }
  if (tag === 'a') {
    const href = $(node).attr('href') || '#';
    return `<Link href="${href}" className="${className}">${children}</Link>`;
  }
  if (tag === 'div' && className.includes('header')) {
    // Example: wrap header in Framer Motion
    return `<motion.div className="${className}" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>${children}</motion.div>`;
  }
  return `<${tag} className="${className}">${children}</${tag}>`;
}

const body = $('body').get(0);
const jsx = body && 'children' in body && Array.isArray(body.children)
  ? body.children.map(convertElement).join('\n')
  : '';

const output = `
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Page() {
  return (
    <div>
      ${jsx}
    </div>
  );
}
`;

fs.writeFileSync('output.tsx', output);
console.log('Converted to output.tsx');
