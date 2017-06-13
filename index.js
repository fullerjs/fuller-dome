'use strict';
const nunjucks = require('nunjucks');

module.exports = function(f, mat, options, next) {
  const loader = new nunjucks.FileSystemLoader(options.templates);
  const env = new nunjucks.Environment(loader);

  for (let filter in options.filters) {
    env.addFilter(filter, options.filters[filter]);
  }

  for (let tag in options.tags) {
    env.addExtension(tag, options.tags[tag]);
  }

  mat.getContent(content => {
    const str = env.renderString(content.toString());

    Object.values(loader.cache)
      .forEach(file => f.addDependencies(file.path, mat.id));

    next(null, mat.setContent(str));
  });
};
