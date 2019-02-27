import App from "../src/App";
import React from "react";
import Router from "koa-router";
import fs from "fs";
import koaStatic from "koa-static";
import path from "path";
import { renderToString } from "react-dom/server";

// 路由
export const setRouter = app => {
  // 静态资源
  app.use(
    koaStatic(path.join(__dirname, "../build/static"), {
      maxage: 365 * 24 * 60 * 1000
    })
  );

  // api路由
  const router = new Router({
    prefix: "/api"
  });

  // 用户api
  router.get("/test", (ctx, next) => {
    ctx.body = "ok";
  });

  // 路由配置
  app.use(router.routes());
  app.use(
    new Router()
      .get("*", async (ctx, next) => {
        ctx.response.type = "html"; //指定content type
        let shtml = "";
        await new Promise((resolve, reject) => {
          fs.readFile(
            path.join(__dirname, "../build/index.html"),
            "utf8",
            function(err, data) {
              if (err) {
                reject();
                return console.log(err);
              }
              shtml = data;
              resolve();
            }
          );
        });
        ctx.response.body = shtml.replace("{{root}}", renderToString(<App />));
      })
      .routes()
  );
};
