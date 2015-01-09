/**
 * @file routes.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  配置routes
 */


module.exports = {

    /*
    '/assets/(.*)': {
        // 指定当前请求是否为静态文件请求
        type: 'static',
        // 如果指定了target，则会用target的作为响应文件的name
        // target: '/assets/{0}',
        // 指定该route对应的静态文件目录
        dir: './public',
        // 以下配置参考 https://github.com/visionmedia/send#options
        // 是否需要使用etag
        etag: true,
        // max age
        maxAge: 1 * 365 * 24 * 3600 * 1000,
        // 类似于.bashrc这类的文件配置访问许可 deny allow ignore
        dotfiles: 'deny',
        extensions: false,
        index: false
    },

    'r|/redirect-url/(.*)|target': {
        // server通过redirect来跳转
        redirect: '{target}'
    },

    '/:controller/:action/(.*)': {
        controller: '{controller}',
        action: '{action}'

        // 添加中间件，在action之前执行
        middlewares: [
            function (req, resp, next) {
                console.log('hello world');
                next();
            }
        ]

    }
    */

};
