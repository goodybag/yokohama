export function makeAnnotation(name = 'Annotation') {
    const cache = new WeakMap();

    return annotate;

    function annotate(token) {
        if (token == null) {
            throw new TypeError('Cannot annotate undefined token');
        } else if (cache.has(token)) {
            return cache.get(token);
        } else {
            const annotatedToken = makeAnnotatedToken(token);

            cache.set(token, annotatedToken);

            return annotatedToken;
        }
    }

    function makeAnnotatedToken(token) {
        class AnnotatedDependency {}

        Object.defineProperty(AnnotatedDependency, 'name', {
            value: `${name}(${token.name})`
        });

        return AnnotatedDependency;
    }
}
