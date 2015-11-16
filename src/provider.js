import {readDependencies} from './util';

export class Provider {
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
