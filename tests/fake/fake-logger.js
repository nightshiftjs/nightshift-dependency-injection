'use strict';

module.exports = function createFakeLogger(console) {
    return {
        log: function (message) {
            console.log(message);
        }
    };
};