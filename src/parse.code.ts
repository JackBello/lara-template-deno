import { convertCode, convertComponent } from "./convert.code.ts"
import * as ts from 'npm:typescript@5.0.4';

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

export const parseCode = async (text: string, data: any, typescript = false, context: any ): Promise<string> => {
    const code = typescript ?
        ts.default.transpileModule((await convertCode(text, context, {
            evaluate: true,
            export: false,
            strict: false,
            typeCheck: false
        })), { 
            compilerOptions: { module: ts.default.ModuleKind.ESNext },
        }).outputText
        : 
        await convertCode(text, context, {
            evaluate: true,
            export: false,
            strict: false,
            typeCheck: false
        });


    const compile = new AsyncFunction(`scoped, shared, directives, functions, components, data`, code);

    return await compile(context.scoped, context.shared, context.directives, context.functions, context.components, data);
}

export const parseComponent = async (text: string, data: any, context: any): Promise<string> => {
    const code = await convertComponent(text, context); 

    const compile = new AsyncFunction(`functions, data`, code);

    return await compile(context.functions, data);
}