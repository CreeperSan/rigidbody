/**
 * 需要axios.js的支持
 */

/**
 * POST 请求
 * @param url 链接
 * @param data 数据
 */
function networkPost(url, data) {
    return axios.post(url, data, {
        headers : {
            'token' : localStorage.getItem('token')
        }
    })
}

/**
 * 更新Token
 */
function networkUpdateToken(token) {
    // 更新 localstorage （用于POST）
    localStorage.setItem('token', token)
    // 更新 cookie （用于GET）
    let cookieMap = _networkParseCookieByString(document.cookie)
    cookieMap['token'] = token
    _networkSetTokenByMap(cookieMap)
}

/**
 * 解析token成一个map
 * @param cookieString
 * @return {{}}
 * @private
 */
function _networkParseCookieByString(cookieString) {
    let result = {}
    // 判空
    if(cookieString === null || cookieString === undefined){
        return result
    }
    cookieString = cookieString.toString().trim()
    if(cookieString.length <= 0){
        return result
    }
    // 拆分键值
    let cookieItemStringArray = cookieString.split(';')
    for(let i=0; i<cookieItemStringArray.length; i++ ){
        let cookieItemString = cookieItemStringArray[i]
        let indexPos = cookieItemString.indexOf('=')
        if(indexPos <= -1){
            continue
        }

        result[cookieItemString.substring(0, indexPos).trim()] = cookieItemString.substring(indexPos+1, cookieItemString.length).trim()
    }
    return result
}

/**
 * 将有一个map设置为token
 * @param cookieMap
 * @private
 */
function _networkSetTokenByMap(cookieMap) {
    if(cookieMap === null || cookieMap === undefined){
        return
    }
    if(cookieMap.length <= 0){
        document.cookie = ''
        return
    }
    // 去除空的项
    cookieMap = JSON.parse(JSON.stringify(cookieMap))
    // 写入
    let cookieText = ''
    for(let cookieKey in cookieMap){
        cookieText += (cookieKey.trim()+'='+cookieMap[cookieKey].trim())
        cookieText += ';'
    }
    console.log(cookieText)
    document.cookie = cookieText;
}