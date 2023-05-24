/**
 * 
 * @param { any } data
 * @param { number } depth 
 * @returns { string }
 */
export const varDump = (data: any, depth = 10): string => {
    const seen = new Set();

    /**
     * 
     * @param { any } object
     * @param { number } depth 
     * @returns { string }
     */
    const inspect = (object: any, depth: number): string => {
        if (depth === 0)
            return '...';

        if (object === null)
            return 'null';

        if (object === undefined)
            return 'undefined';

        if (typeof object === 'string')
            return `"${object}"`;

        if (typeof object === 'number' || typeof object === 'boolean')
            return object.toString();

        if (typeof object === 'function')
            return `[Function: ${object.name}]`;

        if (Array.isArray(object)) {
            if (seen.has(object))
                return '[Circular]';

            seen.add(object);

            const items = object.map((item) => inspect(item, depth - 1));

            seen.delete(object);

            return `[${items.join(', ')}]`;
        }

        if (typeof object === 'object') {
            if (seen.has(object))
                return '[Circular]';

            seen.add(object);

            const items = Object.entries(object).map(([key, value]) => {
                return `${key}: ${inspect(value, depth - 1)}`;
            });

            seen.delete(object);

            return `{ ${items.join(', ')} }`;
        }

        return '';
    }

    return inspect(data, depth)
}

export const isset = (accessor: any): boolean => typeof accessor !== "undefined" && accessor !== null;

export const empty = (accessor: any): boolean => typeof accessor === 'undefined' || accessor === null || accessor === '';