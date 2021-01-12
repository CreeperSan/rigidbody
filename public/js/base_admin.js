
/**
 * 退出登录
 */
function rigidbodyLogout() {
    function onResult(value){
        console.log(value)
        networkUpdateToken(undefined)
        location.href = '/admin'
    }

    document.writeln('正在退出登录')
    networkPost('/admin/logout').then(onResult).catch(onResult)
}

function rigidbodyGoHome() {
    location.href = '/admin/index'
}