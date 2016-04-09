'use strict';

module.exports = function createPluginFunction(injectorFactory) {

    function newInjector() {
        return injectorFactory();
    }

    return function plugin(julia) {
        julia.di = {
            newInjector: newInjector
        };
    };
};