'use strict';

module.exports = function createFakeCommand(logger) {
    return {
        execute: function () {
            logger.log('Executing command...');
        }
    };
};