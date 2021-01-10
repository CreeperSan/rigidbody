const router = require('koa-router')()
const RouteResponse = require('./router_response')
const Database = require('./../database/database')

/**
 * 获取应用最新版本
 */
router.get('/latest', async (ctx, next) => {
    // 获取应用ID
    let applicationID = ctx.request.query['applicationID']
    if(!applicationID){
        applicationID = ctx.header['applicationID']
    }
    if(!applicationID){
        applicationID = ctx.data.applicationID
    }
    if(!applicationID){
        ctx.body = RouteResponse.fail('缺少应用ID')
        return
    }
    // 查数据库
    let databaseResult = await Database.versionLatest(applicationID)
    if(databaseResult.isSuccess){
        ctx.body = RouteResponse.success(databaseResult.data)
    } else {
        ctx.body = RouteResponse.fail(databaseResult.message)
    }
})

/**
 * 获取应用版本更新列表
 */
router.get('/list', async (ctx, next) => {
    // 获取应用ID
    let applicationID = ctx.request.query['applicationID']
    if(!applicationID){
        applicationID = ctx.header['applicationID']
    }
    if(!applicationID){
        applicationID = ctx.data.applicationID
    }
    if(!applicationID){
        ctx.body = RouteResponse.fail('缺少应用ID')
        return
    }
    // 获取其他参数
    let page = ctx.request.query['page']
    if(0 !== page && !page){
        page = 0
    }
    let count = ctx.request.query['count']
    if(!count){
        count = 16
    }
    // 查数据库
    let databaseResult = await Database.versionList(applicationID, page, count)
    if(databaseResult.isSuccess){
        ctx.body = RouteResponse.success(databaseResult.data)
    } else {
        ctx.body = RouteResponse.fail(databaseResult.message)
    }
})

module.exports = router