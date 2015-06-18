/**
 * @file logger.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  配置logger
 */

module.exports = {

    enable: true,

    // 是否需要打印调用log的代码所在文件和行号
    lineno: true,

    // appdir目录下的log目录
    dir: './log',

    // debug状态下，采用silly，线上采用info
    level: process.env.NODE_ENV === 'production' ? 'info' : 'silly',

    // 指定单个文件最大大小
    maxsize: 4 * 1024 * 1024 * 1024 * 1024,

    // 是否按照日期分割文件，只对默认的transport有用，支持按小时等切分日志
    dailyRotatePattern: '.yyyy-MM-dd',

    // 默认是file，在debug状态下也会有console
    transports: [

    ],

    // 默认是file，在debug状态下也会有console
    // 此处是warn和fatal/error状态下的transports
    wfTransports: [

    ]

};
