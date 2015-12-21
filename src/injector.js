import Promise from 'bluebird';
import each from 'lodash/collection/each';

import {DependencySet} from './dependency-set';
import {Provider} from './provider';

export class Injector {
    constructor(modules = [], providers = new Map()) {
        this.cache = new Map();
        this.promiseCache = new Map();
        this.providers = providers;

        each(modules, module => {
            const provider = Provider.fromToken(module);

            this.provide(provider);
        });

        this.provide(new Provider(Injector, () => this));
    }

    provide(provider) {
        this.providers.set(provider.token, provider);
    }

    getProviderFor(token) {
        if (this.providers.has(token)) {
            return this.providers.get(token);
        } else {
            const provider = Provider.fromToken(token);
            this.provide(provider);

            return provider;
        }
    }

    load(token, provider = this.getProviderFor(token)) {
        if (this.cache.has(provider)) {
            return Promise.resolve(this.cache.get(provider));
        } else if (this.promiseCache.has(provider)) {
            return this.promiseCache.get(provider);
        } else {
            return this.create(provider);
        }
    }

    create(provider) {
        const dependencies = provider.getDependencies();

        const promise = dependencies.mapPromise(depToken => this.get(depToken))
            .then(values => provider.instantiate(values))
            .tap(inst => this.cache.set(provider, inst));

        this.promiseCache.set(provider, promise);

        return promise;
    }

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

    createChild(modules = []) {
        return new ChildInjector(modules, new Map(), this);
    }

    dump(localCache = new Map()) {
        this.cache.forEach((instance, provider) => {
            localCache.set(provider.token, instance);
        });

        return localCache;
    }
}

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

                return this.parent.create(provider);
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

    dump(localCache = new Map()) {
        this.parent.dump(localCache);
        super.dump(localCache);

        return localCache;
    }
}
