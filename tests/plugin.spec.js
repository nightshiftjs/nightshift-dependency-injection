'use strict';

describe('The plugin', function () {

    var pluginFactory = require('../src/plugin');
    var nightShift, plugin, injector, injectorFactory;

    beforeEach(function () {
        nightShift = {};
        injector = 'injector';
        injectorFactory = jasmine.createSpy('injectorFactory');
        injectorFactory.and.returnValue(injector);
        plugin = pluginFactory(injectorFactory);
    });

    it('should enrich the NightShift core object with a \'di\' plugin', function () {
        plugin(nightShift);
        expect(nightShift.di).toEqual({
            newInjector: jasmine.any(Function)
        });
    });

    it('should return a new injector', function () {
        plugin(nightShift);
        expect(nightShift.di.newInjector()).toBe(injector);
    });
});