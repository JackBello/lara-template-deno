// deno-lint-ignore-file no-explicit-any
import { transpileCode } from "./transpile.code.ts"

export const convertCode = async (text: string, context: any, evaluate = true) => {
    const lines = text.replace(/\r/g,"").split("\n");

    let result = "";
    let transpile = "";
    let index;

    for(let line of lines) {
        let regExp = new RegExp(context.engine.regExp.init.slice(0,-1) + "|" + context.engine.regExp.directives.slice(1), "gim").exec(line)

        while(regExp) {
            index = regExp.index;

            if (index !== 0) {
                transpile = await transpileCode(line.slice(0, index), context);
                line = line.slice(index);
                result += `${transpile}\n`;
            }

            transpile = await transpileCode(regExp[0], context);
            line = line.slice(regExp[0].length);
            result += `${transpile}\n`;
            regExp = new RegExp(context.engine.regExp.init, "gim").exec(line)
        }

        if (line) {
            transpile = await transpileCode(line, context);
            result += `${transpile}\n`;
        }
    }

    if (evaluate) result = context.engine.preload + "const _ = [];\n" + "let _loop = {index:0,iteration:1,quantity:0,remaining:0,depth:0,first:undefined,last:undefined,parent:{}}\n" + "/*!START EVAL!*/\n" + result + "/*!END EVAL!*/\n" + "return _.join('');";

    return result;
}