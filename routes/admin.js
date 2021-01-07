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
        let databaseResult = await database.applicationGetList(accountID,100, 0)
        if(databaseResult.isSuccess){
            await ctx.render('admin/index', {
                accountName: 'Hello Koa 2!',
                applicationList : databaseResult.data,
            })
        } else {
            await ctx.render('admin/index', {
                accountName: 'Hello Koa 2!',
                applicationList : []
            })
        }
    } else { // token 不可用
        await ctx.render('admin/login_expire')
    }
})

/**
 * 应用版本详情页面
 */
router.get('/application', async (ctx, next) => {
    // 获取 Token
    let cookieMap = RouterUtils.parseCookie(ctx.header.cookie)
    let token = cookieMap['token']
    // 检查token是否合法
    let accountID = AccountAuth.getAccountIDByToken(token)
    if(accountID){ // token 可用
        // TODO 获取版本信息
        await ctx.render('admin/application/application')
    } else { // token 不可用
        await ctx.render('admin/login_expire')
    }
})

/**
 * 新建应用界面
 */
router.get('/application/add', async (ctx, next) => {
    // 获取 Token
    let cookieMap = RouterUtils.parseCookie(ctx.header.cookie)
    let token = cookieMap['token']
    // 检查token是否合法
    let accountID = AccountAuth.getAccountIDByToken(token)
    if(accountID){ // token 可用
        await ctx.render('admin/application/add', {
            accountName: 'Hello Koa 2!',
        })
    } else { // token 不可用
        await ctx.render('admin/login_expire')
    }
})

/**
 * 新建应用版本
 */
router.get('/application/version/add', async (ctx, next) => {
    await ctx.render('admin/application/version/add', {
        accountName: 'Hello Koa 2!',
    })
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

/**
 * 网络请求创建应用
 */
router.post('/application/add', async (ctx, next) => {
    let token = ctx.header.token
    let accountID = AccountAuth.getAccountIDByToken(token)
    if(!(accountID)){
        ctx.body = RouterResponse.fail('身份信息过期')
        return
    } else {
        let applicationName = ctx.request.body['name']
        let applicationStatus = ctx.request.body['status']

        let databaseResult = await database.applicationCreate(accountID, applicationName, applicationStatus, '{}')
        if(databaseResult.isSuccess){
            ctx.body = RouterResponse.success()
        } else {
            ctx.body = RouterResponse.fail(databaseResult.message)
        }
    }
})

/**
 * 网络请求删除应用
 */
router.post('/application/delete', async (ctx, next) => {
    let token = ctx.header.token
    let accountID = AccountAuth.getAccountIDByToken(token)
    if(!(accountID)){
        ctx.body = RouterResponse.fail('身份信息过期')
        return
    } else {
        let applicationID = ctx.request.body['applicationID']

        let databaseResult = await database.applicationDelete(accountID, applicationID)
        if(databaseResult.isSuccess){
            ctx.body = RouterResponse.success()
        } else {
            ctx.body = RouterResponse.fail(databaseResult.message)
        }
    }
})

module.exports = router