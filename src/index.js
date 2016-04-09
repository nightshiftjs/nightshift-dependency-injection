'use strict';

var Q = require('q');
var Wiretree = require('wiretree');
var uuid = require('node-uuid');
var _ = require('lodash');

var pluginFactory = require('./plugin');
var injectorFactoryFactory = require('./injector');

module.exports = function plugin(nightShift) {
    var injectorFactory = injectorFactoryFactory(Q, nightShift.functions.factoryOf(Wiretree), uuid, _);
    var pluginFn = pluginFactory(injectorFactory);
    pluginFn(nightShift);
};