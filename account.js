const database = require('./database/database')

function isParamsEmpty(args) {
    return args === null || args === undefined
}

async function main() {
    let args = process.argv

    let action = args[2]

    switch (action) {
        case 'create':{
            let username = args[3]
            let password = args[4]
            let email = args[5]
            if(isParamsEmpty(username)){
                console.log('用户名错误')
                break
            }
            if(isParamsEmpty(password)){
                console.log('密码错误')
                break
            }
            if(isParamsEmpty(email)){
                console.log('邮箱错误')
                break
            }
            let databaseResult = await database.accountCreate(username, password, email)
            if(databaseResult.isSuccess){
                console.log('创建账号成功')
            } else {
                console.log('创建账号失败，'+databaseResult.message)
            }
            break
        }
        case 'test':{ //////////////////////////////////////////////////////////////////
            console.log('test')
            break
        }
        default:{ /////////////////////////////////////////////////////////////////////
            let description = `
用法如下
1. npm run account create [用户名] [密码] [邮箱]
`
            console.log(description)
            break
        }
    }
}



main()


