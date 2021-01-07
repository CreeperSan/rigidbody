const sqlite = require('sqlite3').verbose()
const sqlUtils = require('./sql_utils')

const database = new sqlite.Database('./data/data.sqlite')

// TODO : 参数合法性校验



/**
 * 数据库操作的返回结果统一数据结构
 * @param isSuccess 是否操作成功
 * @param message 提示文本
 * @param data 操作的结果
 * @return {{data: string, message: string, isSuccess: *}}
 * @private
 */
function _createResult(isSuccess, message, data){
    if(message === null || message === undefined){
        message = ''
    }
    if(data === null || data === undefined){
        data = ''
    }
    return {
        'isSuccess' : isSuccess,
        'message' : message,
        'data' : data
    }
}

/**
 * 数据库操作成功的返回结果统一数据结构
 * @param data
 * @return {{data: string, message: string, isSuccess: *}}
 * @private
 */
function _createSuccessResult(data){
    return _createResult(true, '操作成功', data)
}

/**
 * 数据库操作失败的返回结果统一数据结构
 * @param message
 * @return {{data: string, message: string, isSuccess: *}}
 * @private
 */
function _createFailResult(message){
    return _createResult(false, message, null)
}

module.exports = {






    /**
     * 初始话数据库表
     * Account
     *      _id 数据库ID
     *      account 账号
     *      password 密码 MD5
     * Application
     *      _id 数据库ID
     *      user_id 账号的数据库ID，外键
     *      fields 应用版本
     * Version
     *      _id 数据库ID
     *      application_id 应用的数据库ID，外键
     *      description 升级描述
     *      version_code 版本代号
     *      version_name 版本名称
     *      publish_time 发布日期
     *      url 升级链接
     *      infos 其他自定义字段
     */
    initTable : function () {
        // 账号表
        database.run('create table if not exists Account(_id integer primary key autoincrement not null, account text not null unique, password text not null, mail text not null)')
        // 应用表
        database.run('create table if not exists Application(_id integer primary key autoincrement not null, user_id integer not null , name text not null , status integer not null,  fields text not null, foreign key (user_id) references Account(_id) on delete cascade on update cascade)')
        // 应用信息表
        database.run('create table if not exists Version(_id integer primary key autoincrement not null, application_id integer not null, description text, version_code integer not null, version_name text, publish_time integer, url text, infos text not null, foreign key (application_id) references Application(_id) on delete cascade on update cascade)')
    },


    /**
     * 验证账号密码是否正确
     * @param account
     * @param password
     */
    accountVerify : function(account, password){
        return new Promise(function (resolve, reject) {
            if (!account){
                reject(_createFailResult('账号不能为空'))
            } else if(!password){
                reject(_createFailResult('密码不能为空'))
            } else {
                let sql = sqlUtils.formatString('select * from Account where account = "?" and password = "?" limit 1', [account, password])
                database.all(sql, function (err, result) {
                    if(err){
                        reject(_createFailResult('服务器内部错误'))
                    } else {
                        if(result.length === null || result.length === undefined || result.length <= 0 ){
                            resolve(_createFailResult('账号或密码错误'))
                        } else {
                            let accountItem = result[0]
                            resolve(_createSuccessResult({
                                'id' : accountItem._id,
                                'account' : accountItem.account,
                                'mail' : accountItem.mail,
                            }))
                        }
                    }
                })
            }
        })
    },

    /**
     * 判断账号是否存在
     * @param account
     */
    accountGetByAccount : function(account){
        return new Promise(function (resolve, reject) {
            let sql = sqlUtils.formatString('select * from Account where account = ? limit 1', [account])
            database.all(sql, function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    resolve(_createSuccessResult(result))
                }
            })
        })
    },

    /**
     * 判断账号ID是否存在
     * @param accountID
     */
    accountGetByID : function(accountID){
        return new Promise(function (resolve, reject) {
            let sql = sqlUtils.formatString('select * from Account where _id = ? limit 1', [accountID])
            database.all(sql, function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    resolve(_createSuccessResult(result))
                }
            })
        })
    },

    /**
     * 注册
     * @param account
     * @param password
     * @param mail
     */
    accountCreate : function (account, password, mail) {
        return new Promise(function (resolve, reject) {
            let sql = 'insert into Account(account, password, mail) values (?, ?, ?)'
            let sqlitePreparement = database.prepare(sql)
            sqlitePreparement.run(account, password, mail, function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    resolve(_createSuccessResult())
                }
            })
        })
    },

    /**
     * 获取应用列表
     * @param accountID 账号
     * @param size 每页的大小
     * @param page 页码
     */
    applicationGetList : function (accountID, size, page) {
        return new Promise(function (resolve, reject) {
            let sql = sqlUtils.formatString('select * from Application where user_id = ? limit ? offset ?', [accountID, size, page*size])
            database.all(sql, function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    let applicationResultList = []
                    for(let i=0; i<result.length; i++){
                        let applicationResultItem = {}
                        let applicationDatabaseItem = result[i]
                        applicationResultItem.id = applicationDatabaseItem._id
                        applicationResultItem.name = applicationDatabaseItem.name
                        applicationResultItem.status = applicationDatabaseItem.status
                        // TODO 自定义字段尚未支持
                        applicationResultList.push(applicationResultItem)
                    }
                    resolve(_createSuccessResult(applicationResultList))
                }
            })
        })
    },

    /**
     * 新增应用
     * @param accountID
     * @param applicationName
     * @param status
     * @param fields
     */
    applicationCreate : function (accountID, applicationName, status, fields) {
        return new Promise(function (resolve, reject) {
            let sql = 'insert into Application(user_id, name, status ,fields) values (?, ?, ?, ?)'
            let sqlitePreparement = database.prepare(sql)
            sqlitePreparement.run(accountID, applicationName, status, fields, function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    resolve(_createSuccessResult())
                }
            })
        })
    },

    /**
     * 删除应用
     * @param accountID
     * @param applicationID
     */
    applicationDelete : function (accountID, applicationID) {
        return new Promise(function (resolve, reject) {
            let sql = sqlUtils.formatString('delete from Application where user_id = ? and _id = ?', [accountID, applicationID])
            database.prepare(sql).run(function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    resolve(_createSuccessResult())
                }
            })
        })
    },

    /**
     * 判断应用是否存在
     * @param accountID
     * @param applicationID
     */
    applicationIsExist : function (accountID, applicationID) {
        return new Promise(function (resolve, reject) {
            let sql = sqlUtils.formatString('select * from Application where _id = ? and user_id = ?', [applicationID, accountID])
            database.all(sql, function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    resolve(_createSuccessResult(result))
                }
            })
        })
    },

    /**
     * 添加一个版本
     * @param applicationID 应用ID
     * @param description 更新描述
     * @param versionCode 版本代码
     * @param versionName 版本名称
     * @param publishTime 发布时间
     * @param url 链接
     * @param infos 自定义字段
     */
    versionAdd : function (applicationID, description, versionCode, versionName, publishTime, url, infos) {
        return new Promise(function (resolve, reject) {
            let sql = 'insert into Version(application_id, description, version_code, version_name, publish_time, url, infos) values (?,?,?,?,?,?,?)'
            let databasePreparement = database.prepare(sql)
            databasePreparement.run(applicationID, description, versionCode, versionName, publishTime, url, infos, function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    resolve(_createSuccessResult())
                }
            })
        })
    },

    /**
     * 删除一个版本
     * @param applicationID
     * @param versionID
     */
    versionDelete : function (applicationID, versionID) {
        return new Promise(function (resolve, reject) {
            let sql = sqlUtils.formatString('delete from Version where _id = ? and application_id = ?', [versionID, applicationID])
            database.prepare(sql).run(function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    resolve(_createSuccessResult())
                }
            })
        })
    },

    /**
     * 获取版本信息列表
     * @param applicationID
     */
    versionLatest : function (applicationID) {
        return new Promise(function (resolve, reject) {
            let sql = sqlUtils.formatString('select * from Version where _id = ? limit 1 order by _id desc', [applicationID])
            database.all(sql, function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    result(_createSuccessResult(result))
                }
            })
        })
    },

    /**
     * 获取版本信息列表
     * @param applicationID
     * @param page
     * @param count
     */
    versionList : function (applicationID, page , count) {
        return new Promise(function (resolve, reject) {
            let sql = sqlUtils.formatString('select * from Version where _id = ? limit ? offset ? order by _id desc', [applicationID, count, count*page])
            database.all(sql, function (err, result) {
                if(err){
                    reject(_createFailResult('服务器内部错误'))
                } else {
                    result(_createSuccessResult(result))
                }
            })
        })
    },

}