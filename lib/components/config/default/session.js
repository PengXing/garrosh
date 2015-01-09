/**
 * @file session.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  配置session的存储方式，默认本地内存
 */

module.exports = {

    // memory为内置的，可以通过引用connect-redis或者connect-mongo等
    adapter: 'memory',

    // 用于adapter
    options: {

    },

    // express.session的配置
    session: {
        secret: '',
        key: 'NODE_SESSION_ID'
    }

};
