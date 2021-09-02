// ==UserScript==
// @name         Open GWAS One Page
// @namespace    https://github.com/Kaiyokun/
// @version      0.3
// @description  Display all results on one page.
// @author       Kaiyokun
// @include      /^https:\/\/gwas.mrcieu.ac.uk\/datasets\/\?((?!page=\d+).)*$/
// @icon         https://www.google.com/s2/favicons?domain=mrcieu.ac.uk
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.fastgit.org/Kaiyokun/OpenGWAS/master/OpenGWAS-OnePage.user.js
// @downloadURL  https://raw.fastgit.org/Kaiyokun/OpenGWAS/master/OpenGWAS-OnePage.user.js
// @supportURL   https://github.com/Kaiyokun/OpenGWAS/issues
// ==/UserScript==

(async () => {
  'use strict';

  const select = (css, parent = document) => parent.querySelector(css);

  const selectAll = (css, parent = document) => Array.from(parent.querySelectorAll(css));

  const create = (tag, doc = document) => doc.createElement(tag);

  const setStyle = (element, style) => {
    for (const s in style) {
      element.style[s] = style[s];
    }
    return element;
  };

  const setAttr = (element, attr) => {
    for (const a in attr) {
      if ('style' === a) {
        setStyle(element, attr[a]);
      }
      else if (a.startsWith('_')) {
        element[a.slice(1)] = attr[a];
      }
      else {
        element.setAttribute(a, attr[a]);
      }
    }
    return element;
  };

  const loadPage = async href => new Promise(resolve =>
    document.body.appendChild(setAttr(create('iframe'), {
      src: href,
      _onload: ({ target: iframe }) => resolve(iframe)
    }))
  );

  const getNextPageAll = () => selectAll(
    '#search > div > nav > ul > li[class="page-item"] > a'
  ).map(({ href }) => href);

  const loadNextPageAll = async () => {
    const tbody = select('#search > div > table > tbody');
    const href = getNextPageAll();
    const [, url, begin] = href[0].match(/^(.+page=)(\d+)$/);
    const end = href[href.length - 1].match(/page=(\d+)$/)[1];
    for (let i = begin; i <= end; ++i) {
      const iframe = await loadPage(`${url}${i}`);
      selectAll(
        '#search > div > table > tbody > tr',
        iframe.contentDocument
      ).forEach(tr => tbody.appendChild(tr));
      iframe.remove();
    }
    select('#search > div > nav').remove();
  };

  const getColumnCatalogs = tbody => {
    const years = new Set();
    const consortiums = new Set();
    for (const row of tbody.children) {
      const [, year, , consortium] = Array.from(row.children).map(td => td.innerText);
      years.add(year);
      consortiums.add(consortium);
      setAttr(row, { year, consortium });
    }
    return { years, consortiums };
  };

  const createSelect = (name, catalog) => {
    const select = setAttr(create('select'), {
      name,
      style: { display: 'block' }
    });
    select.add(setAttr(create('option'), { value: '', _text: '全选' }));
    for (const item of Array.from(catalog).sort()) {
      select.add(setAttr(create('option'), { value: item, _text: item }));
    }
    return select;
  };

  const main = async () => {
    await loadNextPageAll();

    const tbody = select('#search > div > table > tbody');
    const { years, consortiums } = getColumnCatalogs(tbody);
    const ys = createSelect('year', years);
    const cs = createSelect('consortium', consortiums);
    const onSelect = () => {
      const css = [ys, cs].map(s => {
        const attr = s.getAttribute('name');
        const val = s.value ? `="${s.value}"` : '';
        return `[${attr}${val}]`;
      }).join('');
      selectAll('tr', tbody).forEach(tr => tr.hidden = false);
      selectAll(`tr:not(${css})`, tbody).forEach(tr => tr.hidden = true);
    };
    select('#search > div > table > thead > tr > th:nth-child(2)')
      .appendChild(setAttr(ys, { _onchange: onSelect }));
    select('#search > div > table > thead > tr > th:nth-child(4)')
      .appendChild(setAttr(cs, { _onchange: onSelect }));
  };

  return main();
})();