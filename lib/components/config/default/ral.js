/**
 * @file ral.js 
 * @author pengxing (pengxing@baidu.com)
 * @description
 *  ral config
 */


module.exports = {
    
    // 默认为node-ral，用户可以在ral.js里更改为yog-ral，yog-ral在百度内部支持比较好，有mcpack
    // nshead等一些功能
    adapter: 'node-ral',

    // 请求超时
    timeout: 3000,

    // 请求重试次数
    retry: 2,

    service: {

        /*
        PASSPORT: {
            unpack: 'mcpack',
            pack: 'mcpack',
            encoding: 'gbk',
            balance: 'random',
            protocol: 'nshead',
            server: [
                { host: '127.0.0.1', port: 9081}
            ]
        }
        */

    }

};
