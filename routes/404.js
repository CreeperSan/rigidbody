

module.exports = async function (ctx, next) {
    if(parseInt(ctx.status) === 404) {
        await ctx.render('404')
        return
    }
    next()
}