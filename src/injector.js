import Promise from 'bluebird';
import each from 'lodash/collection/each';

import {DependencySet} from './dependency-set';
import {Provider} from './provider';

/**
 * Contains the cache for dependency instances.
 * Can be constructed with mock constructors, that
 * override the original dependency's constructor.
 *
 * @param {function[]} [modules] - An array of mocks constructors
 * @param {Map<function, Provider>} [providers] - (Internal) starting providers
 */
export class Injector {
    constructor(modules = [], providers = new Map()) {
        this.cache = new Map();
        this.promiseCache = new Map();
        this.providers = providers;

        each(modules, module => {
            const provider = Provider.fromToken(module);

            this.provide(provider);
        });

        const self = this;
        this.provide(new Provider(Injector, function() {
            return self;
        }));
    }

    provide(provider) {
        this.providers.set(provider.token, provider);
    }

    /**
     * Returns the cached provider instance for
     * the given token. If it's not found, it
     * will instantiate and cache a provider.
     */
    getProviderFor(token) {
        if (this.providers.has(token)) {
            return this.providers.get(token);
        } else {
            const provider = Provider.fromToken(token);
            this.provide(provider);

            return provider;
        }
    }

    /**
     * Checks the cache for the given token's
     * provider. If an instance is found in the
     * cache or the promise cache, it will return
     * it, otherwise it creates initializes the
     * given token with `Injector#create`.
     *
     * @see Injector#create
     * @param {function} token
     * @returns {Promise}
     */
    load(token, provider = this.getProviderFor(token)) {
        if (this.cache.has(provider)) {
            return Promise.resolve(this.cache.get(provider));
        } else if (this.promiseCache.has(provider)) {
            return this.promiseCache.get(provider);
        } else {
            return this.create(provider);
        }
    }

    /**
     * Loads the dependencies of the given
     * provider and instantiates the provider's
     * constructor with the given dependencies.
     *
     * @param {Provider} provider
     * @returns Promise
     */
    create(provider) {
        const dependencies = provider.getDependencies();

        const promise = dependencies.mapPromise(depToken => this.get(depToken))
            .then(values => provider.instantiate(values))
            .tap(inst => this.cache.set(provider, inst));

        this.promiseCache.set(provider, promise);

        return promise;
    }

    /**
     * Loads each dependency in the given
     * dependency set.
     *
     * @example
     * injector.get(Foo); // => Promise<Foo>
     * injector.get({
     *   foo: Foo,
     *   bar: Bar
     * }); // => Promise<{foo: Foo, bar: Bar}>
     * @see Injector#load
     * @param {(function|Object|Array)} token
     * @returns {Promise}
     */
    get(token) {
        if (token instanceof DependencySet) {
            return token.mapPromise(depToken => this.get(depToken));
        } else if (typeof token === 'function') { // If it is a constructor/factory
            return this.load(token);
        } else if (typeof token === 'object') { // If it is an array/object
            const set = DependencySet.fromExpr(token);

            return this.get(set);
        } else {
            throw new TypeError(`Injector#get cannot handle value "${token}"`);
        }
    }

    /**
     * Constructs a child injector with the
     * given mock constructors.
     */
    createChild(modules = []) {
        return new ChildInjector(modules, new Map(), this);
    }

    /**
     * Serializes the cache into a map of
     * token -> instance.
     */
    dump(localCache = new Map()) {
        this.cache.forEach((instance, provider) => {
            localCache.set(provider.token, instance);
        });

        return localCache;
    }
}

/**
 * Child injectors delegate to their parent's
 * cache and only caches dependencies that
 * depend on the child's mock constructors.
 *
 * @param {function[]} modules
 * @param {Map<function, Provider} providers
 * @param {Injector} parent
 */
export class ChildInjector extends Injector {
    constructor(modules, providers, parent) {
        super(modules, providers);
        this.tokensForParent = new Set();
        this.parent = parent;
    }

    getProviderFor(token) {
        if (this.providers.has(token)) {
            return this.providers.get(token);
        } else {
            return this.parent.getProviderFor(token);
        }
    }

    load(token) {
        if (token === Injector) {
            return Promise.resolve(this);
        } else if (this.providers.has(token)) {
            return super.load(token, this.providers.get(token));
        } else if (this.tokensForParent.has(token)) {
            return this.parent.load(token);
        } else {
            const provider = this.parent.getProviderFor(token);

            if (this.specializes(provider)) {
                this.providers.set(provider.token, provider);

                return this.create(provider);
            } else {
                this.tokensForParent.add(token);

                return this.parent.load(token, provider);
            }
        }
    }

    specializes(provider) {
        return provider.getDependencies().some(dep => {
            if (this.providers.has(dep)) {
                return true;
            } else if (this.tokensForParent.has(dep)) {
                return false;
            } else {
                return this.specializes(this.parent.getProviderFor(dep));
            }
        });
    }

    /**
     * Joins the parent's cache dump with
     * locally cached dependencies.
     *
     * @see Injector#dump
     */
    dump(localCache = new Map()) {
        this.parent.dump(localCache);
        super.dump(localCache);

        return localCache;
    }
}
