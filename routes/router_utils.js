module.exports = {

    parseCookie : function(cookieString){
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

}