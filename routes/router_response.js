module.exports = {

    /**
     * 服务器接口返回
     * @param code
     * @param message
     * @param response
     */
    response : function(code, message, data){
        if(code === null || code === undefined){
            code = 502
        }
        if(message === null || message === undefined){
            message = ''
        }
        return JSON.stringify({
            'code' : code,
            'message' : message,
            'data' : data,
        })
    },

    success : function (data) {
        return this.response(200, '操作成功', data)
    },


    fail : function (message) {
        return this.response(500, message, undefined)
    }

}