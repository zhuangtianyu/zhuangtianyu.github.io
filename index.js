import { marked } from '/marked.esm.js';
import { contents } from '/articles/contents.js';

const getPageInfo = () => {
  let name = 'home';
  let params = {};
  const { pathname } = window.location;

  const articleMatch =
    pathname.match(/^\/article\/(\d+)$/) ||
    pathname.match(/^\/home\/article\/detail\/(\d+)$/);

  const aboutMatch = pathname.match(/^\/about$/);
  
  if (articleMatch) {
    name = 'article';
    params = { id: articleMatch[1] };
  }

  if (aboutMatch) {
    name = 'about';
    params = {};
  }

  return { name, params };
};

const contentsMap = contents.reduce((accumulator, item) => ({
  ...accumulator,
  [item.id]: item,
}), {});

const getArticle = async id => {
  if (!id) return null;
  const content = contentsMap[id] || null;
  if (!content) return null;
  try {
    const { body } = await import(`/articles/${id}.js`);
    const bodyFilled = body
      .replace(/\$title/g, content.title)
      .replace(/\$author/g, content.author)
      .replace(/\$time/g, content.time)
    return { ...content, body: bodyFilled };
  } catch {
    return null;
  }
};

const header = document.querySelector('.header');
const page = document.querySelector('.page');

const navs = [
  { path: '/', name: 'home', title: 'List' },
  { path: '/about', name: 'about', title: 'About' },
];

const pageInfo = getPageInfo();

header.innerHTML = `
  <div class="header__content content">
    ${navs.map(item => {
      let className = 'header__nav';
      const isArticle = item.name === 'home' && pageInfo.name === 'article';
      if (item.name === pageInfo.name || isArticle) {
        className += ' header__nav--active';
      }
      return `
        <a class="${className}" href="${item.path}">
          ${item.title}
        </a>
      `;
    }).join('')}
  </div>
`;

switch (pageInfo.name) {
  case 'article': {
    let content;
    const article = await getArticle(pageInfo.params.id);
    if (!article) {
      content = '<p>No data.</p>';
    } else {
      content = marked.parse(article.body);
      document.title = article.title;
    }
    page.innerHTML = `
      <div class="article">
        <div class="article__content content">
          ${content}
        </div>
      </div>
    `;
    break;
  }
  case 'about': {
    const { body } = await import('/articles/about.js');
    page.innerHTML = `
      <div class="about">
        <div class="about__content content">
          ${marked.parse(body)}
        </div>
      </div>
    `;
    break;
  }
  case 'home':
  default: {
    const contentsSorted = contents.sort((a, b) => b.id - a.id);
    page.innerHTML = `
      <div class="home">
        <div class="home__content content">
          ${contentsSorted.map(item => `
            <a class="home__article" href="/article/${item.id}">
              <div class="home__article-title ellipsis">${item.title}</div>
              <div class="home__article-time">${item.time}</div>
            </a>
          `).join('')}
          <div class="home__article-tail">
            No more
          </div>
          <a
            class="ICP"
            target="_blank"
            href="https://beian.miit.gov.cn/"
          >
            京ICP备18002046号-1
          </a>
        </div>
      </div>
    `;
  }
}
