import Koa from "koa";
import body from "koa-body";
import cors from "koa-cors";
import helmet from "koa-helmet";
import logger from "koa-logger";
import responseTime from "koa-response-time";
import session from "koa-session";
import { setRouter } from "./router";

// import csshook from 'css-modules-require-hook/preset'; // 处理css

// import path from "path";
// import views from "koa-views";

const config = {
  port: 3030
};

// 实例化
const app = new Koa();

// 日志
app.use(logger());
app.use(responseTime());
app.use(helmet());

// session
app.keys = ["bbdweb"]; // secret
app.use(
  session(
    {
      key: "userinfo", // cookie名称
      maxAge: 1000 * 60 * 60 * 8, // 8小时
      overwrite: true /** (boolean) can overwrite or not (default true) */,
      httpOnly: true /** (boolean) httpOnly or not (default true) */,
      signed: true /** (boolean) signed or not (default true) */,
      rolling: false // 强制为每个用户设置session
    },
    app
  )
);
app.use(cors());
app.use(body({ multipart: true }));

// 设置路由
setRouter(app);

app.listen(config.port, function() {
  console.log("服务器启动，监听 port： " + config.port + "  running~");
});
