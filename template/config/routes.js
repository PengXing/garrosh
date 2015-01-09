/**
 * @file routes.js
 * @author @AUTHOR_HEADER@
 * @description
 * 路由规则配置文件
 */
module.exports = {

    '/' : {
        controller: 'hello',
        action: 'index'
    },

    '/assets/(.*)': {
        // 指定当前请求是否为静态文件请求
        type: 'static',
        // 如果指定了target，则会用target的作为响应文件的name
        target: '/assets/{0}',
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
    }

};
