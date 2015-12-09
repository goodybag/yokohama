import Promise from 'bluebird';
import isArray from 'lodash/lang/isArray';
import mapValues from 'lodash/object/mapValues';
import some from 'lodash/collection/some';

export class DependencySet {
    static fromExpr(expr) {
        if (typeof expr === 'function') {
            return new DependencyItem(expr);
        } else if (isArray(expr)) {
            return DependencyList.fromExpr(expr);
        } else if (typeof expr === 'object') {
            return DependencyMap.fromExpr(expr);
        } else {
            return new DependencyItem(expr);
        }
    }

    constructor(set) {
        this.set = set;
    }

    mapPromise(fn) {
        throw new TypeError('DependencySet#mapPromise is not implemented');
    }

    some(fn) {
        return some(this.set, dep => dep.some(fn));
    }
}

export class DependencyList extends DependencySet {
    static fromExpr(expr) {
        return new DependencyList(expr.map(DependencySet.fromExpr));
    }

    mapPromise(fn) {
        return Promise.all(this.set.map(fn));
    }
}

export class DependencyMap extends DependencySet {
    static fromExpr(expr) {
        return new DependencyMap(mapValues(expr, DependencySet.fromExpr));
    }

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
