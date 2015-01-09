/**
 * @file hello.js
 * @author @AUTHOR_HEADER@
 * @description
 * 示例控制器
 **/

module.exports = {
    // 示例响应
    index: function (req, res) {
        res.render('index', {
            message: 'I\'m Garrosh Hellscream, son of Grom and Warchief of the Horde!!!'
        });
    }
}