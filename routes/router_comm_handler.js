const RouteUtils = require('./router_utils')
const AccountAuth = require('./../account/account_auth')
const Database = require('./../database/database')

module.exports = {

    accountAuth : async function (ctx, next) {
        // 获取token
        let cookieMap = RouteUtils.parseCookie(ctx.header.cookie)
        let token = cookieMap['token']
        // 校验token
        let accountID = AccountAuth.getAccountIDByToken(token)
        if(accountID){ // 检验成功
            // 从数据库中查账号信息
            let databaseResult = await Database.accountGetByID(accountID)
            if(databaseResult.isSuccess){
                ctx.auth = {
                    'accountID' : databaseResult.data.accountID,
                    'username' : databaseResult.data.username,
                    'email' : databaseResult.data.email,
                }
            } else {
                ctx.auth = null
            }
        } else { // 校验失败
            ctx.auth = null
        }
        // 继续执行
        return next()
    }

}