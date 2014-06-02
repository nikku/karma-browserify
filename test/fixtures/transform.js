var fs = require('fs');

module.exports.text = '<' + fs.readFileSync(__dirname + '/text.txt', 'utf-8') + '>';