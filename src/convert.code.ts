import { transpileCode, transpileComponent } from "./transpile.code.ts"
import { TOptionsConvertCode } from "./types.ts";

export const convertCode = async (text: string, context: any, options: TOptionsConvertCode): Promise<string> => {
    text = text.replace(/\r/g, "")

    let result = "";
    let transpile = "";
    let index;

    const expression = context.engine.regExp.directives.length > 2 ?
        `(${context.engine.regExp.init.source}|${context.engine.regExp.directives.slice(1, -1)}|${context.engine.regExp.expressions.source}|${context.engine.regExp.component.source})`
        :
        `(${context.engine.regExp.init.source}|${context.engine.regExp.expressions.source}|${context.engine.regExp.component.source})`;

    let regExp = new RegExp(expression, "gim").exec(text)

    while (regExp) {
        index = regExp.index;

        if (index !== 0) {
            transpile = await transpileCode(text.slice(0, index), context);            
            text = text.slice(index);
            result += `${transpile}\n`;
        }

        transpile = await transpileCode(regExp[0], context);
        text = text.slice(regExp[0].length);
        result += `${transpile}\n`;
        regExp = new RegExp(expression, "gim").exec(text)
    }

    transpile = await transpileCode(text, context);
    result += `${transpile}\n`;

    result = options.evaluate ?
        `${ options.typeCheck ? "// @ts-check" : "" }
${ options.strict ? "'use strict';" : "" }

${ context.engine.settings.comments ? context.engine.comments.preload[0] : "" }
${ context.engine.preloadCode }
${ context.engine.settings.comments ? context.engine.comments.preload[1] : "" }

${ context.engine.settings.comments ? context.engine.comments.directives[0] : "" }
${ context.engine.preloadDirectives }
${ context.engine.settings.comments ? context.engine.comments.directives[1] : "" }

${ options.export ? 'export default async function render(scoped, shared, directives, functions, data) {' : '' }
const _ = [];
let _loop = { index: 0, iteration: 1, quantity: 0, remaining: 0, depth: 0, first: undefined, last: undefined, parent: {} };

${ context.engine.settings.comments ? context.engine.comments.eval[0] : "" }
${ result }
${ context.engine.settings.comments ? context.engine.comments.eval[1] : "" }

return _.join('');
${options.export ? '}' : ''}`
    :
        result;
    
    return result;
}

export const convertComponent = async (text: string, context: any): Promise<string> => {
    text = text.replace(/\r/g, "")

    let result = "";
    let transpile = "";
    let index;

    const expression = `(@code(\\s*\\((.*?)\\);|)|@endCode|@if\\s*\\((.*?)\\);|@elseIf\\s*\\((.*?)\\);|@else|@endIf|@for\\s*\\((.*?)\\);|@endFor|@continue(\\s*\\((.*?)\\);|)|@break(\\s*\\((.*?)\\);|)|@classNames\\s*\\(([\\s\\S]*?)\\)\\s*;|@styles\\s*\\(([\\s\\S]*?)\\)\\s*;|@attributes\\s*\\(([\\s\\S]*?)\\)\\s*;|${context.engine.regExp.expressions})`;

    let regExp = new RegExp(expression, "gim").exec(text)

    while (regExp) {
        index = regExp.index;

        if (index !== 0) {
            transpile = await transpileComponent(text.slice(0, index), context);            
            text = text.slice(index);
            result += `${transpile}\n`;
        }

        transpile = await transpileComponent(regExp[0], context);
        text = text.slice(regExp[0].length);
        result += `${transpile}\n`;
        regExp = new RegExp(expression, "gim").exec(text)
    }

    transpile = await transpileComponent(text, context);
    result += `${transpile}\n`;

    result = `const _ = [];\nlet _loop = { index: 0, iteration: 1, quantity: 0, remaining: 0, depth: 0, first: undefined, last: undefined, parent: {} };\n${ result }\nreturn _.join('');`
    
    return result;
}