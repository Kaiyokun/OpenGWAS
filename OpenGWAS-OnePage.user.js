// ==UserScript==
// @name         Open GWAS One Page
// @namespace    https://github.com/Kaiyokun/
// @version      0.2
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

  const loadPage = async href => new Promise(resolve => {
    const iframe = create('iframe');
    iframe.setAttribute('src', href);
    iframe.addEventListener('load', () => resolve(iframe));
    document.body.appendChild(iframe);
  });

  const getNextPageAll = () => selectAll(
    '#search > div > nav > ul > li[class="page-item"] > a').map(({ href }) => href);

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

  return loadNextPageAll();
})();