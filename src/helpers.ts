// deno-lint-ignore-file no-explicit-any
export const varDump = (data: any, depth = 10): any => {
    const seen = new Set();

    const inspect = (obj: any, depth: number): any => {
        if (depth === 0)
            return '...';

        if (obj === null)
            return 'null';

        if (obj === undefined)
            return 'undefined';

        if (typeof obj === 'string')
            return `"${obj}"`;

        if (typeof obj === 'number' || typeof obj === 'boolean')
            return obj.toString();

        if (typeof obj === 'function')
            return `[Function: ${obj.name}]`;

        if (Array.isArray(obj)) {
            if (seen.has(obj))
                return '[Circular]';

            seen.add(obj);

            const items = obj.map((item) => inspect(item, depth - 1));

            seen.delete(obj);

            return `[${items.join(', ')}]`;
        }

        if (typeof obj === 'object') {
            if (seen.has(obj))
                return '[Circular]';

            seen.add(obj);

            const items = Object.entries(obj).map(([key, value]) => {
                return `${key}: ${inspect(value, depth - 1)}`;
            });

            seen.delete(obj);

            return `{ ${items.join(', ')} }`;
        }

        return '';
    }

    return inspect(data, depth)
}

export const isset = (accessor: any) => typeof accessor !== "undefined" && accessor !== null;

export const empty = (accessor: any) => typeof accessor === 'undefined' || accessor === null || accessor === '';