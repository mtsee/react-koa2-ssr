import App from '../src/App';
import Koa from 'koa';
import React from 'react';
import Router from 'koa-router';
import body from 'koa-body';
import fs from 'fs';
import koaStatic from 'koa-static';
import path from 'path';
import { renderToString } from 'react-dom/server';

// 配置文件
const config = {
  port: 3030
};

// 实例化
const app = new Koa();

// session
app.use(body({ multipart: true }));

// 静态资源
app.use(
  koaStatic(path.join(__dirname, '../build'), {
    maxage: 365 * 24 * 60 * 1000,
    index: 'root'
  })
);

// 设置路由
app.use(
  new Router()
    .get('*', async (ctx, next) => {
      ctx.response.type = 'html'; //指定content type
      let shtml = '';
      await new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, '../build/index.html'), 'utf8', function(err, data) {
          if (err) {
            reject();
            return console.log(err);
          }
          shtml = data;
          resolve();
        });
      });
      ctx.response.body = shtml.replace('{{root}}', renderToString(<App />));
    })
    .routes()
);

app.listen(config.port, function() {
  console.log('服务器启动，监听 port： ' + config.port + '  running~');
});
