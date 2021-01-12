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
        let databaseResult = await database.applicationGetList(accountID,999, 0)
        if(databaseResult.isSuccess){
            await ctx.render('admin/index', {
                accountName: '普通用户',
                applicationList : databaseResult.data,
            })
        } else {
            await ctx.render('admin/index', {
                accountName: '普通用户',
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
        let applicationID = ctx.request.query.id
        if(!applicationID){ // 没传参数
            await ctx.render('admin/application/not_exist')
            return
        }
        // 获取应用信息
        let databaseResult;
        try {
            databaseResult = await database.applicationGetByID(accountID, applicationID)
            if (!databaseResult.isSuccess) { // applicationID 错误
                await ctx.render('admin/application/not_exist')
                return
            }
        } catch (e) {
            await ctx.render('admin/application/not_exist')
            return
        }
        let applicationInfo = databaseResult.data
        // 获取其他参数
        let page = ctx.request.query['page']
        if(0 !== page && !page){
            page = 0
        }
        let count = ctx.request.query['count']
        if(!count){
            count = 16
        }
        // 获取版本信息
        let versions = []
        let errorMessage = ''
        databaseResult = await database.versionList(applicationID, page, count)
        if(databaseResult.isSuccess){
            for(let i=0; i<databaseResult.data.length; i++){
                versions.push(databaseResult.data[i])
            }
        } else {
            errorMessage = databaseResult.message
        }
        // 渲染生成页面
        await ctx.render('admin/application/application', {
            'applicationName' : applicationInfo.name,
            'applicationID' : applicationInfo.applicationID,
            'applicationStatus' : applicationInfo.status,
            'versions' : versions,
            'errorMessage' : errorMessage,
        })
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
    // 获取 Token
    let cookieMap = RouterUtils.parseCookie(ctx.header.cookie)
    let token = cookieMap['token']
    // 检查token是否合法
    let accountID = AccountAuth.getAccountIDByToken(token)
    if(accountID){ // token 可用
        // 获取应用是否存在
        let applicationID = ctx.request.query.applicationID
        if(!applicationID){ // 没传参数
            await ctx.render('admin/application/not_exist')
            return
        }
        // 获取应用信息
        let databaseResult;
        try {
            databaseResult = await database.applicationGetByID(accountID, applicationID)
        } catch (e) {
            await ctx.render('admin/application/not_exist')
            return
        }
        let applicationName = databaseResult.data.applicationName
        let applicationStatus = databaseResult.data.applicationStatus
        await ctx.render('admin/application/version/add', {
            'applicationID': applicationID,
            'applicationName' : applicationName,
            'applicationStatus' : applicationStatus,
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
    ctx.body = RouterResponse.success()
})

/**
 * 请求登录
 */
router.post('/login', async (ctx, next) => {
    let account = ctx.request.body.account
    let password = ctx.request.body.password

    let result = await database.accountVerify(account, password)
    if(result.isSuccess){
        let databaseAccount = result.data.username
        let databaseMail = result.data.email
        let databaseID = result.data.accountID
        let accountAuthToken = AccountAuth.addToken(databaseID)
        if(accountAuthToken){ // token 添加成功
            ctx.cookies.set('token', accountAuthToken)
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

/**
 * 网络请求添加版本
 */
router.post('/application/version/add', async (ctx, next) => {
    // token 校验
    let token = ctx.header.token
    let accountID = AccountAuth.getAccountIDByToken(token)
    if(!(accountID)){
        ctx.body = RouterResponse.fail('身份信息过期')
        return
    }

    // 应用校验
    let applicationID = ctx.request.body['applicationID']
    let databaseResult;
    try {
        databaseResult = await database.applicationGetByID(accountID, applicationID)
    } catch (e) {
        ctx.body = RouterResponse.fail('应用不存在')
        return
    }
    if(!databaseResult.isSuccess){
        ctx.body = RouterResponse.fail(databaseResult.message)
        return
    }
    let applicationName = databaseResult.applicationName
    let applicationStatus = databaseResult.applicationStatus

    // 参数校验
    let versionName = ctx.request.body['name']
    let versionCode = ctx.request.body['code']
    let versionUrl = ctx.request.body['url']
    let versionDescription = ctx.request.body['description']
    let versionPublishTime = ctx.request.body['publishTime']

    if(!versionName){ ctx.body = RouterResponse.fail('版本名称不能为空');return }
    if(!versionCode){ ctx.body = RouterResponse.fail('版本号不能为空');return }
    if(!versionPublishTime){ ctx.body = RouterResponse.fail('发布时间不能为空');return }
    if(!versionUrl){ versionUrl = '' }
    if(!versionDescription){ versionDescription = '' }

    databaseResult = await database.versionAdd(applicationID, versionDescription, versionCode, versionName, versionPublishTime, versionUrl, '{}')
    if(databaseResult.isSuccess){
        ctx.body = RouterResponse.success()
    } else {
        ctx.body = RouterResponse.fail(databaseResult.message)
    }

})

/**
 * 网络请求删除版本
 */
router.post('/application/version/delete', async (ctx, next) => {
    // token 校验
    let token = ctx.header.token
    let accountID = AccountAuth.getAccountIDByToken(token)
    if(!(accountID)){
        ctx.body = RouterResponse.fail('身份信息过期')
        return
    }

    let applicationID = ctx.request.body['applicationID']
    let versionID = ctx.request.body['versionID']
    let databaseResult = await database.versionDelete(applicationID, versionID)
    if(databaseResult.isSuccess){
        ctx.body = RouterResponse.success()
    } else {
        ctx.body = RouterResponse.fail(databaseResult.result)
    }
})

module.exports = router