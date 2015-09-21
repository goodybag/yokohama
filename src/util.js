import lodash from 'lodash';

export function mergeTargets(targets) {
    const deps = lodash.chain(targets)
        .pluck('dependencies')
        .filter()
        .reduce((a, b) => ({...a, ...b}))
        .value();

    return deps;
}
