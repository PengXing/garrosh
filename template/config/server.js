/**
 * @file server.js
 * @author @AUTHOR_HEADER@
 * @description
 * server配置文件
 */

var os = require('os');

module.exports = {
    // server运行端口
    port: '8888',

    // 设置为true，则server如果发现request headers中存在X-Forwarded-For字段，则作为client的ip，否则使用req.connection.remoteAddress
    trustProxy: true,

    // 全局设置etag，此etag的效果会被route中指定的etag覆盖
    etag: true,

    // 指定jsonp的回调函数的参数名
    jsonpCallback: 'callback',

    // 默认超时时间
    timeout: 5000,

    // cluster
    cluster: {
        enable: true,
        max: os.cpus().length
    }
};