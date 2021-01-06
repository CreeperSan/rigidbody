const router = require('koa-router')()

router.get('/', async (ctx, next) => {
  ctx.body = JSON.stringify({
    'code' : 200,
    'message' : 'server running...',
  })
})


module.exports = router
