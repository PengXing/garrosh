/**
 * @file baseApplication.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  baseApplication
 */

var util = require('util');
var events = require('events');


function BaseApplication(appdir) {
    events.EventEmitter.call(this);

    this.util = require('../util');

    this.appdir = appdir || process.cwd();
    // 转换成绝对地址
    this.appdir = this.util.resolve(this.appdir);
}
util.inherits(BaseApplication, events.EventEmitter);

module.exports = BaseApplication;
