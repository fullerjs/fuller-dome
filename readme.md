# Fuller #
**Build everything with right tool**

## Dome tool for Mr. Fuller##

Tool for building static websites.

### Features

*   Full featured template engine [nunjucks](http://jlongster.github.io/nunjucks/)
*   Github flavored markdown support.
*   Code highlight support  
*   JavaScript only

### Settings
As for all tools settings can be added to defaults section and to tool options.

* **home** — url of website. Will be avalible in templates as `home`
* **title** — title of website. Will be avalible in templates as `title`
* **templates** - paths to look for templates.
* **dst** — destination path

### Tasks

```js
var dome = {
    //this task will generate /index.html of your website.
    "/": {
        template: "index.html",
        title: "Index page",
        content: "./README.md"
    },
    
    //this task will generate /docs/index.html of your website.
    "/docs": {
        template: "docs.html",
        title: "Intro",
        content: "./docs.md"
    },
    
    //this task will generate /docs/sanitized-filename/index.html 
    //of all files in ./docs directory.
    "/docs/": {
        template: "docs.html",
        content: "./docs"
    }
}
```

[For more info about go there](https://github.com/fullerjs/fuller)
