'use strict';

describe('Injector', function () {
    var injectorFactoryFactory = require('../src/injector');
    var _ = require('lodash');
    var injector, Q, wiretreeFactory, uuid, uuidv1, tree, resolveTree, resolveAllPromise, deferred, object, key;

    beforeEach(function () {
        setUpQ();
        setUpWiretreeFactory();
        setUpUuid();
        object = {};
        key = 'key';
        injector = createInjector();
    });

    function setUpQ() {
        resolveAllPromise = 'resolveAllPromise';
        deferred = jasmine.createSpyObj('deferred', ['resolve']);
        deferred.promise = resolveAllPromise;
        Q = jasmine.createSpyObj('Q', ['defer']);
        Q.defer.and.returnValue(deferred);
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

    function createInjector() {
        var injectorFactory = injectorFactoryFactory(Q, wiretreeFactory, uuid, _);
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
        expect(deferred.resolve).toHaveBeenCalled();
    });

    it('should return the object with the given key', function () {
        expect(injector.get(key)).toBe(object);
        expect(tree.get).toHaveBeenCalledWith(key);
    });
});