const UUID = require('uuid')
/**
 * 结构，后面改成redis实现
 * 键为   token
 * 值为  {
 *          "auth_time" : 上一次验证的时间戳
 *          "account_id" : 账号ID
 *      }
 */
const TIMEOUT_MILLISECOND = 1000 * 60 * 60 * 24     // 24 小时后Token超时

const accountPool = {}

/**
 * 获取毫秒时间戳
 * @return {number}
 * @private
 */
function _timestampMillisecond(){
    return new Date().getTime()
}

module.exports = {

    /**
     * 通过Token获取账号id
     * @param token
     * @return 账号ID
     */
    getAccountIDByToken : function (token) {
        // 检查是否存在token记录
        if(!(token in accountPool)){
            return null
        }
        const authItem = accountPool[token]
        if(authItem === null || authItem === undefined){
            return null
        }
        // 检查是否超时
        let currentTimestamp = _timestampMillisecond()
        if (currentTimestamp - authItem.auth_time >= TIMEOUT_MILLISECOND){
            this.removeToken(token)
            return null
        }
        // 更新token时间
        authItem.auth_time = currentTimestamp
        return authItem.account_id
    },

    /**
     * 添加账号Token
     * @param accountID 账号ID
     * @return 如果成功，返回uuid。否则返回 false
     */
    addToken : function(accountID){
        for (let i=0; i<10; i++){
            let tmpUUID = UUID.v4()
            if (tmpUUID in accountPool){
                continue;
            }
            accountPool[tmpUUID] = {
                'auth_time' : _timestampMillisecond(),
                'account_id' : accountID
            }
            return tmpUUID
        }
        return false
    },

    /**
     * 移除 Token
     * @param token
     * @return boolean 是否成功移除
     */
    removeToken : function (token) {
        return delete accountPool[token]
    },

    /**
     * 清除已经过期的记录
     */
    trim : function () {
        let currentTimestamp = _timestampMillisecond()
        for(let token in accountPool){
            let accountItem = accountPool[token]
            let accountAuthTime = accountItem.auth_time
            if(currentTimestamp - accountAuthTime >= TIMEOUT_MILLISECOND){
                this.removeToken(token)
            }
        }
    },

}