/**
 * @file global.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

module.exports = {
    // 当前的运行模式
    debug: true,

    // 指定app的名字
    appname: 'default',
    // 指定代码根目录
    appdir: process.cwd(),

    // 版本号
    version: '0.0.0.0',

    // 作者
    author: ['sekiyika'],

    // 静态文件的根目录
    staticDir: './public',

    // controller目录
    controllerDir: './controllers',

    // 中间件的目录
    middlewareDir: './middlewares',

    // 模板所在目录
    templateDir: './views',

    // 模板插件所在目录
    pluginDir: './plugins'

};
