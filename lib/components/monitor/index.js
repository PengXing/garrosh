/**
 * @file index.js
 * @author wangyisheng@baidu.com (wangyisheng)
 * @description
 *  监控信息
 **/

var http = require('http');
var qs = require('qs');
var cluster = require('cluster');
var os = require('os');

module.exports = function (app) {

    function Monitor() {
        this.appid = app.config.global.appid;
        this.appkey = app.config.global.appkey;

        this.readyTime = null;
        this.coolDown = 1000;
    }

    Monitor.prototype.initialize = function () {
        if (!app.config.monitor.enable) {
            return;
        }
        if (!app.config.server.cluster.enable) {
            // 单进程启动
            initializeStandAlone.call(this);
        } else {
            // 集群启动
            if (cluster.isMaster) {
                initializeMaster.call(this);
            } else {
                initializeSlave.call(this);
            }
        }

        this.bind();
    };

    function initMonitorVariables(onlyStatus) {
        /**
         * 记录服务器瞬时状态，用作历史趋势分析
         * @type {Object}
         */
        app.status = {
            pendingRequest: 0
        };
        if (!onlyStatus) {
            /**
             * 记录服务器累积信息。
             * @type {Object}
             */
            app.stats = {
                request: {
                    static: 0,
                    dynamic: 0,
                    get: 0,
                    post: 0,
                    put: 0,
                    del: 0,
                    xhr: 0
                },
                response: {
                    responseWarning: 0,
                    responseWarningThreshold: app.config.monitor.responseWarningThreshold,
                    timeout: 0,
                    controllers: {}
                },
                common: {
                    startTime: +new Date(),
                    os: {
                        type: os.type(),
                        totalMemory: os.totalmem(),
                        cpuNum: os.cpus().length
                    }
                }
            };
        }
    }

    function initializeStandAlone() {
        var me = this;
        var times = 0;
        var statsThreshold = 
            parseInt(app.config.monitor.frequency.stats / app.config.monitor.frequency.status, 10) || 5;

        initMonitorVariables();

        function collectInfo() {
            times++;
            app.status.memory = process.memoryUsage();
            me.send('status', app.status);
            initMonitorVariables(true);

            if (times >= statsThreshold) {
                times = 0;
                me.send('stats', app.stats);
                initMonitorVariables();
            }
            setTimeout(collectInfo, app.config.monitor.frequency.status);
        }

        collectInfo();
    }

    function initializeMaster() {
        var me = this;
        // 绑定crash事件
        cluster.on('exit', function (worker, code, signal) {
            me.send('crash');
        });

        cluster.on('listening', function (worker, address) {
            // 绑定message事件
            worker.on('message', messageHandler);
        });

        var status;
        var initStatus = function () {
            status = {
                pendingRequest: 0,
                memory: {
                    rss: 0,
                    heapTotal: 0,
                    heapUsed: 0
                }
            };
        };
        initStatus();

        var stats = {
            common: {
                startTime: +new Date(),
                os: {
                    type: os.type(),
                    totalMemory: os.totalmem(),
                    cpuNum: os.cpus().length
                }
            }
        };
        var initStats = function () {
            stats.request = {
                static: 0,
                dynamic: 0,
                get: 0,
                post: 0,
                put: 0,
                del: 0,
                xhr: 0
            };
            stats.response = {
                responseWarning: 0,
                responseWarningThreshold: app.config.monitor.responseWarningThreshold,
                timeout: 0,
                controllers: {}
            }
        }
        initStats();
        var timestamp;
        var times = 0;
        var messageNum = 0;
        var statsThreshold = 
            parseInt(app.config.monitor.frequency.stats / app.config.monitor.frequency.status, 10) || 5;

        function messageHandler(data) {
            if (data.cmd === 'stats') {
                if (timestamp === data.timestamp) {
                    messageNum++;
                    // 累加stats
                    stats.request['static'] += data.stats.request['static'];
                    stats.request['dynamic'] += data.stats.request['dynamic'];
                    stats.request['get'] += data.stats.request['get'];
                    stats.request['post'] += data.stats.request['post'];
                    stats.request['put'] += data.stats.request['put'];
                    stats.request['del'] += data.stats.request['del'];
                    stats.request['xhr'] += data.stats.request['xhr'];
                    stats.response.responseWarning += data.stats.response.responseWarning;
                    stats.response.timeout += data.stats.response.timeout;
                    for (var key in data.stats.response.controllers) {
                        if (stats.response.controllers[key] === undefined) {
                            stats.response.controllers[key] = 0;
                        }
                        stats.response.controllers[key] += data.stats.response.controllers[key];
                    }

                    // 累加status
                    status.pendingRequest += data.status.pendingRequest;
                    status.memory.rss += data.status.memory.rss;
                    status.memory.heapTotal += data.status.memory.heapTotal;
                    status.memory.heapUsed += data.status.memory.heapUsed;
                }
                if (messageNum === Object.keys(cluster.workers).length) {
                    messageNum = 0;
                    times++;
                    me.send('status', status);
                    initStatus();
                    if (times >= statsThreshold) {
                        times = 0;
                        me.send('stats', stats);
                        initStats();
                    }
                }
            }
        }

        // 每隔一段时间询问一次子进程的状态
        // 这里包括累积状态和瞬时状态。
        // 累积状态例如共处理了多少请求等。
        // 瞬时状态例如瞬时的内存状态，请求处理个数。
        function collectInfo() {
            var workers = cluster.workers;
            var worker;
            timestamp = + new Date();
            Object.keys(workers).forEach(function (pid) {
                worker = workers[pid];
                worker.send({
                    cmd: 'stats',
                    timestamp: timestamp
                });
            });

            setTimeout(collectInfo, app.config.monitor.frequency.status);
        }

        collectInfo();
    }

    function initializeSlave() {
        initMonitorVariables();

        // 绑定进程交互事件
        process.on('message', function (data) {
            var cmd = data && data.cmd;
            if (cmd === 'stats') {
                app.status.memory = process.memoryUsage();
                process.send({
                    cmd: 'stats',
                    pid: process.pid,
                    stats: app.stats,
                    status: app.status,
                    timestamp: data.timestamp
                });
                initMonitorVariables();
            }
        });
    }

    /**
     * 注册监控事件
     */
    Monitor.prototype.bind = function () {
        // start
        app.on('request:start', function () {
            app.status.pendingRequest++;
        });

        // processing
        app.on('request:processing', function (controller) {
            var name = app.util.getClassName(controller);
            if (!(name in app.stats.response.controllers)) {
                app.stats.response.controllers[name] = 0;
            }
            app.stats.response.controllers[name]++;

            var req = controller.req;

            // 当前访问的method
            var method = req.method.toLowerCase();
            if (method === 'delete') {
                method = 'del';
            }

            if (!app.stats.request[method]) {
                app.stats.request[method] = 0;
            }

            app.stats.request[method]++;


            // 当前访问的是否是静态文件
            if (name === 'StaticController') {
                app.stats.request.static++;
            } else if (name === 'DynamicController') {
                app.stats.request.dynamic++;
            }

            if (req.isAjax) {
                app.stats.request.xhr++;
            }
        });

        app.on('request:transfer', function (prev, cur) {
            var prevName = app.util.getClassName(prev);
            var curName = app.util.getClassName(cur);

            var key = prevName + ' => ' + curName;

            if (!(key in app.stats.response.controllers)) {
                app.stats.response.controllers[key] = 0;
            }
            app.stats.response.controllers[key]++;
        });


        // end
        app.on('request:timeout', function (req, res) {
            app.stats.response.timeout++;
        });

        app.on('request:end', function (req) {
            // 在这里destroy controller
            var controller = req.controller;
            if (!controller.isEnded) {
                controller.destroy();
            }

            // 统计较慢的响应
            var startTime = req._startTime.getTime();
            var now = +new Date();
            if (now - startTime > app.config.monitor.responseWarningThreshold) {
                app.stats.response.responseWarning++;
            }

            app.logger.dProfile('Controller:total - ' + req.pvid);
        });
    };

    /**
     * 发送监控信息
     * @param  {String} pathName 发送路径
     * @param  {Object} object   发送内容
     */
    Monitor.prototype.send = function (pathName, object) {
        if (!this.appid) {
            console.log('必须设置appid(config/global.js)');
            return;
        }
        if (!app.config.monitor.path[pathName]) {
            console.log('monitor send with wrong pathName: ' + pathName);
            return;
        }
        if (this.readyTime !== null && this.readyTime > + new Date()) {
            // 技能还在冷却中…
            return;
        }
        var me = this;
        var timestamp = + new Date();
        var env = process.env;
        var paramObj = {
            appid: this.appid,
            appkey: this.appkey,
            timestamp: timestamp,
            // 对应Linux, Windows, Mac
            host: env.HOSTNAME || env.USERNAME || env.USER || ''
        };
        if (object) {
            paramObj.data = JSON.stringify(object);
        }
        var params = qs.stringify(paramObj);
        var options = {
            hostname: app.config.monitor.host,
            port: app.config.monitor.port,
            path: app.config.monitor.path[pathName],
            method: 'POST',
            header: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': params.length
            }
        }
        var req = http.request(options, function (httpRes) {
            httpRes.on('data', function () {
                me.coolDown = 1000;
                me.readyTime = null;
            });
        });
        req.on('error', function (e) {
            console.log('[' + (new Date()).toString() + '] 无法连接监控服务器: ' 
                + app.config.monitor.host + ':' + app.config.monitor.port + app.config.monitor.path[pathName] + '?' + params);
            console.log(e);
            me.readyTime = + new Date() + me.coolDown;
            me.coolDown = Math.min(me.coolDown * 2, 6000000);
        });
        req.write(params);
        req.end();
    }

    return new Monitor();
};
