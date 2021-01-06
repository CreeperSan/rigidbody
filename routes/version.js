const router = require('koa-router')()
const RouteResponse = require('./router_response')

router.get('/latest', async (ctx, next) => {
    let token = ctx.header['token']
    if(token === null || token === undefined){
        ctx.body = RouteResponse.fail('缺少应用ID')
    } else {
        ctx.body = RouteResponse.success({
            'versionCode' : 10032,
            'versionName' : 'alpha 20135'
        })
    }
})

router.get('/list', async (ctx, next) => {
    let token = ctx.header['token']
    let page = ctx.query['page']
    let size = ctx.query['size']
    if(!(page instanceof Number)){
        page = 1
    }
    if(!(size instanceof Number)){
        size = 10
    }
    if(token === null || token === undefined){
        ctx.body = RouteResponse.fail('缺少应用ID')
    } else {
        ctx.body = RouteResponse.success([
            {
                'versionCode' : 10031,
                'versionName' : 'alpha 20134'
            },{
                'versionCode' : 10032,
                'versionName' : 'alpha 20135'
            },
        ])
    }
})

module.exports = router