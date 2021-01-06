const router = require('koa-router')()
const RouterResponse = require('./router_response')
const RouterUtils = require('./router_utils')
const database = require('./../database/database')
const AccountAuth = require('./../account/account_auth')

router.prefix('/admin')

/**
 * 访问登录页面
 */
router.get('/', async (ctx, next) => {
    await ctx.render('admin/login')
})

/**
 * 访问管理页面
 */
router.get('/index', async (ctx, next) => {
    // 获取 Token
    let cookieMap = RouterUtils.parseCookie(ctx.header.cookie)
    let token = cookieMap['token']
    // 检查token是否合法
    let accountID = AccountAuth.getAccountIDByToken(token)
    if(accountID){ // token 可用
        await ctx.render('admin/index', {
            accountName: 'Hello Koa 2!',
        })
    } else { // token 不可用
        await ctx.render('admin/login_expire')
    }
})




















/**
 * 请求退出登录
 */
router.post('/logout', async (ctx, next) => {
    let cookieMap = RouterUtils.parseCookie(ctx.header.cookie)
    let token = cookieMap.token
    AccountAuth.removeToken(token)
    ctx.body = RouterResponse.success('开发中')
})

/**
 * 请求登录
 */
router.post('/login', async (ctx, next) => {
    let account = ctx.request.body.account
    let password = ctx.request.body.password

    try {
        let result = await database.accountVerify(account, password)
        if(result.isSuccess){
            let databaseAccount = result.data.account
            let databaseMail = result.data.mail
            let databaseID = result.data.id
            let accountAuthToken = AccountAuth.addToken(databaseID)
            if(accountAuthToken){ // token 添加成功
                ctx.body = RouterResponse.success({
                    'account' : databaseAccount,
                    'mail' : databaseMail,
                    'token' : accountAuthToken,
                })
            } else { // token 添加失败
                ctx.body = RouterResponse.fail('服务器繁忙，请稍后重试')
            }
        } else {
            ctx.body = RouterResponse.fail(result.message)
        }
    } catch (e) {
        console.log(e)
        ctx.body = RouterResponse.fail('账号或密码错误')
    }

})

module.exports = router