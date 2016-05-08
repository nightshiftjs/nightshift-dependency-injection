'use strict';

var Wiretree = require('wiretree');
var uuid = require('node-uuid');
var _ = require('lodash');
var glob = require('glob');
var path = require('path');

var pluginFactory = require('./plugin');
var injectorFactoryFactory = require('./injector');

module.exports = function plugin(nightShift) {
    var injectorFactory = injectorFactoryFactory(nightShift.promises, nightShift.functions.factoryOf(Wiretree), uuid, _, glob, path);
    var pluginFn = pluginFactory(injectorFactory);
    pluginFn(nightShift);
};