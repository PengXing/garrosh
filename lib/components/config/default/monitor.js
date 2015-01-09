/**
 * @file monitor.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 * 往monitor发送信息的配置
 */

module.exports = {
    /**
     * 是否打开监控信息推送
     * @type {Boolean}
     */
    enable: false,

    /**
     * 统计信息推送地址，不用加http://
     * @type {String}
     */
    host: 'cq01-rdqa-pool028.cq01.baidu.com',
    /**
     * 统计信息推送端口
     * @type {String}
     */
    port: '8888',

    /**
     * 监控信息推送频率，单位ms。
     * 时间触发的推送，是以status为基准，因此其他时间间隔必须大于status并推荐是其倍数。
     * @type {Object}
     */
    frequency: {
        /**
         * 瞬时信息，包括请求数，内存使用情况。monitor有实时更新的趋势图，因此建议不要过长。
         * @type {Number}
         */
        status: 1000, 

        /**
         * 累积信息，包括总请求数，响应数，机器信息等。这些对于实时要求不高。
         * @type {Number}
         */
        stats: 5000
    },

    /**
     * 长时间响应阈值
     * @type {Number}
     */
    responseWarningThreshold: 500,
    
    /**
     * 统计信息推送路径
     * @type {Object}
     */
    path: {
        /**
         * 瞬时信息推送路径
         * @type {String}
         */
        status: '/api/status',
        /**
         * 累积信息推送路径
         * @type {String}
         */
        stats: '/api/stats',
        /**
         * 出错信息推送路径
         * @type {String}
         */
        crash: '/api/crash',
    }
};
