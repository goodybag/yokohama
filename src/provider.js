import {readDependencies} from './util';

/**
 * Formalized structure for representing
 * a provision of a dependency's constructor.
 * Any dependencies of the constructor must
 * be decorated on the constructor's reference.
 *
 * @param {function} token - The token of the dependency
 * @param {function} mock - The constructor function used to instantiate the dependency's instance.
 */
export class Provider {
    /**
     * Handles the various possible formats for
     * a provider.
     *
     * @example
     * @provide(Something)
     * class SomethingElse {
     *     // ...
     * }
     *
     * Provider.fromToken(SomethingElse);
     * Provider.fromToken({token: Something, provider: SomethingElse});
     */
    static fromToken(token) {
        if (typeof token === 'function') {
            return token.provider || new Provider(token, token);
        } else if (typeof token === 'object') {
            return new Provider(token.token, token.provider);
        } else {
            throw new TypeError(`Provider.fromToken cannot handle value "${token}"`);
        }
    }

    constructor(token, mock) {
        this.token = token;
        this.mock = mock;
    }

    instantiate(args) {
        return new this.mock(...args);
    }

    getDependencies() {
        return readDependencies(this.mock);
    }
}
