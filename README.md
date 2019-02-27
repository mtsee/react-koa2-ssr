# 使用说明

该案例是react服务器渲染案例，简称 React SSR，采用create-react-app构建项目。

1. **npm install** 安装依赖

2. **npm run build** 打包项目

3. **npm run server** 启动服务器，访问地址 *http://localhost:3030* 访问项目

# 前言

本文是基于react ssr的入门教程，在实际项目中使用还需要做更多的配置和优化，比较适合第一次尝试react ssr的小伙伴们。技术涉及到 koa2 + react，案例使用create-react-app创建

# SSR 介绍
Server Slide Rendering，缩写为 **ssr** 即服务器端渲染，这个要从SEO说起，目前react单页应用HTML代码是下面这样的
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="shortcut icon" href="favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
    <meta name="theme-color" content="#000000" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script src="/js/main.js"></script>
  </body>
</html>
```
1. 如果main.js 加载比较慢，会出现白屏一闪的现象。
2. 传统的搜索引擎爬虫因为不能抓取JS生成后的内容，遇到单页web项目，抓取到的内容啥也没有。在SEO上会吃很多亏，很难排搜索引擎到前面去。
React SSR（react服务器渲染）正好解决了这2个问题。

# React SSR介绍

这里通过一个例子来带大家入坑！先使用create-react-app创建一个react项目。因为要修改webpack，这里我们使用react-app-rewired启动项目。根目录创建一个server目录存放服务端代码，服务端代码我们这里使用koa2。目录结构如下：

![图片描述][1]

这里先来看看react ssr是怎么工作的。

![图片描述][2]

这个业务流程图比较清晰了，服务端只生成HTML代码，实际上前端会生成一份main.js提供给服务端的HTML使用。这就是react ssr的工作流程。有了这个图会更好的理解，如果这个业务没理解清楚，后面的估计很难理解。

> react提供的SSR方法有两个renderToString 和 renderToStaticMarkup，区别如下：

- renderToString 方法渲染的时候带有 data-reactid 属性. 在浏览器访问页面的时候，main.js能识别到HTML的内容，不会执行React.createElement二次创建DOM。
- renderToStaticMarkup 则没有 data-reactid 属性，页面看上去干净点。在浏览器访问页面的时候，main.js不能识别到HTML内容，会执行main.js里面的React.createElement方法重新创建DOM。

# 实现流程

好了，我们都知道原理了，可以开始coding了,目录结构如下：

![图片描述][3]

create-react-app 的demo我没动过，直接用这个做案例了，前端项目基本上就没改了,等会儿我们服务器端要使用这个模块。代码如下：

```javascript
import "./App.css";

import React, { Component } from "react";

import logo from "./logo.svg";

class App extends Component {
  componentDidMount() {
    console.log('哈哈哈~ 服务器渲染成功了！');
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;

```

在项目中新建server目录，用于存放服务端代码。为了简化，我这里只有2个文件，项目中我们用的ES6，所以还要配置下.babelrc

![图片描述][4]

> .babelrc 配置，因为要使用到ES6
```json
{
    "presets": [
        "env",
        "react"
    ],
    "plugins": [
        "transform-decorators-legacy",
        "transform-runtime",
        "react-hot-loader/babel",
        "add-module-exports",
        "transform-object-rest-spread",
        "transform-class-properties",
        [
            "import",
            {
                "libraryName": "antd",
                "style": true
            }
        ]
    ]
}
```

> index.js 项目入口做一些预处理，使用asset-require-hook过滤掉一些类似 ```import logo from "./logo.svg";``` 这样的资源代码。因为我们服务端只需要纯的HTML代码，不过滤掉会报错。这里的name，我们是去掉了hash值的

```javascript
require("asset-require-hook")({
  extensions: ["svg", "css", "less", "jpg", "png", "gif"],
  name: '/static/media/[name].[ext]'
});
require("babel-core/register")();
require("babel-polyfill");
require("./app");
```

> public/index.html html模版代码要做个调整，```{{root}}``` 这个可以是任何可以替换的字符串，等下服务端会替换这段字符串。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
    <meta name="theme-color" content="#000000" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root">{{root}}</div>
  </body>
</html>

```

> app.js 服务端渲染的主要代码，加载App.js，使用renderToString 生成html代码，去替换掉 index.html 中的 ```{{root}}``` 部分

```javascript
import App from '../src/App';
import Koa from 'koa';
import React from 'react';
import Router from 'koa-router';
import fs from 'fs';
import koaStatic from 'koa-static';
import path from 'path';
import { renderToString } from 'react-dom/server';

// 配置文件
const config = {
  port: 3030
};

// 实例化 koa
const app = new Koa();

// 静态资源
app.use(
  koaStatic(path.join(__dirname, '../build'), {
    maxage: 365 * 24 * 60 * 1000,
    index: 'root' 
    // 这里配置不要写成'index'就可以了，因为在访问localhost:3030时，不能让服务默认去加载index.html文件，这里很容易掉进坑。
  })
);

// 设置路由
app.use(
  new Router()
    .get('*', async (ctx, next) => {
      ctx.response.type = 'html'; //指定content type
      let shtml = '';
      await new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, '../build/index.html'), 'utfa8', function(err, data) {
          if (err) {
            reject();
            return console.log(err);
          }
          shtml = data;
          resolve();
        });
      });
      // 替换掉 {{root}} 为我们生成后的HTML
      ctx.response.body = shtml.replace('{{root}}', renderToString(<App />));
    })
    .routes()
);

app.listen(config.port, function() {
  console.log('服务器启动，监听 port： ' + config.port + '  running~');
});

```

> config-overrides.js 因为我们用的是create-react-app，这里使用react-app-rewired去改下webpack的配置。因为执行**npm run build**的时候会自动给资源加了hash值，而这个hash值，我们在asset-require-hook的时候去掉了hash值，配置里面需要改下，不然会出现图片不显示的问题，这里也是一个坑，要注意下。

```javascript
module.exports = {
  webpack: function(config, env) {
    // ...add your webpack config
    // console.log(JSON.stringify(config));
    // 去掉hash值，解决asset-require-hook资源问题
    config.module.rules.forEach(d => {
      d.oneOf &&
        d.oneOf.forEach(e => {
          if (e && e.options && e.options.name) {
            e.options.name = e.options.name.replace('[hash:8].', '');
          }
        });
    });
    return config;
  }
};

```

好了，所有的代码就这些了，是不是很简单了？我们koa2读取的静态资源是 build目录下面的。先执行**npm run build**打包项目，再执行**node ./server** 启动服务端项目。看下http://localhost:3030页面的HTML代码检查下：

![图片描述][5]

![图片描述][6]

没有```{{root}}```了，服务器渲染成功！

# 总结

相信这篇文章是最简单的react服务器渲染案例了，这里交出github地址，如果学会了，记得给个star

> https://github.com/mtsee/react-koa2-ssr


  [1]: https://image-static.segmentfault.com/172/820/1728206619-5c765504b90de_articlex
  [2]: https://image-static.segmentfault.com/147/717/1477175201-5c7657d0d7a29_articlex
  [3]: https://image-static.segmentfault.com/337/614/3376146941-5c76632940970_articlex
  [4]: https://image-static.segmentfault.com/114/696/1146964533-5c765ba08f00b_articlex
  [5]: https://image-static.segmentfault.com/117/321/1173215685-5c76616aa0cd0_articlex
  [6]: https://image-static.segmentfault.com/714/996/714996020-5c7661032ad25_articlex