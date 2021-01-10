const sqlite = require('sqlite3').verbose()
const sqlUtils = require('./sql_utils')

const database = new sqlite.Database('./data/data.sqlite')

// TODO : 参数合法性校验

const MAX_LENGTH_ACCOUNT = 36
const MAX_LENGTH_PASSWORD = 128
const MAX_LENGTH_EMAIL = 64
const MAX_LENGTH_APPLICATION_NAME = 64
const MAX_LENGTH_FIELDS = 10240
const MAX_LENGTH_DESCRIPTION = 1024
const MAX_LENGTH_VERSION_NAME = 32
const MAX_LENGTH_URL = 128
const MAX_LENGTH_INFOS = 20480
const DEFAULT_SIZE = 16
const MIN_SIZE = 1
const MAX_SIZE = 64
const DEFAULT_PAGE = 0
const MIN_PAGE = 0
const MAX_PAGE = 9999999

/*****************  这部分是统一数据库回传到上一个调用处的操作结果格式  ********************/

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


/*****************  这部分是统一数据库回传到上一个调用处 Model 的数据格式  ********************/

function _databaseObjectFormatAccount(accountRawDatabase) {
    return {
        'accountID' : accountRawDatabase.account_id,
        'username' : accountRawDatabase.username,
        'email' : accountRawDatabase.email,
    }
}

function _databaseObjectFormatApplication(applicationRawDatabase){
    return {
        'applicationID' : applicationRawDatabase.application_id,
        'accountID' : applicationRawDatabase.account_id,
        'name' : applicationRawDatabase.name,
        'status' : applicationRawDatabase.status,
    }
}

function _databaseObjectFormatVersion(versionRawDatabase){
    return JSON.parse(JSON.stringify({
        'versionID' : versionRawDatabase.version_id,
        'applicationID' : versionRawDatabase.application_id,
        'description' : versionRawDatabase.description,
        'versionCode' : versionRawDatabase.version_code,
        'versionName' : versionRawDatabase.version_name,
        'publishTime' : versionRawDatabase.publish_time,
        'url' : versionRawDatabase.url,
    }))
}

