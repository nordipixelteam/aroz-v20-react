import React, { useLayoutEffect, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './react-shell.css';

// Original V19 page markup is parsed into actual React elements rather than
// inserted with dangerouslySetInnerHTML. This compatibility layer allows the
// existing page layouts to stay intact while components are refactored later.
const modules = import.meta.glob('./content/*.json', { eager: true, import: 'default' });
const pages = Object.fromEntries(Object.values(modules).map(page => [page.path, page]));

function getRoute() {
  let path = decodeURIComponent(window.location.pathname).replace(/^\/+/, '');
  if (!path || path === '/') return 'index.html';
  if (pages[path]) return path;
  if (pages[path + '/index.html']) return path + '/index.html';
  if (pages[path + 'index.html']) return path + 'index.html';
  return path;
}

function cssObject(cssText) {
  const object = {};
  for (const entry of cssText.split(/;(?![^()]*\))/)) {
    const colon = entry.indexOf(':');
    if (colon < 0) continue;
    const key = entry.slice(0, colon).trim();
    const value = entry.slice(colon + 1).trim();
    if (!key || !value) continue;
    const reactKey = key.startsWith('--') ? key : key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    object[reactKey] = value;
  }
  return object;
}

function toReact(node, key) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  if (['SCRIPT', 'STYLE'].includes(node.tagName)) return null;
  const props = { key };
  for (const attr of node.attributes) {
    let name = attr.name;
    if (name === 'class') name = 'className';
    else if (name === 'for') name = 'htmlFor';
    else if (name === 'tabindex') name = 'tabIndex';
    else if (name === 'readonly') name = 'readOnly';
    else if (name === 'maxlength') name = 'maxLength';
    else if (name === 'autocomplete') name = 'autoComplete';
    else if (name === 'srcset') name = 'srcSet';
    else if (name === 'crossorigin') name = 'crossOrigin';
    if (name === 'style') props.style = cssObject(attr.value);
    else if (name === 'checked') props.defaultChecked = true;
    else if (name === 'selected') props.defaultSelected = true;
    else if (name === 'value' && node.tagName === 'INPUT') props.defaultValue = attr.value;
    else if (['disabled', 'hidden', 'required', 'multiple', 'open', 'readOnly', 'autoFocus', 'noValidate', 'controls', 'loop', 'muted', 'playsInline'].includes(name)) props[name] = true;
    else if (name.startsWith('on')) continue; // never execute inline HTML handlers
    else props[name] = attr.value;
  }
  if (node.tagName === 'TEXTAREA') {
    props.defaultValue = node.value || node.textContent || '';
    return React.createElement('textarea', props);
  }
  if (node.tagName === 'OPTION') {
    if (node.selected) props.defaultSelected = true;
  }
  if (node.tagName === 'INPUT') return React.createElement('input', props);
  if (['IMG','BR','HR','META','LINK','SOURCE','AREA','BASE','COL','EMBED','PARAM','TRACK','WBR'].includes(node.tagName)) {
    return React.createElement(node.tagName.toLowerCase(), props);
  }
  const children = Array.from(node.childNodes).map((child, i) => toReact(child, i));
  return React.createElement(node.tagName.toLowerCase(), props, ...children);
}

function PageMarkup({ html }) {
  const nodes = useMemo(() => {
    const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    return Array.from(doc.body.childNodes).map((node, i) => toReact(node, i));
  }, [html]);
  return <>{nodes}</>;
}

function resolvePageUrl(relative) {
  // Relative URLs in V19 are intentionally preserved. Browsers resolve them
  // from the current folder, so all original nested pages work unchanged.
  return new URL(relative, window.location.href).href;
}

async function loadLegacyScripts(scripts, cancelled) {
  for (const item of scripts) {
    if (cancelled()) return;
    await new Promise(resolve => {
      const script = document.createElement('script');
      if (item.type) script.type = item.type;
      if (item.src) {
        script.src = resolvePageUrl(item.src);
        script.async = false;
        script.onload = resolve;
        script.onerror = () => { console.warn('Unable to load V19 script:', script.src); resolve(); };
      } else {
        script.text = item.code;
      }
      document.body.appendChild(script);
      if (!item.src) resolve();
    });
  }
}

function App() {
  const route = getRoute();
  const page = pages[route];
  useLayoutEffect(() => {
    if (!page) return;
    document.title = page.title;
    document.documentElement.lang = page.lang;
    document.body.className = page.bodyClass || '';
    for (const [key, value] of Object.entries(page.bodyAttributes || {})) {
      if (typeof value === 'string') document.body.setAttribute(key, value);
    }
    const description = document.querySelector('meta[name="description"]') || document.head.appendChild(document.createElement('meta'));
    description.name = 'description'; description.content = page.description;
    const robots = document.querySelector('meta[name="robots"]') || document.head.appendChild(document.createElement('meta'));
    robots.name = 'robots'; robots.content = page.robots;
    const nodes = [];
    for (const css of page.styles) {
      const style = document.createElement('style'); style.textContent = css;
      style.setAttribute('data-aroz-page', route); document.head.appendChild(style); nodes.push(style);
    }
    for (const headScript of page.headScripts || []) {
      if (headScript.type === 'application/ld+json') {
        const schema = document.createElement('script');
        schema.type = 'application/ld+json'; schema.textContent = headScript.code;
        schema.setAttribute('data-aroz-page', route); document.head.appendChild(schema); nodes.push(schema);
      }
    }
    for (const href of page.links) {
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = resolvePageUrl(href);
      link.setAttribute('data-aroz-page', route); document.head.appendChild(link); nodes.push(link);
    }
    return () => nodes.forEach(el => el.remove());
  }, [route]);
  useEffect(() => {
    if (!page) return;
    let cancelled = false;
    // V19 interaction scripts remain in place for fidelity to the original.
    loadLegacyScripts(page.scripts, () => cancelled).then(() => {
      if (!cancelled) {
        window.dispatchEvent(new Event('aroz:legacy-ready'));
        if (document.readyState === 'complete') window.dispatchEvent(new Event('load'));
      }
    });
    return () => { cancelled = true; };
  }, [route]);
  if (!page) return <main className="aroz-not-found"><h1>Seite nicht gefunden</h1><a href="/">Zur Startseite</a></main>;
  return <PageMarkup html={page.html}/>;
}

createRoot(document.getElementById('root')).render(<App />);
