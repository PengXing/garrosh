/**
 * @file index.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  logger
 */

var fs = require('fs');
var util = require('util');
var path = require('path');

var winston = require('winston');
var chalk = require('chalk');

module.exports = function (app) {

    var isDebug = process.env.NODE_ENV === 'development';

    var levelMap = {
        silly: 0,
        debug: 1,
        verbose: 2,
        info: 3,
        warn: 4,
        error: 5
    };

    function Logger() {

        /**
         * @type {string}
         */
        this.appname;
        /**
         * @type {string}
         */
        this.dir;
        /**
         * @type {number}
         */
        this.maxsize;
        /**
         * @type {string}
         */
        this.level;

        /**
         * @type {Array}
         */
        this.transports;
        /**
         * @type {Array}
         */
        this.wfTransports;

        /**
         * @type {winston.Logger}
         */
        this.logger;
        /**
         * @type {winston.Logger}
         */
        this.wfLogger;

        /**
         * @type {string}
         */
        this.pathPrefix;

        /**
         * 保存profiler的句柄
         * @type {Array<string>}
         */
        this.profilers = [];
    }

    Logger.prototype.initialize = function () {

        app.logger.dProfile('component:Logger:initialize');

        this.appname = app.config.global.appname;
        this.dir = app.config.logger.dir;
        this.maxsize = app.config.logger.maxsize;
        this.level = app.config.logger.level;
        this.transports = app.config.logger.transports || [];
        this.wfTransports = app.config.logger.wfTransports || [];

        this.pathPrefix = this.dir + '/' + this.appname;

        this.create();

        app.logger.info('Component Logger initialize DONE');
        app.logger.dProfile('component:Logger:initialize');
    };

    Logger.prototype.create = function () {

        var options = {exitOnError: false};
        var wfOptions = {exitOnError: false};

        if (!fs.existsSync(this.dir)) {
            fs.mkdirSync(this.dir);
        }

        var logFile = this.pathPrefix + '.log';
        var wfLogFile = this.pathPrefix + '.log.wf';

        var transports = this.transports;

        var dailyRotatePattern = app.config.logger.dailyRotatePattern;
        var Clazz = dailyRotatePattern ? winston.transports.DailyRotateFile : winston.transports.File;

        if (transports.length === 0) {

            // 添加正常信息的transport
            transports.push(new Clazz({
                filename: logFile,
                maxsize: this.maxsize,
                level: this.level,
                json: false,
                timestamp: getTimeStr,
                datePattern: dailyRotatePattern
            }));

            if (!dailyRotatePattern) {
                if (!fs.existsSync(logFile)) {
                    fs.openSync(logFile, 'w+');
                }
            }

        }

        var wfTransports = this.wfTransports;
        if (wfTransports.length === 0) {

            // 添加错误信息的transport
            wfTransports.push(new Clazz({
                filename: wfLogFile,
                maxsize: this.maxsize,
                level: 'warn',
                json: false,
                timestamp: getTimeStr,
                datePattern: dailyRotatePattern
            }));

            if (!dailyRotatePattern) {
                if (!fs.existsSync(wfLogFile)) {
                    fs.openSync(wfLogFile, 'w+');
                }
            }
        }


        options.transports = transports;
        wfOptions.transports = wfTransports;

        var oldLogger = this.logger;
        var oldWfLogger = this.wfLogger;

        this.logger = new winston.Logger(options);
        this.wfLogger = new winston.Logger(wfOptions);

        // 避免内存泄露，销毁之前的logger
        if (oldLogger) {
            oldLogger.close();
        }
        if (oldWfLogger) {
            oldWfLogger.close();
        }
    };

    Logger.prototype.silly = function () {
        this.log('silly', arguments);
    };

    Logger.prototype.debug = function () {
        this.log('debug', arguments);
    };

    Logger.prototype.verbose = function () {
        this.log('verbose', arguments);
    };

    Logger.prototype.info = function () {
        this.log('info', arguments);
    };

    Logger.prototype.warn = function () {
        this.log('warn', arguments);
    };

    Logger.prototype.error = function () {
        this.log('error', arguments, this.wfLogger);
    };

    Logger.prototype.fatal = function () {
        this.log('error', arguments, this.wfLogger);
    };

    /**
     * 根据key返回当前key是否已经处于profile状态下
     * @param {string} key profile key
     * @return {boolean}
     */
    Logger.prototype.isProfiled = function (key) {
        return this.profilers[key] ? true : false;
    };

    /**
     * 会采用debug输出信息
     * @param {string} key profile key
     */
    Logger.prototype.dProfile = function (key) {
        var now = Date.now();
        var then;

        if (this.profilers[key]) {
            then = this.profilers[key];
            delete this.profilers[key];

            var args = Array.prototype.slice.call(arguments);
            args.push('duration: ' + chalk.yellow((now - then) + 'ms'));
            this.debug.apply(this, args);
        } else {
            this.profilers[key] = now;
        }
    };

    /**
     * profile
     * @param {string} key profile key
     */
    Logger.prototype.profile = function (key) {
        var now = Date.now();
        var then;

        if (this.profilers[key]) {
            then = this.profilers[key];
            delete this.profilers[key];

            var args = Array.prototype.slice.call(arguments);
            args.push('duration: ' + (now - then) + 'ms');
            this.info.apply(this, args);
        } else {
            this.profilers[key] = now;
        }
    };

    /**
     * 所有日志的最终处理函数
     *
     * @param {string} level level
     * @param {Object} args arguments
     * @param {winston.Logger} logger logger
     */
    Logger.prototype.log = function (level, args, logger) {
        // 节省性能，level低于当前设置的level，则直接返回
        if (levelMap[this.level] > levelMap[level]) {
            return;
        }
        args = Array.prototype.slice.call(args, 0);

        while (args[args.length - 1] === null) {
            args.pop();
        }

        var msg = '';
        // 如果是打印error
        if (args.length === 1 && args[0] instanceof Error) {
            msg = args[0].stack || args[0].toString();
        } else {
            msg = util.format.apply(null, args);
        }

        var info = getPosition();
        var prefix = ''
            + process.pid
            + ' ['
            + path.relative(app.config.global.appdir, info.currentFile)
            + ':'
            + info.currentLine
            + '] ';

        logger = logger || this.logger;


        // 将包含\n的字符分多行打印
        msg = msg.split('\n');
        msg.forEach(function (message) {
            logger[level](prefix + message);

            // 如果是debug环境，则在console中打印日志
            if (isDebug) {
                consoleLogAccordingToLevel(level, prefix + message);
            }
        });

    };

    var colorMap = {
        silly: 'magenta',
        verbose: 'cyan',
        debug: 'blue',
        info: 'green',
        warn: 'yellow',
        error: 'red'
    };

    /**
     * colorize level and output it
     *
     * @param {string} level level
     * @param {string} str log message
     */
    function consoleLogAccordingToLevel(level, str) {
        var msg = level;

        var color = colorMap[level];
        if (chalk[color]) {
            msg = chalk[color](level);
        }

        msg = msg + ' ' + str;
        console.log(msg);
    }

    /**
     * 获取错误打印日志的文件和行号
     *
     * @return {{stack: (Error.stack|*), currentLine: number, currentFile: string}}
     */
    function getPosition() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        var err = new Error();
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;

        return {
            stack: stack,
            currentLine: stack[2].getLineNumber(),
            currentFile: stack[2].getFileName()
        };
    }

    function getTimeStr() {
        var now = new Date();
        var month = now.getMonth() + 1;
        var date = now.getDate();
        var hour = now.getHours();
        var min = now.getMinutes();
        var sec = now.getSeconds();
        month < 10 ? month = '0' + month : null;
        date < 10 ? date = '0' + date : null;
        hour < 10 ? hour = '0' + hour : null;
        min < 10 ? min = '0' + min : null;
        sec < 10 ? sec = '0' + sec : null;

        return now.getFullYear() + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
    }


    return new Logger();
};
