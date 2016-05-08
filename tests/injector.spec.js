'use strict';

describe('The injector', function () {
    var injectorFactoryFactory = require('../src/injector');
    var _ = require('lodash');
    var injector, promises, wiretreeFactory, uuid, uuidv1, glob, path, tree, resolveTree, resolveAllPromise, deferred, object,
        key, module;

    beforeEach(function () {
        setUpPromises();
        setUpWiretreeFactory();
        setUpUuid();
        setUpGlob();
        setUpPath();
        setUpModule();
        object = {};
        key = 'key';
        injector = createInjector();
    });

    function setUpPromises() {
        resolveAllPromise = 'resolveAllPromise';
        deferred = jasmine.createSpyObj('deferred', ['resolve']);
        deferred.promise = resolveAllPromise;
        promises = jasmine.createSpyObj('promises', ['defer']);
        promises.defer.and.returnValue(deferred);
    }

    function setUpWiretreeFactory() {
        tree = jasmine.createSpyObj('tree', ['add', 'resolve', 'get']);
        tree.resolve.and.callFake(function (onResolve) {
            resolveTree = onResolve;
        });
        tree.get.and.callFake(function () {
            return object;
        });
        wiretreeFactory = jasmine.createSpy('wiretreeFactory');
        wiretreeFactory.and.returnValue(tree);
    }

    function setUpUuid() {
        uuidv1 = 'uuidv1';
        uuid = jasmine.createSpyObj('uuid', ['v1']);
        uuid.v1.and.returnValue(uuidv1);
    }

    function setUpGlob() {
        glob = jasmine.createSpyObj('glob', ['sync']);
    }

    function setUpPath() {
        path = jasmine.createSpyObj('path', ['dirname']);
    }

    function setUpModule() {
        module = jasmine.createSpyObj('module', ['require']);
        module.filename = 'module.filename';
    }

    function createInjector() {
        var injectorFactory = injectorFactoryFactory(promises, wiretreeFactory, uuid, _, glob, path);
        return injectorFactory();
    }

    it('should register the given object', function () {
        injector.register(object);
        expect(tree.add).toHaveBeenCalledWith('_' + uuidv1, {wiretree: object});
    });

    it('should register the given object with the given key', function () {
        injector.register(object, key);
        expect(tree.add).toHaveBeenCalledWith(key, {wiretree: object});
    });

    it('should register the given object with the given key but not resolve it', function () {
        injector.register(object, key, false);
        expect(tree.add).toHaveBeenCalledWith(key, object);
    });

    it('should promise to resolve all registered objects', function () {
        expect(injector.resolveAll()).toBe(resolveAllPromise);
        expect(tree.resolve).toHaveBeenCalled();
        resolveTree();
        expect(deferred.resolve).toHaveBeenCalledWith(injector);
    });

    it('should return the object with the given key', function () {
        expect(injector.get(key)).toBe(object);
        expect(tree.get).toHaveBeenCalledWith(key);
    });

    it('should execute all the configuration functions which are exported by modules whose file name ends with .di.js', function () {
        testConfigure(module, null, '*/**/*.di.js');
    });

    it('should execute all the configuration functions which are exported by modules whose file name matches the given pattern', function () {
        var configFilePattern = '*/**/*.dependency-injection.js';
        testConfigure(module, configFilePattern, configFilePattern);
    });

    function testConfigure(module, configFilePatternToPass, configFilePatternToAssert) {
        var moduleDirectory = '/path/to/module/directory';
        path.dirname.and.returnValue(moduleDirectory);

        var configFile1 = 'directory1/configFile1.di.js';
        var configFile2 = 'directory2/configFile2.di.js';
        glob.sync.and.returnValue([configFile1, configFile2]);

        var configFn1 = jasmine.createSpy('configFn1');
        var configFn2 = jasmine.createSpy('configFn2');
        module.require.and.returnValues(configFn1, configFn2);

        injector.configure(module, configFilePatternToPass);

        expect(path.dirname).toHaveBeenCalledWith(module.filename);
        expect(glob.sync).toHaveBeenCalledWith(configFilePatternToAssert, {cwd: moduleDirectory});
        expect(module.require).toHaveBeenCalledWith('./' + configFile1);
        expect(configFn1).toHaveBeenCalledWith(injector);
        expect(module.require).toHaveBeenCalledWith('./' + configFile2);
        expect(configFn2).toHaveBeenCalledWith(injector);
    }
});