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
}