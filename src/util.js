import {DependencyList} from './dependency-set';

export function readDependencies(token) {
    if (typeof token !== 'function') {
        throw new TypeError(`"${token}" is not a function`);
    }

    return token.dependencies || new DependencyList([]);
}
