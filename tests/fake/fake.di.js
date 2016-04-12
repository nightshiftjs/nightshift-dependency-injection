'use strict';

module.exports = function (injector) {
    injector.register(console, 'console', false);
    injector.register(require('./fake-logger'), 'logger');
    injector.register(require('./fake-command'), 'command');
};