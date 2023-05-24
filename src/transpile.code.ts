import { convertCode } from "./convert.code.ts";
import { ILaraDenoContext } from "./types.ts";
import { includeCode, includeFile, includeImport } from "./utils.ts";

const replaceMatch = (part: string): string => !part.match(/(\$\((.*?)\)\$|\#\((.*?)\)\#)/g) ?
        part
            .replace(/\$/g, "data.")
            .replace(/\#/g, "shared.")
        :
        part
            .replace(/\$\(/g, "data[\"")
            .replace(/\)\$/g, "\"]")
            .replace(/\#\(/g, "shared[\"")
            .replace(/\)\#/g, "\"]")

const replaceMatchCode = (part: string): string => part
        .replace(/\$\(/g, "data[\"")
        .replace(/\)\$/g, "\"]")
        .replace(/\#\(/g, "shared[\"")
        .replace(/\)\#/g, "\"]")

const replaceMatchComponent = (part: string): string => part
        .replace(/\$\(/g, "${data[\"")
        .replace(/\)\$/g, "\"]}")
        .replace(/\#\(/g, "${shared[\"")
        .replace(/\)\#/g, "\"]}")

const replaceText = (part: string, context: ILaraDenoContext): string => {
    if (part.match(/{\*(.*?)\*}/g)) {
        part = part
            .replace(/\{\*/g, "/*")
            .replace(/\*\}/g, "*/");

        return part;
    } else if (part.match(/{{!(.*?)!}}/g)) {        
        part = part.match(/({{!\s*\$(.*?)\s*!}}|{{!\s*\#(.*?)\s*!}})/g) ? replaceMatch(part) : part;

        if (!context.engine.settings.ignoredEmptyExpressions && part.replace(/\{\{/g, "").replace(/\}\}/g, "").trim().length) {
            part = part
                .replace(/\{\{\!/g, "${")
                .replace(/\!\}\}/g, "}");
        } else {
            part = part.replace(/\{\{\!/g, "").replace(/\!\}\}/g, "").trim()
        }

        return part ? `\`${part}\`` : "";
    } else if (part.match(/{{(.*?)}}/g)) {
        part = part.match(/({{\s*\$(.*?)\s*}}|{{\s*\#(.*?)\s*}})/g) ? replaceMatch(part) : part;

        if (context.engine.settings.ignoredEmptyExpressions && !part.replace(/\{\{/g, "").replace(/\}\}/g, "").trim().length) {
            part = part.replace(/\{\{/g, "").replace(/\}\}/g, "").trim()
        } else if (context.engine.settings.ignoredEmptyExpressions && part.replace(/\{\{/g, "").replace(/\}\}/g, "").trim().length) {
            part = context.engine.settings?.escapeHTML ?
                part.replace(/\{\{/g, `\${functions["@_ESCAPE_HTML"](`).replace(/\}\}/g,")}")
                :
                part.replace(/\{\{/g, "\${").replace(/\}\}/g,"}")
        } else {
            part = context.engine.settings?.escapeHTML ?
                part.replace(/\{\{/g, `\${functions["@_ESCAPE_HTML"](`).replace(/\}\}/g,")}")
                :
                part.replace(/\{\{/g, "\${").replace(/\}\}/g,"}")
        }

        return part ? `\`${part}\`` : "";
    } else if (part.match(/{>(.*?)<}/g)) {
        part = part.match(/({>\s*\$(.*?)\s*<}|{>\s*\#(.*?)\s*<})/g) ? replaceMatch(part) : part;

        if (!context.engine.settings.ignoredEmptyExpressions && part.replace(/\{\{/g, "").replace(/\}\}/g, "").trim().length) {
            part = part.replace(/\{\>/g, `\${functions["@_ESCAPE_HTML"](`).replace(/\<\}/g, ")}");
        } else {
            part = part.replace(/\{\>/g, "").replace(/\<\}/g, "").trim();
        }

        return part ? `\`${part}\`` : "";
    } else if (part.match(/{<(.*?)>}/g)) {
        part = part.match(/({<\s*\$(.*?)\s*>}|{<\s*\#(.*?)\s*>})/g) ? replaceMatch(part) : part;

        if (!context.engine.settings.ignoredEmptyExpressions && part.replace(/\{\{/g, "").replace(/\}\}/g, "").trim().length) {
            part = part.replace(/\{\</g, `\${functions["@_UNESCAPE_HTML"](`).replace(/\>\}/g, ")}");
        } else {
            part = part.replace(/\{\</g, "").replace(/\>\}/g, "").trim();
        }

        return part ? `\`${part}\`` : "";
    } else {
        return `\`${part.replace(/\`/g, "\\`")}\``
    }
};

export const transpileDirectiveCode = (text: string, context: ILaraDenoContext): string => {
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

export const transpileCode = async (part: string, context: ILaraDenoContext): Promise<string> => {
    let converted = part;
    let path, text, parts, rawCode, rawParams, makeClass, mainParams, secondaryParams, attributes: any, params: string;

    const init = RegExp(context.engine.regExp.init, "gim");
    const scoped = RegExp(context.engine.regExp.scoped, "gim");
    const directives = RegExp(context.engine.regExp.directives, "gim");

    if (context.engine.custom.beforeTranspile) {
        converted = context.engine.custom.beforeTranspile(converted, {
            replaceMatch,
            replaceMatchCode
        });
    }
    
    if (converted.match(init)) {
        if (converted.match(/@classNames/g)) {
            converted = converted.replace(/@classNames/g, `_.push(\`\$\{functions["@_CLASS_NAMES"]`).slice(0,-1)+`\}\`);`;
        }

        if (converted.match(/@styles/g)) {
            converted = converted.replace(/@styles/g, `_.push(\`\$\{functions["@_STYLES"]`).slice(0,-1)+`\}\`);`;
        }

        if (converted.match(/@attributes/g)) {
            converted = converted.replace(/@attributes/g, `_.push(\`\$\{functions["@_ATTRIBUTES"]`).slice(0,-1)+`\}\`);`;
        }

        if (converted.match(/@data/g)) {
            text = converted.replace(/@data/g, "").trim();
            text = text.slice(2,-3);
            converted = converted.replace(/@data\((.*?)\);/g, `_.push(\`\$\{data["${text}"]\}\`);`);
        }

        if (converted.match(/@shared/g)) {
            text = converted.replace(/@shared/g, "").trim();
            text = text.slice(2,-3);
            converted = converted.replace(/@shared\((.*?)\);/g, `_.push(\`\$\{shared["${text}"]\}\`);`);
        }

        if (converted.match(/@import/g)) {
            text = converted.replace(/@import/g, "").trim();
            text.match(",") ?
                parts = text.split(",")
                :
                parts = text;

            if (typeof parts === "string") {
                parts = includeImport(parts.slice(2).replace(/(\"|\')\)(;|)/g, ""), context);
                converted = converted.replace(/@import\((.*?)\);/g, `await import("${parts}")`)
            }
            else if (typeof parts === "object") {
                parts[1] = includeImport(parts[1].trim().slice(1).replace(/(\"|\')\)(;|)/g, ""), context);
                converted = converted.replace(/@import\((.*?)\);/g, `const ${parts[0].slice(1)} = await import("${parts[1]}")`)
            }
        }

        if (converted.match(/@code/g)) {
            rawCode = converted.replace(/@code/g,"");

            rawCode.match(/(\("anonymous"\);|\('anonymous'\);)/g) ?
                context.engine.code.is_code_anonymous = true : null;

            rawCode.match(/(\(\"(.*?)\"\);|\(\'(.*?)\'\);)/g) && !rawCode.match(/(\("anonymous"\);|\('anonymous'\);)/g) ?
                context.engine.code.is_code_import = true : null;

            (rawCode.startsWith("(") && rawCode.endsWith(");")) && (!rawCode.slice(1,-1).startsWith(`"`) && !rawCode.slice(1,-1).endsWith(`"`)) ?
                context.engine.code.is_code_raw = true : null;

            if (context.engine.code.is_code_import) {
                path = converted.replace(/@code/g, "").trim();
                path = path.slice(2,-3);
                text = await includeCode(path, context);
                converted = `${context.engine.settings.comments ? context.engine.comments.codeImport[0] : '\n'}` + converted.replace(/@code\((.*?)\);/g, transpileDirectiveCode(text, context)) + `${context.engine.settings.comments ? "\n" + context.engine.comments.codeImport[1] : '\n'}`;

                context.engine.code.is_code_import = false;
            } else if (context.engine.code.is_code_raw) {
                converted = replaceMatch(converted)
                    .replace(/@code/g, `${context.engine.settings.comments ? context.engine.comments.codeRaw[0] : '\n'}`)
                    .replace(/(\(|\);)/g, "\n" + `${context.engine.settings.comments ? context.engine.comments.codeRaw[1] : '\n'}`);
                
                context.engine.code.is_code_raw = false;
            } else {
                context.engine.code.is_code = true;

                if (context.engine.code.is_code_anonymous) {
                    converted = converted.replace(/(@code\("anonymous"\);|@code\('anonymous'\);)/g, `${context.engine.settings.comments ? context.engine.comments.codeAnonymous[0] : "\n"}const %REPLACE% = (() => {`)
                    converted = converted.replace("%REPLACE%", `\$${context.engine.custom.anonymous}`);
                } else {
                    converted = converted.replace(/@code/g, `${context.engine.settings.comments ? context.engine.comments.code[0] : "\n"}`);
                }
            
                if (context.engine.code.is_code_anonymous) {
                    context.engine.custom.anonymous++;
                }
            }
        }

        if (converted.match(/@endCode/g)) {
            converted =  context.engine.code.is_code_anonymous ? 
                converted.replace(/@endCode/g, `})();\n${context.engine.settings.comments ? context.engine.comments.codeAnonymous[1] : "\n"}`)
                :
                converted.replace(/@endCode/g, `\n${context.engine.settings.comments ? context.engine.comments.code[1] : "\n"}`)

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
            converted = converted.match(/@continue\((.*?)\);/g) ?
                converted.replace(/@continue/g, "if").slice(0, -1) + " continue;\n"
                :
                converted.replace(/@continue/g, "continue;")
            context.engine.code.is_continue = false;
        }

        if (converted.match(/@break/g)) {
            context.engine.code.is_break = true;            
            converted = converted.match(/@break\((.*?)\);/g) ?
                converted.replace(/@break/g, "if").slice(0, -1) + " break;\n"
                :
                converted.replace(/@break/g, "break;")
            if (context.engine.code.is_case) context.engine.code.is_case = false;
            if (context.engine.code.is_default) context.engine.code.is_default = false;
            context.engine.code.is_break = false;
        }

        if (converted.match(/@with/g)) {
            context.engine.code.is_with = true;
            converted = replaceMatch(converted)
                .replace(/@with/g, "with")
                .slice(0, -1) + " {"
        }

        if (converted.match(/@endWith/g)) {
            context.engine.code.is_with = false;
            converted = converted.replace(/@endWith/g, "}");
        }

        if (converted.match(/@for/g)) {
            context.engine.code.is_for = true;
            context.engine.custom.sentenceFor = replaceMatch(converted)
                .replace(/@for/g, "")
                .replace(/(\(|\)|;)/g, "")
            context.engine.custom.sentenceFor = context.engine.custom.sentenceFor.match(/ (in|of) /g) ?
                context.engine.custom.sentenceFor.replace(/(const|let) [a-zA-Z_$,{}\[\]]+ (of|in) /g, "")
                :
                "";

            converted = replaceMatch(converted)
                .replace(/@for/g, "for")
                .slice(0, -1) + " {"

            if (context.engine.custom.sentenceFor !== "") {
                converted = `_loop.first = ${context.engine.custom.sentenceFor}.at(0);\n` +
                            `_loop.last = ${context.engine.custom.sentenceFor}.at(-1);\n` +
                            `_loop.quantity = ${context.engine.custom.sentenceFor}.length;\n` +
                            `_loop.remaining = ${context.engine.custom.sentenceFor}.length;\n` +
                            `${converted}`;
            }
        }

        if (converted.match(/@endFor/g)) {
            context.engine.code.is_for = false;
            converted = converted.replace(/@endFor/g, "}");

            if (context.engine.custom.sentenceFor !== "") {
                converted = `_loop.index++;\n` +
                            `_loop.iteration++;\n` +
                            `_loop.remaining--;\n` +
                            `${converted}`
            }

            context.engine.custom.sentenceFor = "";
        }

        if (converted.match(/@do/g)) {
            context.engine.code.is_do_while = true;
            converted = converted
                .replace(/@do/g, "do {")
        }


        if (converted.match(/@while/g)) {
            context.engine.code.is_while = true;
            converted = replaceMatch(converted)
                .replace(/@while/g, "while")
                .slice(0, -1) + " {"
        }

        if (converted.match(/@endWhile/g)) {
            if (converted.match(/@endWhile\((.*?)\);/g)) {
                context.engine.code.is_do_while = false;
                converted = replaceMatch(converted).replace(/@endWhile/g, "} while").slice(0, -1) + "\n"
            } else {
                context.engine.code.is_while = false;
                converted = converted.replace(/@endWhile/g, "}");
            }
        }

        if (converted.match(/@if/g)) {
            context.engine.code.is_if = true;
            converted = replaceMatch(converted)
                .replace(/@if/g, "if")
                .slice(0, -1) + " {"
        }

        if (converted.match(/@elseIf/g)) {
            context.engine.code.is_else_if = true;
            converted = replaceMatch(converted)
                .replace(/@elseIf/g, "} else if")
                .slice(0, -1) + " {"
        }

        if (converted.match(/@else/g)) {
            context.engine.code.is_else = true;
            converted = converted.replace(/@else/g, "} else {");
        }

        if (converted.match(/@endIf/g)) {
            if (context.engine.code.is_if || context.engine.code.is_else_if || context.engine.code.is_else) {
                context.engine.code.is_if = false;
                context.engine.code.is_else_if = false;
                context.engine.code.is_else = false;
            }
            converted = converted.replace(/@endIf/g, "}");
        }

        if (converted.match(/@switch/g)) {
            context.engine.code.is_switch = true;
            converted = replaceMatch(converted)
                .replace(/@switch/g, "switch")
                .slice(0, -1) + " {"
        }

        if (converted.match(/@case/g)) {
            context.engine.code.is_case = true;
            converted = replaceMatch(converted)
                .replace(/@case/g, "case ")
                .replace("(", "")
                .replace(");", ":")
        }

        if (converted.match(/@endSwitch/g)) {
            context.engine.code.is_switch = false;
            converted = converted.replace(/@endSwitch/g, "}");
            if (context.engine.code.is_default) context.engine.code.is_default = false;
        }

        if (converted.match(/@function/)) {
            context.engine.code.is_function = true;
            converted = converted
                .replace(/@function/g, "function ")
                .replace(/\(/g, "_")
                .replace(",", "(")
                .replace(/(\"|\")/g, "")
                .replace(/\);/g, ") {");
        }

        if (converted.match(/@endFunction/)) {
            context.engine.code.is_function = false;
            converted = converted.replace(/@endFunction/g, "}");
        }

        if (converted.match(/@callFunction/g)) {
            context.engine.code.is_call_function = true;
            converted = replaceMatch(converted)
                .replace(/@callFunction/g, "")
                .replace(/\(/g, "_")
                .replace(/(\"|\")/g, "")
                .replace(",", "(")
                .slice(0,-1);
            converted = `_.push(${converted})`;
            context.engine.code.is_call_function = false;
        }

        if (converted.match(/@class/g)) {
            context.engine.code.is_class = true;
            converted = converted
                .replace(/@class/g, "class ")
                .replace(/\(/g, "_")
                .replace(/(\"|\")/g, "")
                .replace(/\);/g, " {");
        }

        if (converted.match(/@endClass/g)) {
            context.engine.code.is_class = false;
            converted = converted.replace(/@endClass/g, "}");
        }

        if (converted.match(/@makeClass/g)) {
            context.engine.code.is_make_class = true;
            makeClass = replaceMatch(converted)
                .replace(/@makeClass/g, "")
                .replace(/(\(|\);)/g,"")
                .split(",")
                .map(c => c.trim())[1];

            converted = replaceMatch(converted)
                .replace(/@makeClass/g, "const ")
                .replace(/\(/g, "")
                .replace(",", " = new")
                .replace(",", "(")
                .replace(");", ");")
                .replace(makeClass, "_"+makeClass);
            context.engine.code.is_make_class = false;
        }
    } else if (converted.match(directives) && directives.source.length > 2) {
        text = converted.replace(/(@|\((.*?)\);)/g, "").trim();
        text = text.startsWith("end") ? text.slice(3) : text;

        if (context.engine.regExp.directives.includes(`@end${text}`)) {
            if (converted.match(/@end[a-z]+/g)) {
                context.engine.code.is_custom_directive = false;

                mainParams = context.engine.custom.params[0].join(",");
                secondaryParams = context.engine.custom.params[1].join("+");

                rawParams = mainParams.length ?
                    `${mainParams}, ${secondaryParams}`
                    :
                    secondaryParams

                converted = converted.replace(/@end[a-z]+/g, `$_directive_${context.engine.custom.directive}(${rawParams})`)

                context.engine.custom.directive = "";
                context.engine.custom.params = [];
            } else if (converted.match(/@/g)) {
                context.engine.code.is_custom_directive = true;
                context.engine.custom.params.push([], []);

                context.engine.custom.directive = converted.replace(/(@|\((.*?)\);)/g, "").trim();
                context.engine.custom.params[0] = converted.replace(/@[a-zA-Z]+/g,'').trim().slice(1,-2).split(",");

                converted = converted.replace(/@[a-z]+/g, "").replace(/\((.*?)\)/g,"");
            }
        } else {
            converted = converted.match(/@[a-zA-Z]+\((.*?)\);/g) ? converted.slice(0, -1) : converted;
            converted = `_.push(\`\$\{${converted.replace(/\@/g, 'directives.')}\}\`)`;
        }
    } else {
        if (!context.engine.code.is_code && !context.engine.code.is_function && !context.engine.code.is_class) {
            if (context.engine.code.is_custom_directive) {
                context.engine.custom.params[1].push(replaceText(converted, context))
                converted = "";
            } else if (context.engine.code.is_switch && converted.trim() === "") {
                converted = "";
            } else {
                if (converted.match(/{\*(.*?)\*}/g)) {
                    converted = `${replaceText(converted, context)}`;
                } else {
                    if (converted.match(/(<%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%>|<%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%\/>|<\/%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%>)/g)) {
                        if (converted.match(/<%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%\/>/g)) {
                            context.engine.code.is_component = true;

                            text = converted
                                .replace(/(\:|)[\w-]+="[^"]*"/g,"")
                                .replace(/\s/g,"")
                                .replace(/(<\/%|<%|%\/>|%>)/g,"")
                                .trim();
                            
                            console.log(context.engine.custom.component);
                            
                            context.engine.code.is_component = false;
                        } else {
                            if (converted.match(/<%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%>/g)) {
                                context.engine.code.is_component = true;
                                
                                text = converted
                                    .replace(/(\:|)[\w-]+="[^"]*"/g,"")
                                    .replace(/\s/g,"")
                                    .replace(/(<%|%\/>|%>)/g,"")
                                    .trim();

                                context.engine.custom.component = context.engine.custom.component === "" ?
                                    text
                                    :
                                    context.engine.custom.component !== text ?
                                        context.engine.custom.component
                                        :
                                        text;

                                context.engine.custom.componentContent += converted;
                                converted = "";
                            } else if (converted.match(/<\/%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%>/g)) {
                                text = converted
                                    .replace(/(\:|)[\w-]+="[^"]*"/g,"")
                                    .replace(/\s/g,"")
                                    .replace(/(<\/%|<%|%\/>|%>)/g,"")
                                    .trim();

                                context.engine.code.is_component = text === context.engine.custom.component ? false : true;

                                if (context.engine.custom.component === text) {
                                    parts = replaceMatchComponent(context.engine.custom.componentContent + converted)
                                    attributes = (context.engine.custom.componentContent + converted).replace((context.engine.custom.componentContent + converted).replace(/(<%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%>|<%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%\/>|<\/%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%>)/g, ""), "").replace(/<\/%[a-zA-Z-]+%>/g, "").match(/(\:|)[\w-]+="[^"]*"/g) ?? [];

                                    attributes = attributes.map((keyValue: any) => {
                                        keyValue = keyValue.split("=");

                                        keyValue[1] = keyValue[1].slice(1,-1);

                                        return keyValue
                                    });

                                    params = "{";
                                    attributes.forEach(([key, value]: any) => {
                                        if (key.startsWith(":")) params += `"${key}": ${replaceMatch(value)},`;
                                        else params += `"${key}": "${value}",`;
                                    });
                                    params += "}";

                                    converted = `const \$${text} = new components["${text}"].abstract(\`${part}\`)\n\$${text}.load(${params}, components["${text}"].props)\n_.push(await \$${text}.render())`;

                                    text = "";
                                    params = "";
                                    attributes = [];
                                    context.engine.custom.component = "";
                                    context.engine.custom.componentContent = "";
                                }
                            }
                        }
                    } else {
                        if (context.engine.code.is_component) {
                            context.engine.custom.componentContent += converted;
                            converted = "";
                        } else {
                            converted = `_.push(${replaceText(converted, context)})`;
                            converted = converted === "_.push()" ? "" : converted
                        }
                    }
                }
            }
        } else {
            converted = replaceMatchCode(converted);
        }
    }

    if (converted.match(scoped) && scoped.source.length > 2) {
        context.engine.regExp.scoped.slice(1, -1).split("|").forEach(
            value => {
                if (!converted.match(RegExp(`_${value}`, "g")) && !converted.match(RegExp(`@${value}`, "g")) && !converted.match(RegExp(`scoped["${value}"]`, "g")) && !converted.match(RegExp(`scoped.${value}`, "g"))) {
                    converted = converted.replace(RegExp(`${value}`, "g"), `scoped["${value}"]`)                    
                }
            }
        )
    }

    if (converted.match(/@include/g)) {
        path = converted.replace(/@include/g, "").trim();
        path = path.slice(2,-3);
        text = await includeFile(path, context);
        converted = converted.replace(/@include\((.*?)\);/g, await convertCode(text, context, {
            evaluate: false,
            export: false,
            strict: false,
            typeCheck: false
        }));
    }

    if (context.engine.custom.afterTranspile) {
        converted = context.engine.custom.afterTranspile(converted, {
            replaceMatch,
            replaceMatchCode
        });
    }

    // console.log(converted);

    return converted;
}

export const transpileComponent = async (part: string, context: ILaraDenoContext): Promise<string> => {
    let converted = part;
    let path, text, rawCode;

    const init = RegExp("(@code(\\s*\\((.*?)\\);|)|@endCode|@if\\s*\\((.*?)\\);|@elseIf\\s*\\((.*?)\\);|@else|@endIf|@for\\s*\\((.*?)\\);|@endFor|@continue(\\s*\\((.*?)\\);|)|@break(\\s*\\((.*?)\\);|)|@classNames\\s*\\(([\\s\\S]*?)\\)\\s*;|@styles\\s*\\(([\\s\\S]*?)\\)\\s*;|@attributes\\s*\\(([\\s\\S]*?)\\)\\s*;)", "gim");

    if (converted.match(init)) {
        if (converted.match(/@classNames/g)) {
            converted = converted.replace(/@classNames/g, `_.push(\`\$\{functions["@_CLASS_NAMES"]`).slice(0,-1)+`\}\`);`;
        }

        if (converted.match(/@styles/g)) {
            converted = converted.replace(/@styles/g, `_.push(\`\$\{functions["@_STYLES"]`).slice(0,-1)+`\}\`);`;
        }

        if (converted.match(/@attributes/g)) {
            converted = converted.replace(/@attributes/g, `_.push(\`\$\{functions["@_ATTRIBUTES"]`).slice(0,-1)+`\}\`);`;
        }

        if (converted.match(/@continue/g)) {
            context.engine.code.is_continue = true;
            converted = converted.match(/@continue\((.*?)\);/g) ?
                converted.replace(/@continue/g, "if").slice(0, -1) + " continue;\n"
                :
                converted.replace(/@continue/g, "continue;")
            context.engine.code.is_continue = false;
        }

        if (converted.match(/@break/g)) {
            context.engine.code.is_break = true;            
            converted = converted.match(/@break\((.*?)\);/g) ?
                converted.replace(/@break/g, "if").slice(0, -1) + " break;\n"
                :
                converted.replace(/@break/g, "break;")
            if (context.engine.code.is_case) context.engine.code.is_case = false;
            if (context.engine.code.is_default) context.engine.code.is_default = false;
            context.engine.code.is_break = false;
        }

        if (converted.match(/@code/g)) {
            rawCode = converted.replace(/@code/g,"");

            rawCode.match(/(\("anonymous"\);|\('anonymous'\);)/g) ?
                context.engine.code.is_code_anonymous = true : null;

            rawCode.match(/(\(\"(.*?)\"\);|\(\'(.*?)\'\);)/g) && !rawCode.match(/(\("anonymous"\);|\('anonymous'\);)/g) ?
                context.engine.code.is_code_import = true : null;

            (rawCode.startsWith("(") && rawCode.endsWith(");")) && (!rawCode.slice(1,-1).startsWith(`"`) && !rawCode.slice(1,-1).endsWith(`"`)) ?
                context.engine.code.is_code_raw = true : null;

            if (context.engine.code.is_code_import) {
                path = converted.replace(/@code/g, "").trim();
                path = path.slice(2,-3);
                text = await includeCode(path, context);
                converted = `${context.engine.settings.comments ? context.engine.comments.codeImport[0] : '\n'}` + converted.replace(/@code\((.*?)\);/g, transpileDirectiveCode(text, context)) + `${context.engine.settings.comments ? "\n" + context.engine.comments.codeImport[1] : '\n'}`;

                context.engine.code.is_code_import = false;
            } else if (context.engine.code.is_code_raw) {
                converted = replaceMatch(converted)
                    .replace(/@code/g, `${context.engine.settings.comments ? context.engine.comments.codeRaw[0] : '\n'}`)
                    .replace(/(\(|\);)/g, "\n" + `${context.engine.settings.comments ? context.engine.comments.codeRaw[1] : '\n'}`);
                
                context.engine.code.is_code_raw = false;
            } else {
                context.engine.code.is_code = true;

                if (context.engine.code.is_code_anonymous) {
                    converted = converted.replace(/(@code\("anonymous"\);|@code\('anonymous'\);)/g, `${context.engine.settings.comments ? context.engine.comments.codeAnonymous[0] : "\n"}const %REPLACE% = (() => {`)
                    converted = converted.replace("%REPLACE%", `\$${context.engine.custom.anonymous}`);
                } else {
                    converted = converted.replace(/@code/g, `${context.engine.settings.comments ? context.engine.comments.code[0] : "\n"}`);
                }
            
                if (context.engine.code.is_code_anonymous) {
                    context.engine.custom.anonymous++;
                }
            }
        }

        if (converted.match(/@endCode/g)) {
            converted =  context.engine.code.is_code_anonymous ? 
                converted.replace(/@endCode/g, `})();\n${context.engine.settings.comments ? context.engine.comments.codeAnonymous[1] : "\n"}`)
                :
                converted.replace(/@endCode/g, `\n${context.engine.settings.comments ? context.engine.comments.code[1] : "\n"}`)

            context.engine.code.is_code = false;
            context.engine.code.is_code_anonymous = false;
        }

        if (converted.match(/@if/g)) {
            context.engine.code.is_if = true;
            converted = replaceMatch(converted)
                .replace(/@if/g, "if")
                .slice(0, -1) + " {"
        }

        if (converted.match(/@elseIf/g)) {
            context.engine.code.is_else_if = true;
            converted = replaceMatch(converted)
                .replace(/@elseIf/g, "} else if")
                .slice(0, -1) + " {"
        }

        if (converted.match(/@else/g)) {
            context.engine.code.is_else = true;
            converted = converted.replace(/@else/g, "} else {");
        }

        if (converted.match(/@endIf/g)) {
            if (context.engine.code.is_if || context.engine.code.is_else_if || context.engine.code.is_else) {
                context.engine.code.is_if = false;
                context.engine.code.is_else_if = false;
                context.engine.code.is_else = false;
            }
            converted = converted.replace(/@endIf/g, "}");
        }

        if (converted.match(/@for/g)) {
            context.engine.code.is_for = true;
            context.engine.custom.sentenceFor = replaceMatch(converted)
                .replace(/@for/g, "")
                .replace(/(\(|\)|;)/g, "")
            context.engine.custom.sentenceFor = context.engine.custom.sentenceFor.match(/ (in|of) /g) ?
                context.engine.custom.sentenceFor.replace(/(const|let) [a-zA-Z_$,{}\[\]]+ (of|in) /g, "")
                :
                "";

            converted = replaceMatch(converted)
                .replace(/@for/g, "for")
                .slice(0, -1) + " {"

            if (context.engine.custom.sentenceFor !== "") {
                converted = `_loop.first = ${context.engine.custom.sentenceFor}.at(0);\n` +
                            `_loop.last = ${context.engine.custom.sentenceFor}.at(-1);\n` +
                            `_loop.quantity = ${context.engine.custom.sentenceFor}.length;\n` +
                            `_loop.remaining = ${context.engine.custom.sentenceFor}.length;\n` +
                            `${converted}`;
            }
        }

        if (converted.match(/@endFor/g)) {
            context.engine.code.is_for = false;
            converted = converted.replace(/@endFor/g, "}");

            if (context.engine.custom.sentenceFor !== "") {
                converted = `_loop.index++;\n` +
                            `_loop.iteration++;\n` +
                            `_loop.remaining--;\n` +
                            `${converted}`
            }

            context.engine.custom.sentenceFor = "";
        }
    } else {
        if (!context.engine.code.is_code && !context.engine.code.is_function && !context.engine.code.is_class) {
            if (converted.match(/{\*(.*?)\*}/g)) {
                converted = `${replaceText(converted, context)}`;
            } else {
                converted = `_.push(${replaceText(converted, context)})`;
                converted = converted === "_.push()" ? "" : converted
            }
        } else {
            converted = replaceMatchCode(converted);
        }
    }

    // console.log(converted);

    return converted;
}