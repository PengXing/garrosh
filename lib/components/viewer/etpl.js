/**
 * @file etpl.js
 * @author treelite, sekiyika (c.xinle@gmail.com, px.pengxing@gmail.com)
 * @description
 *  封装etpl到express中
 */

var fs = require('fs');
var path = require('path');
var etpl = require('etpl');

var glob = require('glob');
var md5 = require('MD5');

var cachedRender = {};
var cachedTemplate = {};

module.exports = function (app) {

    var isDebug = app.config.global.debug;
    var cacheable = app.config.view.cache;

    var templateDir = app.config.global.templateDir;

    var filters = {};

    function initEngine(engine, config) {
        engine.config(config);

        Object.keys(filters).forEach(function (name) {
            engine.addFilter(name, filters[name]);
        });
    }

    /**
     * 编译公共模版
     *
     * @inner
     * @param {Engine} engine 模版引擎
     * @param {Object} options
     */
    function compileCommon(engine, options) {
        var commonFiles = [];
        for (var i in options.includedFiles) {
            var configFile = options.includedFiles[i];
            if (configFile.indexOf('**/') !== 0) {
                configFile = '**/' + configFile;
            }
            commonFiles = commonFiles.concat(searchFiles(options.dir, configFile));
        }

        commonFiles.forEach(function (file) {
            engine.compile(getTemplate(file, options.dir));
        });
    }

    /**
     * 获取模版内容
     *
     * @inner
     * @param {string} key
     * @param {string} dir
     * @return {string}
     */
    function getTemplate(key, dir) {
        var file;
        dir = dir || templateDir;
        if (isDebug || !cachedTemplate[key]) {
            file = app.util.isAbsolute(key) ? key : path.resolve(dir, key);
            file = fs.readFileSync(file, 'utf-8');
            cachedTemplate[key] = file;
        } else {
            file = cachedTemplate[key];
        }
        return file;
    }

    /**
     * 搜索文件
     *
     * @public
     * @param {string} dir 搜索目录
     * @param {string} pattern
     * @param {boolean=} onlyDir 只搜索目录
     * @return {Array.<string>}
     */
    function searchFiles(dir, pattern, onlyDir) {
        var files = glob.sync(pattern, {cwd: dir});

        if (onlyDir) {
            files = files.filter(function (file) {
                file = path.resolve(dir, file);
                return fs.statSync(file).isDirectory();
            });
        }


        return files;
    }

    /**
     * the tpl main function
     *
     * @param {string} file file
     * @param {Object} options options
     * @param {string} options.dir
     * @param {string} options.commandOpen
     * @param {string} options.commandClose
     * @param {string} options.defaultFilter
     * @param {boolean} options.strip
     * @param {string} options.namingConflict
     * @param {Array<string>} options.includeFiles
     * @param {Function(Error, string)} fn callback
     */
    var fn = function (file, options, fn) {

        options = options || {};
        options.dir = options.dir || templateDir;

        var render;
        if (isDebug || !cacheable || !cachedRender[file]) {
            // 如果是debug或者是缓存失效状态下，都应该重新编译
            var engine = new etpl.Engine();
            initEngine(engine, options);
            compileCommon(engine, options);
            render = engine.compile(getTemplate(file, options.dir));
            cachedRender[file] = render;
        } else {
            render = cachedRender[file];
        }

        try {
            fn(null, render(options));
        } catch (e) {
            fn(e);
        }
    };


    // for string
    fn.render = function (str, options, fn) {

        options = options || {};
        options.dir = options.dir || templateDir;

        var key = md5(str);

        var render;
        if (isDebug || !cacheable || !cachedRender[key]) {
            // 如果是debug或者是缓存失效状态下，都应该重新编译
            var engine = new etpl.Engine();
            initEngine(engine, options);
            compileCommon(engine, options);
            render = engine.compile(str);
            cachedRender[key] = render;
        } else {
            render = cachedRender[key];
        }

        try {
            fn(null, render(options));
        } catch (e) {
            fn(e);
        }
    };

    fn.filter = function (name, filter) {
        filters[name] = filter;
    };

    return fn;

};
