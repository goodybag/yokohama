import Promise from 'bluebird';
import isArray from 'lodash/lang/isArray';
import mapValues from 'lodash/object/mapValues';
import some from 'lodash/collection/some';

export class DependencySet {
    static fromExpr(expr) {
        if (typeof expr === 'function') {
            return new DependencyItem(expr);
        } else if (isArray(expr)) {
            return new DependencyList(expr);
        } else {
            return new DependencyMap(expr);
        }
    }

    constructor(set) {
        this.set = set;
    }

    mapPromise(fn) {
        throw new TypeError('DependencySet#mapPromise is not implemented');
    }

    some(fn) {
        return some(this.set, dep => DependencySet.fromExpr(dep).some(fn));
    }
}

export class DependencyList extends DependencySet {
    mapPromise(fn) {
        return Promise.all(this.set.map(fn));
    }
}

export class DependencyMap extends DependencySet {
    mapPromise(fn) {
        return Promise.props(mapValues(this.set, fn));
    }
}

export class DependencyItem extends DependencySet {
    mapPromise(fn) {
        return Promise.resolve(fn(this.set));
    }

    some(fn) {
        return !!fn(this.set);
    }
}