/*****************  对外公开的方法  ********************/

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
        database.run('create table if not exists Account(account_id integer primary key autoincrement not null, username text not null unique, password text not null, email text not null)')
        // 应用表
        database.run('create table if not exists Application(application_id integer primary key autoincrement not null, account_id integer not null , name text not null , status integer not null,  fields text not null, foreign key (account_id) references Account(account_id) on delete cascade on update cascade)')
        // 应用信息表
        database.run('create table if not exists Version(version_id integer primary key autoincrement not null, application_id integer not null, description text, version_code integer not null, version_name text, publish_time integer, url text, infos text not null, foreign key (application_id) references Application(application_id) on delete cascade on update cascade)')
    },


    /**
     * 验证账号密码是否正确
     * @param account
     * @param password
     */
    accountVerify : function(account, password){
        return new Promise(function (resolve, reject) {
            if (!account){
                resolve(_createFailResult('账号不能为空'))
            } else if(!password){
                resolve(_createFailResult('密码不能为空'))
            } else {
                // 参数合法性检查
                account = account.toString()
                if(account.length > MAX_LENGTH_ACCOUNT){
                    account = account.substring(0, MAX_LENGTH_ACCOUNT)
                }
                password = password.toString()
                if(password.length > MAX_LENGTH_PASSWORD){
                    password = password.substring(0, MAX_LENGTH_PASSWORD)
                }
                // 数据库操作
                let sql = sqlUtils.formatString('select * from Account where username = "?" and password = "?" limit 1', [account, password])
                database.all(sql, function (err, result) {
                    if(err){
                        resolve(_createFailResult('服务器内部错误'))
                    } else {
                        if(result.length === null || result.length === undefined || result.length <= 0 ){
                            resolve(_createFailResult('账号或密码错误'))
                        } else {
                            let accountItem = result[0]
                            resolve(_createSuccessResult(_databaseObjectFormatAccount(accountItem)))
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
            let sql = sqlUtils.formatString('select * from Account where username = ? limit 1', [account])
            database.all(sql, function (err, result) {
                // 参数合法性校验
                account = account.toString()
                if(account.length > MAX_LENGTH_ACCOUNT){
                    account = account.substring(0, MAX_LENGTH_ACCOUNT)
                }
                // 数据库操作
                if(err){
                    resolve(_createFailResult('服务器内部错误'))
                } else if(result.length >= 1){
                    resolve(_createSuccessResult(_databaseObjectFormatAccount(result[0])))
                } else {
                    resolve(_createFailResult('未找到对应用户'))
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
            // 参数合法性检查
            try {
                accountID = parseInt(accountID)
            } catch (e) {
                resolve(_createFailResult('账号ID出错'))
                return
            }
            // 数据库操作
            let sql = sqlUtils.formatString('select * from Account where account_id = ? limit 1', [accountID])
            database.all(sql, function (err, result) {
                if(err){
                    resolve(_createFailResult('服务器内部错误'))
                } else if(result.length >= 1){
                    resolve(_createSuccessResult(_databaseObjectFormatAccount(result[0])))
                } else {
                    resolve(_createFailResult('未找到对应用户'))
                }
            })
        })
    },

    /**
     * 注册
     * @param username
     * @param password
     * @param email
     */
    accountCreate : function (username, password, email) {
        return new Promise(function (resolve, reject) {
            // 参数可发行校验
            username =  username.toString()
            if(username.length > MAX_LENGTH_ACCOUNT){
                username = username.substring(0, MAX_LENGTH_ACCOUNT)
            }
            password = password.toString()
            if(password.length > MAX_LENGTH_PASSWORD){
                password = password.substring(0, MAX_LENGTH_PASSWORD)
            }
            email = email.toString()
            if(email.length > MAX_LENGTH_EMAIL){
                resolve(_createFailResult('邮箱长度过长'))
                return
            }
            if(email.indexOf('@') <= 0){
                resolve(_createFailResult('邮箱格式不正确'))
                return
            }
            // 数据库操作
            let sql = 'insert into Account(username, password, email) values (?, ?, ?)'
            let sqlitePreparement = database.prepare(sql)
            sqlitePreparement.run(username, password, email, function (err, result) {
                if(err){
                    resolve(_createFailResult('服务器内部错误'))
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
            // 参数合法性校验
            try {
                accountID = parseInt(accountID)
            } catch (e) {
                resolve(_createFailResult('账号不存在'))
                return
            }
            try {
                size = parseInt(size)
            } catch (e) {
                size = DEFAULT_SIZE
            }
            if (size < MIN_SIZE){
                size = 1
            } else if(size > MAX_SIZE){
                size = MAX_SIZE
            }
            try {
                page = parseInt(page)
            } catch (e) {
                page = DEFAULT_PAGE
            }
            if (page < MIN_PAGE){
                page = 1
            } else if(page > MAX_PAGE){
                page = MAX_PAGE
            }
            // 数据库操作
            let sql = sqlUtils.formatString('select * from Application where account_id = ? limit ? offset ?', [accountID, size, page*size])
            database.all(sql, function (err, result) {
                if(err){
                    resolve(_createFailResult('服务器内部错误'))
                } else {
                    let applicationResultList = []
                    for(let i=0; i<result.length; i++){
                        applicationResultList.push(_databaseObjectFormatApplication(result[i]))
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
            // 参数校验
            try {
                accountID = parseInt(accountID)
            } catch (e) {
                resolve(_createFailResult('账号不存在'))
                return
            }
            applicationName = applicationName.toString()
            if(applicationName.length > MAX_LENGTH_APPLICATION_NAME){
                resolve(_createFailResult('应用名称过长'))
                return
            }
            try {
                status = parseInt(status)
            } catch (e) {
                resolve(_createFailResult('状态不正确'))
                return
            }
            fields = fields.toString()
            if(fields.length > MAX_LENGTH_FIELDS){
                resolve(_createFailResult('自定义字段长度过长'))
                return
            }
            // 数据库操作
            let sql = 'insert into Application(account_id, name, status ,fields) values (?, ?, ?, ?)'
            let sqlitePreparement = database.prepare(sql)
            sqlitePreparement.run(accountID, applicationName, status, fields, function (err, result) {
                if(err){
                    resolve(_createFailResult('服务器内部错误'))
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
            // 参数合法性校验
            try {
                accountID = parseInt(accountID)
            } catch (e) {
                resolve(_createFailResult('账号不存在'))
                return
            }
            try {
                applicationID = parseInt(applicationID)
            } catch (e) {
                resolve(_createFailResult('应用不存在'))
                return
            }
            // 数据库操作
            let sql = sqlUtils.formatString('delete from Application where account_id = ? and application_id = ?', [accountID, applicationID])
            database.prepare(sql).run(function (err, result) {
                if(err){
                    resolve(_createFailResult('服务器内部错误'))
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
    applicationGetByID : function (accountID, applicationID) {
        return new Promise(function (resolve, reject) {
            // 参数合法性校验
            try {
                accountID = parseInt(accountID)
            } catch (e) {
                resolve(_createFailResult('账号不存在'))
                return
            }
            try {
                applicationID = parseInt(applicationID)
            } catch (e) {
                resolve(_createFailResult('应用不存在'))
                return
            }
            // 数据库操作
            let sql = sqlUtils.formatString('select * from Application where application_id = ? and account_id = ?', [applicationID, accountID])
            database.all(sql, function (err, result) {
                if(err){
                    resolve(_createFailResult('服务器内部错误'))
                } else {
                    if(result.length > 0){
                        let applicationDatabaseItem = result[0]
                        resolve(_createSuccessResult(_databaseObjectFormatApplication(applicationDatabaseItem)))
                    } else {
                        resolve(_createFailResult('应用不存在'))
                    }
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
            // 参数校验
            try {
                applicationID = parseInt(applicationID)
            } catch (e) {
                resolve(_createFailResult('应用不存在'))
                return
            }
            description = description.toString()
            if(description.length > MAX_LENGTH_DESCRIPTION){
                resolve(_createFailResult('版本描述过长，请控制在'+MAX_LENGTH_DESCRIPTION+'字内'))
                return
            }
            try {
                versionCode = parseInt(versionCode)
            } catch (e) {
                resolve(_createFailResult('应用版本号格式不正确'))
                return
            }
            versionName = versionName.toString()
            if(versionName.length > MAX_LENGTH_VERSION_NAME){
                resolve(_createFailResult('应用版本名称过长，请控制在'+MAX_LENGTH_VERSION_NAME+'字内'))
                return
            }
            try {
                publishTime = parseInt(publishTime)
            } catch (e) {
                resolve(_createFailResult('发布时间格式不正确'))
                return
            }
            url = url.toString()
            if(url.length > MAX_LENGTH_URL){
                resolve(_createFailResult('链接过长，请控制在'+MAX_LENGTH_URL+'字内'))
                return
            }
            infos = infos.toString()
            if(infos.length > MAX_LENGTH_INFOS){
                resolve(_createFailResult('自定义内容过长，请空置在'+MAX_LENGTH_INFOS+'字内'))
                return
            }
            // 数据库操作
            let sql = 'insert into Version(application_id, description, version_code, version_name, publish_time, url, infos) values (?,?,?,?,?,?,?)'
            let databasePreparement = database.prepare(sql)
            databasePreparement.run(applicationID, description, versionCode, versionName, publishTime, url, infos, function (err, result) {
                if(err){
                    resolve(_createFailResult('服务器内部错误'))
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
            // 参数合法性校验
            try {
                applicationID = parseInt(applicationID)
            } catch (e) {
                resolve(_createFailResult('应用不存在'))
                return
            }
            try {
                versionID = parseInt(versionID)
            } catch (e) {
                resolve(_createFailResult('版本不存在'))
                return
            }
            // 数据库操作
            let sql = sqlUtils.formatString('delete from Version where version_id = ? and application_id = ?', [versionID, applicationID])
            database.prepare(sql).run(function (err, result) {
                if(err){
                    resolve(_createFailResult('服务器内部错误'))
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
            // 参数合法性校验
            try {
                applicationID = parseInt(applicationID)
            } catch (e) {
                resolve(_createFailResult('应用不存在'))
                return
            }
            // 数据库操作
            let sql = sqlUtils.formatString('select * from Version where version_id = ? order by version_id desc limit 1', [applicationID])
            database.all(sql, function (err, result) {
                if(err){
                    console.log(err)
                    resolve(_createFailResult('服务器内部错误'))
                } else if(result.length > 0){
                    let versionDatabaseItem = result[0]
                    resolve(_createSuccessResult(_databaseObjectFormatVersion(versionDatabaseItem)))
                } else {
                    resolve(_createFailResult('应用尚未添加版本'))
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
            // 参数合法性校验
            try {
                applicationID = parseInt(applicationID)
            } catch (e) {
                resolve(_createFailResult('应用不存在'))
                return
            }
            // 数据库操作
            let sql = sqlUtils.formatString('select * from Version where application_id = ? order by version_id desc limit ? offset ?', [applicationID, count, count*page])
            database.all(sql, function (err, result) {
                if(err){
                    resolve(_createFailResult('服务器内部错误'))
                } else {
                    let databaseResultList = []
                    for(let i=0; i<result.length; i++){
                        let versionDatabaseItem = result[i]
                        databaseResultList.push(_databaseObjectFormatVersion(versionDatabaseItem))
                    }
                    resolve(_createSuccessResult(databaseResultList))
                }
            })
        })
    },

}