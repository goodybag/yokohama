/* global describe, it */

import expect from 'expect';

import {dependencies, provide} from '../src/decorators';
import {Provider} from '../src/provider';
import {
    DependencySet,
    DependencyMap,
    DependencyList,
    DependencyItem
} from '../src/dependency-set';

describe('@provide', function() {
    it('should raise an error on an undefined token', function() {
        expect(() => {
            @provide(undefined)
            class Foo {}
        }).toThrow(/@provide called with an undefined/);
    });

    it('should not throw when used like normal', function() {
        @provide(Object)
        class Foo {}

        expect(Foo.provider).toBeA(Provider);
        expect(Foo.provider.mock).toBe(Foo);
        expect(Foo.provider.token).toBe(Object);
    });
});

describe('@dependencies', function() {
    it('should raise an error when a nested token is undefined', function() {
        expect(() => {
            @dependencies(Object, {array: Array, somethingElse: undefined})
            class Foo {}
        }).toThrow();
    });

    it('should not throw when used like normal', function() {
        @dependencies(Object, {array: Array, foo: [Provider, Map]})
        class Bar {}

        expect(Bar.dependencies).toBeA(DependencySet);
        expect(Bar.dependencies).toEqual(new DependencyList([
            new DependencyItem(Object),
            new DependencyMap({
                array: new DependencyItem(Array),
                foo: new DependencyList([
                    new DependencyItem(Provider),
                    new DependencyItem(Map)
                ])
            })
        ]));
    });
});
