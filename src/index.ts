import { parseCode, parseComponent } from "./parse.code.ts";

import { depBeautify, depMinifier } from "../dep.ts";
import { ILaraDenoTemplate, IOptionsDenoTemplate, TComponentSettings, TFunction, TModifiers, TOptionsRender, TOptionsTranspile, TReplaces, TSettings, TSettingsProcessRender, TSettingsProcessTranspile } from "./types.ts";
import { convertCode } from "./convert.code.ts";
import { attributes, classNames, escapeHTML, parseVariable, styles, transpileDirective, unescapedHTML } from "./utils.ts";

export class LaraTemplateDeno {
    private _DEFAULT_DIRECTIVES_: string = "if|elseIf|elseif|else|endIf|endif|code|endCode|endcode|for|endFor|endfor|include|switch|endSwitch|endswitch|break|case|continue|with|endWith|endwith|callFunction|callfunction|function|endFunction|endfunction|class|endClass|endclass|makeClass|makeclass|while|endWhile|endwhile|do|default|import|extend|classNames|styles|attributes"

    protected engine: ILaraDenoTemplate = {
        code: {
            is_code: false,
            is_code_anonymous: false,
            is_code_import: false,
            is_code_raw: false,
            is_if: false,
            is_else_if: false,
            is_else: false,
            is_function: false,
            is_call_function: false,
            is_class: false,
            is_make_class: false,
            is_do_while: false,
            is_while: false,
            is_for: false,
            is_switch: false,
            is_default: false,
            is_continue: false,
            is_break: false,
            is_case: false,
            is_with: false,
            is_import: false,
            is_include: false,
            is_custom_directive: false,
            is_component: false
        },
        comments: {
            code: ["// Start Code\n", "// End Code\n"],
            codeRaw: ["// Start Code Raw\n", "// End Code Raw\n"],
            codeImport: ["// Start Code Import\n", "// End Code Import\n"],
            codeAnonymous: ["// Start Code Anonymous\n", "// End Code Anonymous\n"],
            eval: ["/*! START EVAL !*/\n", "/*! END EVAL !*/\n"],
            preload: ["/*! START PRELOAD CODE !*/\n", "/*! END PRELOAD CODE !*/\n"],
            directives: ["/*! START PRELOAD DIRECTIVES !*/\n", "/*! END PRELOAD DIRECTIVES !*/\n"]
        },
        regExp: {
            init: /@code(\s*\((.*?)\);|)|@endCode|@with\s*\((.*?)\);|@endWith|@switch\s*\((.*?)\);|@endSwitch|@case\s*\((.*?)\);|@if\s*\((.*?)\);|@elseIf\s*\((.*?)\);|@else|@endIf|@for\s*\((.*?)\);|@endFor|@while\s*\((.*?)\);|@endWhile(\s*\((.*?)\);|)|@do|@continue(\s*\((.*?)\);|)|@break(\s*\((.*?)\);|)|@default|@callFunction\s*\((.*?)\);|@function\s*\((.*?)\);|@endFunction|@makeClass\s*\((.*?)\);|@class\s*\((.*?)\);|@endClass|@include\s*\((.*?)\);|@extend\s*\((.*?)\);|@import\s*\((.*?)\);|@data\s*\((.*?)\);|@shared\s*\((.*?)\);|@classNames\s*\(([\s\S]*?)\)\s*;|@styles\s*\(([\s\S]*?)\)\s*;|@attributes\s*\(([\s\S]*?)\)\s*;/,
            expressions: /{{([\s\S]*?)[^}]}}|{{!([\s\S]*?)[^}]!}}|{>([\s\S]*?)[^}]<}|{<([\s\S]*?)[^}]>}|{\*(.*?)[^}]\*}/,
            component: /<%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%>|<%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%\/>|<\/%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%>/,
            compile: /<\?deno\s*[^?>]\?>/,
            scoped: "()",
            directives: "()"
        },
        custom: {
            directive: "",
            sentenceFor: "",
            component: "",
            params: [],
            anonymous: 0,
            componentContent: ""
        },
        modifiers: {
            include: {
                base: null,
                processing: null
            },
            code: {
                base: null,
                processing: null
            },
            import: {
                base: null,
                processing: null
            }
        },
        preloadCode: "",
        preloadDirectives: "",
        settings: {
            comments: true,
            escapeHTML: false,
            ignoredEmptyExpressions: false,
        }
    }
    
    protected components: Record<string, TComponentSettings> = {};
    protected directives: Record<string, any> = {};
    protected scoped: Record<string, any> = {};
    protected shared: Record<string, any> = {};
    protected functions: Record<string, TFunction> = {};

    protected formatters: Record<string, (text: string) => string> = {
        "html": (text: string) => depBeautify.html(text),
        "css": (text: string) => depBeautify.css(text),
        "js": (text: string) => depBeautify.js(text),
    };

    protected minimizers: Record<string, (text: string) => string> = {
        "html": (text: string) => depMinifier.html.minify(text, {
            removeComments: true,
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true
        }),
        "css": (text: string) => new depMinifier.ccs({}).minify(text),
        "js": (text: string) => depMinifier.js.minify(text)
    }

    /**
     * This is the LaraTemplateDeno class that handles all the rendering, compiling and transpiling of templates and components.
     * @param settings The configuration that the template compiler will have when rendering
     * 
     * @example <caption>An example to method formatter</caption>
     * const templateDeno = new LaraTemplateDeno({
     *      escapeHTML: true,
     *      ignoredEmptyExpressions: true,
     *      comments: false
     * });
     */
    constructor(settings?: TSettings) {
        this.engine.settings = {
            ...this.engine.settings,
            ...settings
        };

        this.functions["@_ESCAPE_HTML"] = escapeHTML;
        this.functions["@_UNESCAPE_HTML"] = unescapedHTML;
        this.functions["@_CLASS_NAMES"] = classNames;
        this.functions["@_STYLES"] = styles;
        this.functions["@_ATTRIBUTES"] = attributes;
        this.functions["@_TRANSPILE_DIRECTIVE"] = transpileDirective;
    }

    /**
     * This function is in charge of formatting the text in the format that 
     * @param { string } text The text to format
     * @param { string } type The type of formatter to be used for text formatting
     * @returns { string } Returns the formatted text
     * 
     * @example <caption>An example to method formatter</caption>
     * const templateDeno = new LaraTemplateDeno();
     * 
     * const result = templateDeno.render({
     *      text: "..."
     *      data: {...}
     * });
     * 
     * const format = templateDeno.formatter(result, "html");
     * 
     * console.log(format);
     */
    public formatter (text: string, type: "html" | "css" | "js"): string {
        return this.formatters[type](text);
    }

    /**
     * This function is in charge of minifying the text in the format it was passed 
     * @param { string } text The text to be minify
     * @param { string } type The type of format in which the text is to be minified
     * @returns { string } Returns the minified text
     * 
     * @example <caption>An example to method minify</caption>
     * const templateDeno = new LaraTemplateDeno();
     * 
     * const result = templateDeno.render({
     *      text: "..."
     *      data: {...}
     * });
     * 
     * const mini = templateDeno.minify(result, "html");
     * 
     * console.log(mini);
     */
    public minify (text: string, type: "html" | "css" | "js"): string {
        return this.minimizers[type](text);
    }

    protected async processRender(settings: TSettingsProcessRender, options?: IOptionsDenoTemplate): Promise<any> {
        try {
            const inputs = {
                "text": async (): Promise<string> => await parseCode(settings.options.entry, settings.options.data, settings.options.typescript, this),
                "file": async (): Promise<string> => await parseCode((await Deno.readTextFile(settings.options.entry)), settings.options.data, settings.options.typescript, this)
            }

            const outputs = {
                "text": (text: string): string => text,
                "file": async (text: string): Promise<boolean> => {
                    if (!settings.extra.path) settings.extra.path = Deno.cwd() + "\\" + settings.extra.name;
                    else settings.extra.params = settings.extra.path + "\\" + settings.extra.name;
        
                    await Deno.writeTextFile(settings.extra.path, text);

                    return true;
                },
                "response": (text: string): Response => new Response(text, { headers: settings.extra.headers })
            }

            let result: string = await inputs[settings.input]();

            if (options?.format) result = this.formatter(result, options.format);
            if (options?.minify) result = this.minify(result, options.minify);

            this.shared = {};

            return await outputs[settings.output](result);
        } catch (error) {
            console.error(error);

            return error;
        }
    }

    protected async processTranspile(settings: TSettingsProcessTranspile): Promise<any> {
        try {
            const inputs = {
                "text": async () => await convertCode(settings.options.entry, this, {
                    export: settings.options.export,
                    strict: settings.options.strict,
                    evaluate: settings.options.evaluate,
                    typeCheck: settings.options.typeCheck,
                }),
                "file": async () => await convertCode((await Deno.readTextFile(settings.options.entry)), this, {
                    export: settings.options.export,
                    strict: settings.options.strict,
                    evaluate: settings.options.evaluate,
                    typeCheck: settings.options.typeCheck,
                })
            }

            const outputs = {
                "text": (text: string) => text,
                "file": async (text: string) => {
                    if (!settings.extra.path) settings.extra.path = Deno.cwd() + "\\" + settings.extra.name;
                    else settings.extra.params = settings.extra.path + "\\" + settings.extra.name;
        
                    await Deno.writeTextFile(settings.extra.path, text);

                    return true;
                },
                "response": (text: string) => new Response(text, { headers: settings.extra.headers })
            }

            this.shared = {};

            return await outputs[settings.output]((await inputs[settings.input]()));
        } catch (error) {
            console.error(error);

            return error;
        }
    }

    /**
     * This function is responsible for rendering components
     * @param { string } text The text to render as component
     * @param { any } data The data to render in the component
     * @returns { Promise<string> } Returns the rendered component
     * 
     * @example <caption>An example to method component</caption>
     * const templateDeno = new LaraTemplateDeno();
     * 
     * const result = templateDeno.component("...", { ... });
     * 
     * console.log(result);
     */
    public async component(text: string, data: any): Promise<string> {
        return await parseComponent(text, data, this);
    }

    /**
     * This function is responsible for rendering templates
     * @param { Omit<TOptionsRender, "file" | "path" | "name" | "headers"> } options The configuration that the render will have from the text to be rendered, the data to be interpreted in the rendering, typescript support, etc.
     * @returns { Promise<string> }
     * 
     * @example <caption>An example to method render</caption>
     * const templateDeno = new LaraTemplateDeno();
     * 
     * const result = templateDeno.render({
     *      text: "..."
     *      data: {...}
     * });
     * 
     * console.log(result);
     */
    public async render(options: Omit<TOptionsRender, "file" | "path" | "name" | "headers">): Promise<string> {
        options = { ...{ data: {}, text: "", options: {}, typescript: false }, ...options }

        return await this.processRender({
            input: "text",
            output: "text",
            options: {
                entry: options.text,
                data: options.data,
                typescript: options.typescript
            }
        }, options.options);
    }

    public async renderToFile(options: Omit<TOptionsRender, "file" | "headers">): Promise<boolean> {
        options = { ...{ data: {}, text: "", path: "", name: "index.html", options: {}, typescript: false }, ...options }

        return await this.processRender({
            input: "text",
            output: "file",
            options: {
                entry: options.text,
                data: options.data,
                typescript: options.typescript
            },
            extra: {
                path: options.path,
                name: options.name
            }
        }, options.options);
    }

    public async renderToResponse(options: Omit<TOptionsRender, "file" | "path" | "name">): Promise<Response> {
        options = { ...{ data: {}, text: "", headers: { "Content-Type": "text/html" }, options: {}, typescript: false }, ...options }
        
        return await this.processRender({
            input: "text",
            output: "response",
            options: {
                entry: options.text,
                data: options.data,
                typescript: options.typescript
            },
            extra: {
                headers: options.headers
            }
        }, options.options);
    }

    public async renderFile(options: Omit<TOptionsRender, "text" | "path" | "name" | "headers">): Promise<string> {
        options = { ...{ data: {}, file: "", options: {}, typescript: false }, ...options }

        return await this.processRender({
            input: "file",
            output: "text",
            options: {
                entry: options.file,
                data: options.data,
                typescript: options.typescript
            }
        }, options.options);
    }

    public async renderFileToFile(options: Omit<TOptionsRender, "text" | "headers">): Promise<boolean> {
        options = { ...{ data: {}, file: "", path: "", name: "index.html", options: {}, typescript: false }, ...options }

        return await this.processRender({
            input: "file",
            output: "file",
            options: {
                entry: options.file,
                data: options.data,
                typescript: options.typescript
            },
            extra: {
                path: options.path,
                name: options.name
            }
        }, options.options);
    }

    public async renderFileToResponse(options: Omit<TOptionsRender, "text" | "path" | "name">): Promise<Response> {
        options = { ...{ data: {}, file: "", headers: { "Content-Type": "text/html" }, options: {}, typescript: false }, ...options }

        return await this.processRender({
            input: "file",
            output: "response",
            options: {
                entry: options.file,
                data: options.data,
                typescript: options.typescript
            },
            extra: {
                headers: options.headers
            }
        }, options.options);
    }

    public async transpile(options: Omit<TOptionsTranspile, "file" | "path" | "name" | "headers">): Promise<string> {
        options = { ...{ text: "", evaluate: true, export: false, strict: false, typeCheck: false }, ...options }

        return await this.processTranspile({
            input: "text",
            output: "text",
            options: {
                entry: options.text,
                typeCheck: options.typeCheck,
                evaluate: options.evaluate,
                export: options.export,
                strict: options.strict
            }
        });
    }

    public async transpileToFile(options: Omit<TOptionsTranspile, "file" | "headers">): Promise<boolean> {
        options = { ...{ text: "", evaluate: true, export: false, strict: false, typeCheck: false, path: "", name: "index.js" }, ...options }

        return await this.processTranspile({
            input: "text",
            output: "file",
            options: {
                entry: options.text,
                typeCheck: options.typeCheck,
                evaluate: options.evaluate,
                export: options.export,
                strict: options.strict
            },
            extra: {
                path: options.path,
                name: options.name
            }
        });
    }

    public async transpileToResponse(options: Omit<TOptionsTranspile, "file" | "path" | "name">): Promise<Response> {
        options = { ...{ text: "", evaluate: true, export: false, strict: false, typeCheck: false, headers: { "Content-Type": "application/javascript" } }, ...options }

        return await this.processTranspile({
            input: "text",
            output: "response",
            options: {
                entry: options.text,
                typeCheck: options.typeCheck,
                evaluate: options.evaluate,
                export: options.export,
                strict: options.strict
            },
            extra: {
                headers: options.headers
            }
        });
    }

    public async transpileFile(options: Omit<TOptionsTranspile, "text" | "path" | "name" | "headers">): Promise<string> {
        options = { ...{ file: "", evaluate: true, export: false, strict: false, typeCheck: false }, ...options }

        return await this.processTranspile({
            input: "file",
            output: "text",
            options: {
                entry: options.file,
                typeCheck: options.typeCheck,
                evaluate: options.evaluate,
                export: options.export,
                strict: options.strict
            }
        });
    }

    public async transpileFileToFile(options: Omit<TOptionsTranspile, "text" | "headers">): Promise<boolean> {
        options = { ...{ file: "", evaluate: true, export: false, strict: false, typeCheck: false, path: "", name: "index.js" }, ...options }

        return await this.processTranspile({
            input: "file",
            output: "file",
            options: {
                entry: options.file,
                typeCheck: options.typeCheck,
                evaluate: options.evaluate,
                export: options.export,
                strict: options.strict
            },
            extra: {
                path: options.path,
                name: options.name
            }
        });
    }

    public async transpileFileToResponse(options: Omit<TOptionsTranspile, "text" | "path" | "name">): Promise<Response> {
        options = { ...{ file: "", evaluate: true, export: false, strict: false, typeCheck: false, headers: { "Content-Type": "application/javascript" } }, ...options }

        return await this.processTranspile({
            input: "file",
            output: "response",
            options: {
                entry: options.file,
                typeCheck: options.typeCheck,
                evaluate: options.evaluate,
                export: options.export,
                strict: options.strict
            },
            extra: {
                headers: options.headers
            }
        });
    }

    public share(object: Record<string, any>): void {
        this.shared = object;
    }

    public setModifiers<T extends "include" | "code" | "import">(type: T): TModifiers[T] {
        return this.engine.modifiers[type]
    }

    public setSettings(settings: TSettings): void {
        this.engine.settings = {
            ...this.engine.settings,
            ...settings
        };
    }

    public addFunctionToTranspile(name: string, func: TFunction): void {
        name = name.trim();
        name = name.replace(/(-| )/g, "_").toUpperCase();
        name = name.startsWith("_") ? name : `_${name}`;

        if (typeof func !== "function") throw new Error(`is not a function "${func}" type ${typeof func}`);

        this.functions[`@${name}`] = func;
    }

    public addCustomRegExp(regExp: string | RegExp): void {
        regExp = regExp instanceof RegExp ? regExp.source : regExp;

        this.engine.regExp.init = new RegExp(`${this.engine.regExp.init}|${regExp}`);
    }

    public beforeTranspile(callback: (part: string, replacer: TReplaces) => string): void {
        this.engine.custom.beforeTranspile = callback;
    }

    public afterTranspile(callback: (part: string, replacer: TReplaces) => string): void {
        this.engine.custom.afterTranspile = callback;
    }

    public preloadCode(data: string | Record<string, any>): void {
        if (typeof data === "object") {
            for (const key in data) {
                if (data?.hasOwnProperty(key)) {
                    this.engine.preloadCode += `const ${key} = ${parseVariable(data[key])};\n`;
                }
            }
        } else {
            this.engine.preloadCode += data;
        }
    }

    public preloadAdvancedDirectives(): void {
        for (const directive in this.directives) {
            if (this.engine.regExp.directives.includes(`@end${directive}`)) {
                let func = this.directives[directive].toString()
                    .replace(/function\s*(.*?)+\)/g,"(EXPRESSION) =>")
                    .replace(/\/\/\s*EXPRESSION/g, `const evaluate = functions["@_TRANSPILE_DIRECTIVE"](EXPRESSION);\n_.push(evaluate);`);
                func = `const $_directive_${directive} = ${func};\n`;
                this.engine.preloadDirectives += func;
            }
        }
    }

    public registerComponent(name: string, component: any, props: string[]): void {
        this.components[name] = {
            abstract: component,
            props
        };
    }

    public registerDirective(name: string, type: "basic" | "advanced" | "const", abstract: any, forced = false): void {
        if (this._DEFAULT_DIRECTIVES_.includes(name)) throw new Deno.errors.NotSupported(`You cannot register this '${name}' directive in the engine. This directive already exists in the directive base template engine.`)

        if (this.hasDirective(name) && !forced) throw new Deno.errors.InvalidData(`You cannot register this '${name}' directive in the engine because it already exists.`);

        this.directives[name] = abstract;

        const directive = {
            "const": `@${name}`,
            "basic":`@${name}\((.*?)\);`,
            "advanced": `@${name}(\((.*?)\);|)|@end${name}`
        }

        if (this.engine.regExp.directives.length === 2) {
            this.engine.regExp.directives = this.engine.regExp.directives.slice(0,-1);
            this.engine.regExp.directives += `${directive[type]}` + ")";
        } else {
            this.engine.regExp.directives = this.engine.regExp.directives.slice(0,-1);
            this.engine.regExp.directives += "|" + `${directive[type]}` + ")";
        }
    }

    public hasDirective(name: string): boolean {
        return !!this.directives[name];
    }

    
    public setDirective(name: string, abstract: any): void {
        if (!this.hasDirective(name))
            throw new Deno.errors.NotFound(`this directive '${name}' cannot be edited because it does not exist in the engine directives`)

        this.directives[name] = abstract;
    }

    public deleteDirective(name: string): boolean {
        if (!this.hasDirective(name))
            return false;

        delete this.directives[name];

        return true;
    }
    
    public registerScoped(name: string, abstract: any, forced = false): void {
        if (this._DEFAULT_DIRECTIVES_.includes(name)) throw new Deno.errors.NotSupported(`You cannot register this '${name}' scoped in the engine. This function or property may affect the engine interpreter.`)

        if (this.hasScoped(name) && !forced) throw new Deno.errors.InvalidData(`You cannot register this '${name}' scoped in the engine because it already exists.`);

        this.scoped[name] = abstract;

        if (this.engine.regExp.scoped.length === 2) {
            this.engine.regExp.scoped = this.engine.regExp.scoped.slice(0,-1);
            this.engine.regExp.scoped += name + ")";
        } else {
            this.engine.regExp.scoped = this.engine.regExp.scoped.slice(0,-1);
            this.engine.regExp.scoped += "|" + name + ")";
        }
    }

    public hasScoped(name: string): boolean {
        return !!this.scoped[name];
    }

    public setScope(name: string, abstract: any): void {
        if (!this.hasScoped(name))
            throw new Deno.errors.NotFound(`this scoped '${name}' cannot be edited because it does not exist in the engine scoped`)

        this.scoped[name] = abstract;
    }

    public deleteScoped(name: string): boolean {
        if (!this.hasScoped(name))
            return false;

        delete this.scoped[name];

        return true;
    }
}