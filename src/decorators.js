import {DependencySet} from './dependency-set';
import {Provider} from './provider';

export function provide(token) {
    return decorator;

    function decorator(target) {
        target.provider = new Provider(token, target);
    }
}

export function dependencies(...tokens) {
    return decorator;

    function decorator(target) {
        target.dependencies = DependencySet.fromExpr(tokens);
    }
}
