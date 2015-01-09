/**
 * @file view.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  后端模板的配置
 */


module.exports = {

    // 指定使用什么模板
    engine: 'ejs',

    // engine 需要遵循 consolidate 的写法
    // engine: function () {}


    // 指定文件的后缀
    ext: 'tpl',

    // 是否需要缓存
    cache: true,

    // 渲染时所使用的参数
    // 根据不同的模板引擎配置不同的
    options: {},

    plugins: []


    // garrosh也默认支持etpl
    // options: {
    //     includedFiles: [] // 不会配置的请找@王轶盛
    // }

};
