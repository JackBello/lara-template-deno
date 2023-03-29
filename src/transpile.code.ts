import { convertCode } from "./convert.code.ts";
import { ILaraDenoContext } from "./types.ts";
import { escapeHTML, includeCode, includeFile, unescapedHTML } from "./utils.ts";

const replaceMatch = (line: string) => {    
    line = `${line}`
        .replace(/\$/g, "data.")
        .replace(/\#/g, "shared.");

    return line
}

const replaceText = (line: string) => {
    if (line.match(/{{\*(.*?)\*}}/g)) {
        line = line.replace(/\{\{\*/g, "// ", ).replace(/\*\}\}/g, "");
        return line;
    } else if (line.match(/{{\*\*/g)) {
        line = line.replace(/\{\{\*\*/g, "/*", );
        return line;
    } else if (line.match(/\*\*}}/g)) {
        line = line.replace(/\*\*\}\}/g, "*/", );
        return line;
    } else if (line.match(/{{\>(.*?)\<}}/g)) {
        line = line.replace(/\{\{\>/g, "").replace(/\<\}\}/g, "");
        line = escapeHTML(line);
        return `\`${line}\\n\``;
    } else if (line.match(/{{\<(.*?)\>}}/g)) {
        line = line.replace(/\{\{\</g, "").replace(/\>\}\}/g, "");
        line = unescapedHTML(line);
        return `\`${line}\\n\``;
    } else if (line.match(/{{(.*?)}}/g)) {
        line = line.match(/(\$|\#)/g) ? replaceMatch(line) : line;
        line = line.replace(/\{\{/g, "${").replace(/\}\}/g, "}");
        return `\`${line}\\n\``;
    }
    return `\`${line}\\n\``;
};

const _replaceLine = (line: string, context: ILaraDenoContext) => {
    context;
    
    line = line.split(/@/g).map(value => {
        value = value.trim()

        let validate;

        validate = value.match(/if\((.*?)+\)/g);
        if (validate) {
            validate = validate[0].replace("(", "\(").replace(")", "\)");
            value = value.replace(validate, `${validate} {`)
        }

        validate = value.match(/endif/g);
        if (validate) {
            value = value.replace(/endif/g, "}");
        }

        return value
    }).join(" ")

    return line;
}

export const transpileDirectiveCode = (text: string, context: ILaraDenoContext) => {
    let converted = text;

    const scoped = RegExp(context.engine.regExp.scoped, "gim");

    if (converted.match(scoped) && scoped.source.length > 2) {
        context.engine.regExp.scoped.slice(1, -1).split("|").forEach(
            value => converted = converted.replace(RegExp(`${value}`, "g"), `scoped.${value}`)
        )
    }

    converted = replaceMatch(converted);

    return converted
}

export const transpileCode = async (line: string, context: ILaraDenoContext) => {
    if (line == "") return "";

    let converted = line;
    let path, text, parts, rawCode, makeClass;

    const init = RegExp(context.engine.regExp.init, "gim");
    const scoped = RegExp(context.engine.regExp.scoped, "gim");
    const directives = RegExp(context.engine.regExp.directives, "gim");

    if (converted.match(init)) {
        if (converted.match(/@import/g)) {
            text = converted.replace(/@import/g, "").trim();

            text.match(",") ?
                parts = text.split(",")
                :
                parts = text;

            if (typeof parts === "string") {
                converted = converted.replace(/@import\((.*?)\)/g, `await import${parts}`)
            }
            else if (typeof parts === "object") {
                converted = converted.replace(/@import\((.*?)\)/g, `const ${parts[0].slice(1)} = await import(${parts[1].slice(0,-1)})`)
            }
        }

        if (converted.match(/@include/g)) {
            path = converted.replace(/@include/g, "").trim();
            path = path.slice(2,-2);
            text = await includeFile(path, context);
            converted = converted.replace(/@include\((.*?)\)/g, await convertCode(text, context, false));
        }

        if (converted.match(/@code/g)) {
            rawCode = converted.replace(/@code/g,"");

            rawCode.match(/(\("anonymous"\)|\('anonymous'\))/g) ?
                context.engine.code.is_code_anonymous = true : null;

            rawCode.match(/(\(\"(.*?)\"\)|\(\'(.*?)\'\))/g) && !rawCode.match(/(\("anonymous"\)|\('anonymous'\))/g) ?
                context.engine.code.is_code_import = true : null;

            (rawCode.startsWith("(") && rawCode.endsWith(")")) && (!rawCode.slice(1,-1).startsWith(`"`) && !rawCode.slice(1,-1).endsWith(`"`)) ?
                context.engine.code.is_code_raw = true : null;

            if (context.engine.code.is_code_import) {
                path = converted.replace(/@code/g, "").trim();
                path = path.slice(2,-2);
                text = await includeCode(path, context);
                converted = "//start code import\n" + converted.replace(/@code\((.*?)\)/g, transpileDirectiveCode(text, context)) + "\n//end code import";

                context.engine.code.is_code_import = false;
            } else if (context.engine.code.is_code_raw) {
                converted = replaceMatch(converted)
                    .replace(/@code/g, "//start code raw\n")
                    .replace(/(\(|\))/g, "") + "\n//end code raw";
                
                context.engine.code.is_code_raw = false;
            } else {
                context.engine.code.is_code = true;
            
                converted = context.engine.code.is_code_anonymous ?
                    converted.replace(/(@code\("anonymous"\)|@code\('anonymous'\))/g, "//start code anonymous\n(() => {")
                    :
                    converted.replace(/@code/g, "//start code");
            }
        }

        if (converted.match(/@endcode/g)) {
            converted =  context.engine.code.is_code_anonymous ? 
                converted.replace(/@endcode/g, "})();\n//end code anonymous")
                :
                converted.replace(/@endcode/g, "//end code")

            context.engine.code.is_code = false;
            context.engine.code.is_code_anonymous = false;
        }

        if (converted.match(/@default/g)) {
            context.engine.code.is_default = true;
            converted = converted.replace(/@default/g, "default: ")
            context.engine.code.is_default = false;
        }

        if (converted.match(/@continue/g)) {
            context.engine.code.is_continue = true;
            converted = converted.match(/@continue\((.*?)\)/g) ?
                converted.replace(/@continue/g, "if") + " continue;\n"
                :
                converted.replace(/@continue/g, "continue;")
            context.engine.code.is_continue = false;
        }

        if (converted.match(/@break/g)) {
            context.engine.code.is_break = true;
            converted = converted.match(/@break\((.*?)\)/g) ?
                converted.replace(/@break/g, "if") + " break;\n"
                :
                converted.replace(/@break/g, "break;")
            if (context.engine.code.is_case) context.engine.code.is_case = false;
            if (context.engine.code.is_default) context.engine.code.is_default = false;
            context.engine.code.is_break = false;
        }

        if (converted.match(/@with/g)) {
            context.engine.code.is_with = true;
            converted = replaceMatch(converted)
                .replace(/@with/g, "with ")
                .slice(0, -1) + ") {"
        }

        if (converted.match(/@endwith/g)) {
            context.engine.code.is_with = false;
            converted = converted.replace(/@endwith/g, "}");
        }

        if (converted.match(/@for/g)) {
            context.engine.code.is_for = true;
            context.engine.custom.sentenceFor = replaceMatch(converted)
                .replace(/@for/g, "")
                .replace(/(\(|\))/g, "")
            context.engine.custom.sentenceFor = context.engine.custom.sentenceFor.match(/ (in|of) /g) ?
                context.engine.custom.sentenceFor.replace(/(const|let) [a-zA-Z_$,{}\[\]]+ (of|in) /g, "")
                :
                "";

            converted = replaceMatch(converted)
                .replace(/@for/g, "for ")
                .slice(0, -1) + ") {"

            if (context.engine.custom.sentenceFor !== "") {
                converted = `_loop.first = ${context.engine.custom.sentenceFor}.at(0);\n` +
                            `_loop.last = ${context.engine.custom.sentenceFor}.at(-1);\n` +
                            `_loop.quantity = ${context.engine.custom.sentenceFor}.length;\n` +
                            `_loop.remaining = ${context.engine.custom.sentenceFor}.length;\n` +
                            `${converted}`;
            }
        }

        if (converted.match(/@endfor/g)) {
            context.engine.code.is_for = false;
            converted = converted.replace(/@endfor/g, "}");

            if (context.engine.custom.sentenceFor !== "") {
                converted = `_loop.index++;\n` +
                            `_loop.iteration++;\n` +
                            `_loop.remaining--;\n` +
                            `${converted}`
            }

            context.engine.custom.sentenceFor = "";
        }

        if (converted.match(/@while/g)) {
            context.engine.code.is_while = true;
            converted = replaceMatch(converted)
                .replace(/@while/g, "while ")
                .slice(0, -1) + ") {"
        }

        if (converted.match(/@endwhile/g)) {
            context.engine.code.is_while = false;
            converted = converted.replace(/@endwhile/g, "}");
        }

        if (converted.match(/@dowhile/g)) {
            context.engine.code.is_do_while = true;
            converted = converted
                .replace(/@dowhile/g, "do {")
        }

        if (converted.match(/@enddowhile/g)) {
            context.engine.code.is_do_while = false;
            converted = replaceMatch(converted)
                .replace(/@enddowhile/g, "} while ")
        }

        if (converted.match(/@if/g)) {
            context.engine.code.is_if = true;
            converted = replaceMatch(converted)
                .replace(/@if/g, "if ")
                .slice(0, -1) + ") {"
        }

        if (converted.match(/@elseif/g)) {
            context.engine.code.is_else_if = true;
            converted = replaceMatch(converted)
                .replace(/@elseif/g, "} else if ")
                .slice(0, -1) + ") {"
        }

        if (converted.match(/@else/g)) {
            context.engine.code.is_else = true;
            converted = converted.replace(/@else/g, "} else {");
        }

        if (converted.match(/@endif/g)) {
            if (context.engine.code.is_if) context.engine.code.is_if = false;
            if (context.engine.code.is_else_if) context.engine.code.is_if = false;
            if (context.engine.code.is_else) context.engine.code.is_if = false;
            converted = converted.replace(/@endif/g, "}");
        }

        if (converted.match(/@switch/g)) {
            context.engine.code.is_switch = true;
            converted = replaceMatch(converted)
                .replace(/@switch/g, "switch ")
                .slice(0, -1) + ") {"
        }

        if (converted.match(/@case/g)) {
            context.engine.code.is_case = true;
            converted = replaceMatch(converted)
                .replace(/@case/g, "case ")
                .replace("(", "")
                .replace(")", ":")
        }

        if (converted.match(/@endswitch/g)) {
            context.engine.code.is_switch = false;
            converted = converted.replace(/@endswitch/g, "}");
            if (context.engine.code.is_default) context.engine.code.is_default = false;
        }

        if (converted.match(/@function/)) {
            context.engine.code.is_function = true;
            converted = converted
                .replace(/@function/g, "function ")
                .replace(/\(/g, "_")
                .replace(",", "(")
                .replace(/(\"|\")/g, "")
                .replace(/\)/g, ") {");
        }

        if (converted.match(/@endfunction/)) {
            context.engine.code.is_function = false;
            converted = converted.replace(/@endfunction/g, "}");
        }

        if (converted.match(/@callfunction/g)) {
            context.engine.code.is_call_function = true;
            converted = replaceMatch(converted)
                .replace(/@callfunction/g, "")
                .replace(/\(/g, "_")
                .replace(/(\"|\")/g, "")
                .replace(",", "(");
            converted = `_.push(${converted})`;
            context.engine.code.is_call_function = false;
        }

        if (converted.match(/@class/g)) {
            context.engine.code.is_class = true;
            converted = converted
                .replace(/@class/g, "class ")
                .replace(/\(/g, "_")
                .replace(/(\"|\")/g, "")
                .replace(/\)/g, " {");
        }

        if (converted.match(/@endclass/g)) {
            context.engine.code.is_class = false;
            converted = converted.replace(/@endclass/g, "}");
        }

        if (converted.match(/@makeclass/g)) {
            context.engine.code.is_make_class = true;
            makeClass = replaceMatch(converted)
                .replace(/@makeclass/g, "")
                .replace(/(\(|\))/g,"")
                .split(",")
                .map(c => c.trim())[1];

            converted = replaceMatch(converted)
                .replace(/@makeclass/g, "const ")
                .replace(/\(/g, "")
                .replace(",", " = new")
                .replace(",", "(")
                .replace(")", ");")
                .replace(makeClass, "_"+makeClass);
            context.engine.code.is_make_class = false;
        }
    } else if (converted.match(directives) && directives.source.length > 2) {
        if (converted.match(/@\./)) {
            converted = `_.push(${converted.replace(/\@\./g, 'directives.')})`;
        } else {
            if (converted.match(/@end[a-z]+/g)) {
                context.engine.code.is_custom_directive = false;
                context.engine.custom.directive = context.engine.custom.directive.replace("/*SENTENCE*/", "return __;");
                converted = converted.replace(/@end[a-z]+/g, `${context.engine.custom.directive}\n_.push(_${converted.replace(/@end/g, '')}_(${context.engine.custom.params}))`);
                context.engine.custom.directive = "";
                context.engine.custom.params = "";
            } else if (converted.match(/@/g)) {
                context.engine.code.is_custom_directive = true;

                context.engine.custom.params = converted.replace(/@[a-zA-Z]+/g,'')

                context.engine.custom.directive = context
                    .directives[converted.replace(/@/g, '').replace(/\((.*?)\)/g,"")]
                    .toString()
                    .replace("(",  "function _" + converted.replace(/@/g, '').replace(/\((.*?)\)/g,"") + "_ (")
                    .replace("__ = []", "")
                    .replace("=>", " ");

                converted = converted.replace(/@[a-z]+/g, "").replace(/\((.*?)\)/g,"");
            }
        }
    } else {
        if (!context.engine.code.is_code && !context.engine.code.is_function && !context.engine.code.is_class) {
            if (context.engine.code.is_custom_directive) {
                context.engine.custom.directive = context.engine.custom.directive.match(/\/\/EXPRESSION/g) ?
                    context.engine.custom.directive.replace("//EXPRESSION", `\tlet __ = ${replaceText(converted)};\n\t/*SENTENCE*/`)
                    :
                    context.engine.custom.directive.replace("/*SENTENCE*/", `__ += ${replaceText(converted)};\n\t/*SENTENCE*/`);
                converted = "";
            } else if (context.engine.code.is_switch && converted.trim() === "") {
                converted = "";
            } else if (converted.match(/{{\*(.*?)\*}}/g) || converted.match(/{{\*\*/g) || converted.match(/\*\*}}/g)) {
                converted = replaceText(converted);
            } else {
                converted = `_.push(${replaceText(converted)})`;
            }
        }
        else {
            if (converted.match(/print\(/g)) {
                converted = replaceMatch(converted)
                    .replace(/print/g, "_.push")
                    .replace(/\(\"/g, `(\``)
                    .replace(/\"\)/g, `\n\`)`)
            } else {
                converted = replaceMatch(converted);
            }
        }
    }

    if (converted.match(scoped) && scoped.source.length > 2) {
        context.engine.regExp.scoped.slice(1, -1).split("|").forEach(
            value => {
                if (!converted.match(RegExp(`_${value}`, "g")) && !converted.match(RegExp(`@${value}`, "g"))) {
                    converted = converted.replace(RegExp(`${value}`, "g"), `scoped.${value}`)                    
                }
            }
        )
    }

    return converted;
}