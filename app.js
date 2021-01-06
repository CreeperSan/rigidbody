const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyParser = require('koa-bodyparser')
const logger = require('koa-logger')
const database = require('./database/database')

const routerIndex = require('./routes/index')
const routerAdmin = require('./routes/admin')
const routerVersion = require('./routes/version')

// 数据库初始化
database.initTable()

// 错误处理
onerror(app)

// 中间件
app.use(bodyParser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'nunjucks'
}))

// 日志输入中间件
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// 路由设置
app.use(routerIndex.routes(), routerIndex.allowedMethods())
app.use(routerAdmin.routes(), routerAdmin.allowedMethods())
app.use(routerVersion.routes(), routerVersion.allowedMethods())

// 错误处理
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
