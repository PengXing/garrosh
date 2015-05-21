/**
 * @file view.js
 * @author @AUTHOR_HEADER@
 * @description
 * 模板配置文件
 **/

module.exports = {

    // 指定使用什么模板
    engine: 'etpl',

    // 指定文件的后缀
    ext: 'tpl',

    // 是否需要缓存
    cache: false,

    // 渲染时所使用的参数
    // 根据不同的模板引擎配置不同的
    options: {
        commandOpen: '{{',
        commandClose: '}}',
        includedFiles: ['common/*']
    }
};

