/**
 * @file cli.js
 * @author wangyisheng@baidu.com (wangyisheng)
 * @description
 * 命令行执行
 **/

var fs = require('fs');
var path = require('path');

var program = require('commander');
var mkdirp = require('mkdirp');
var _ = require('underscore.deferred');

var templateDir;
var author;
var version = require('../package.json').version;

function createApplication(options) {
    var name = options.name;
    templateDir = path.resolve(__dirname, '../template');
    author = options.author || '';
    // commander默认有name属性，类型为function。因此判断到这里也算是没有输入
    if (typeof name === 'function' || !name) {
        // 默认取文件夹名字
        var rootPath = process.cwd();
        var tmpArr = rootPath.split(path.sep);
        name = tmpArr[tmpArr.length - 1];
    }
    console.log('\nReady to create application with name = "' + name + '" & author = "' + author + '"');
    console.log('');

    var defArr = [];

    var configDef = new _.Deferred();
    mkdirp('config', function (err) {
        dealError(err);
        generateFile('config/global.js', {
            name: name
        });
        generateFile('config/middlewares.js');
        generateFile('config/routes.js');
        generateFile('config/server.js');
        generateFile('config/session.js', {
            secret: true
        });
        generateFile('config/view.js');
        console.log('Generate config ok!');
        configDef.resolve();
    });
    defArr.push(configDef.promise());

    var controllersDef = new _.Deferred();
    mkdirp('controllers', function (err) {
        dealError(err);
        generateFile('controllers/hello.js');
        console.log('Generate controllers ok!');
        controllersDef.resolve();
    });
    defArr.push(controllersDef.promise());

    var publicDef = new _.Deferred();
    mkdirp('public/assets/css', function (err) {
        dealError(err);
        generateFile('public/assets/css/common.css');
        generateFile('public/assets/css/index.css');
        mkdirp('public/assets/js', function (err) {
            dealError(err);
            generateFile('public/assets/js/common.js');
            console.log('Generate public ok!');
            publicDef.resolve();
        });
    });
    defArr.push(publicDef.promise());

    var viewsDef = new _.Deferred();
    mkdirp('views/common', function (err) {
        dealError(err);
        generateFile('views/common/header.tpl', {
            name: name
        });
        generateFile('views/common/footer.tpl');
        generateFile('views/index.tpl');
        console.log('Generate views ok!');
        viewsDef.resolve();
    });
    defArr.push(viewsDef.promise());

    generateFile('index.js');
    console.log('Generate index.js ok!');

    generateFile('package.json', {
        name: name,
        version: version
    });
    console.log('Generate package.json ok!');

    _.when.apply(null, defArr).then(function () {
        console.log('\nTry Use "$ node index.js" and view "http://localhost:8888" in browser');
        console.log('\nSee more information at http://node.baidu.com');
    });
}

function generateFile(pathSuffix, replacement) {
    var content = fs.readFileSync(path.resolve(templateDir, pathSuffix)).toString();
    if (replacement && replacement.name !== undefined) {
        content = content.replace(/@NAME@/g, replacement.name);
    }
    // author
    content = content.replace(/@AUTHOR_HEADER@/, author);
    if (~content.indexOf('@AUTHOR@')) {
        var authorArr = author.split(',');
        var displayAuthor = [];
        for (var i in authorArr) {
            displayAuthor.push('"' + authorArr[i] + '"');
        }
        content = content.replace(/@AUTHOR@/, displayAuthor.join(','));
    }
    if (replacement && replacement.secret !== undefined) {
        var secret = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        content = content.replace(/@SECRET@/, secret);
    }
    if (replacement && replacement.version !== undefined) {
        content = content.replace(/@VERSION@/, replacement.version);
    }
    fs.writeFileSync(pathSuffix, content);
}

function dealError(err) {
    if (err) {
        console.error(err);
        process.exit();
    }
}

/**
 * 解析参数。作为命令行执行的入口
 *
 * @param {Array} args 参数列表
 */
exports.parse = function () {
    program
        .version(version)
        .usage('command [options]');

    program.on('--help', function () {
        console.log('  Examples:');
        console.log('');
        console.log('    $ garrosh init -n myProject -a wangyisheng,pengxing,sdcfe');
        console.log('    $ garrosh server');
        console.log('');
    });

    program
        .command('init')
        .description('Initialize a garrosh-based web project')
        .option('-n, --name [name]', 'project name')
        .option('-a, --author [author]', 'author names, split with comma(,)')
        .action(function (options) {
            createApplication(options);
        });

    program
        .command('hellscream')
        .description('Make a war cry')
        .action(function () {
            console.log('Lok\'tar O\'gar!!!\n为了胜利！！为了部落！！');
        });

    program.parse(process.argv);
};

if (module === require.main) {
    exports.parse(process.argv);
}
