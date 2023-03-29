// deno-lint-ignore-file no-explicit-any
import { convertCode } from "./convert.code.ts"

export const parseCode = async (text: string, data: any, context: any ): Promise<string> => {
    const code = await convertCode(text, context);

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

    const compile = new AsyncFunction(`engine, scoped, shared, directives, data`, code);

    return await compile(context.engine, context.scoped, context.shared, context.directives, data);
}