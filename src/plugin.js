'use strict';

module.exports = function createPluginFunction(injectorFactory) {

    function newInjector() {
        return injectorFactory();
    }

    return function plugin(nightShift) {
        nightShift.di = {
            newInjector: newInjector
        };
    };
};