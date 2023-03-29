// deno-lint-ignore-file no-explicit-any
import { parseCode } from "./parse.code.ts";

import { depBeautify, depMinifier } from "../dependencies.ts";
import { ILaraDenoTemplate, IOptionsDenoTemplate, TModifiers } from "./types.ts";
import { convertCode } from "./convert.code.ts";
import { parseVariable } from "./utils.ts";

export class LaraDenoTemplate {
    private _DEFAULT_: IOptionsDenoTemplate = {
        format: undefined,
        minify: undefined
    }

    private _DEFAULT_DIRECTIVES_ = "if|elseif|else|endif|code|endcode|for|endfor|include|switch|endswitch|break|case|continue|with|callfunction|function|endfunction|class|endclass|makeclass|while|endwhile|dowhile|enddowhile|default|import"

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
            is_custom_directive: false
        },
        regExp: {
            init: "(@code(\\((.*?)+\\)|)|@endcode|@with\\((.*?)+\\)|@endwith|@switch\\((.*?)+\\)|@endswitch|@case\\((.*?)+\\)|@if\\((.*?)+\\)|@elseif\\((.*?)+\\)|@else|@endif|@callfunction\\((.*?)+\\)|@function\\((.*?)+\\)|@endfunction|@class\\((.*?)+\\)|@endclass|@makeclass\\((.*?)+\\)|@for\\((.*?)+\\)|@endfor|@while\\((.*?)+\\)|@endwhile|@dowhile|@enddowhile\\((.*?)+\\)|@continue(\\((.*?)+\\)|)|@break(\\((.*?)+\\)|)|@default|@include\\((.*?)+\\)|@import\\((.*?)+\\))",
            matches: "({{(.*?)+}}|{{\\*(.*?)+\\*}}|{{\\*\\*((.*?\n)+|(.*?)+)\\*\\*}}|{{>(.*?)+<}}|{{<(.*?)+>}})",
            component: "(<%[a-z-A-Z-_]+%>(.*?(\n|))+<\/%[a-z-A-Z-_]+%>|<%[a-z-A-Z-_]+%\/>)",
            scoped: "()",
            directives: "()"
        },
        custom: {
            directive: "",
            sentenceFor: "",
            params: []
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
        preload: ""
    }
    
    protected directives: any = {}
    protected scoped: any = {};
    protected shared: any = {};

    protected formatters: any = {
        "html": (text: string) => depBeautify.html(text),
        "css": (text: string) => depBeautify.css(text),
        "js": (text: string) => depBeautify.js(text),
    };

    protected minimizers: any = {
        "html": (text: string) => depMinifier.html.minify(text, {
            removeComments: true,
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true
        }),
        "css": (text: string) => new depMinifier.ccs({}).minify(text),
        "js": (text: string) => depMinifier.js.minify(text)
    }

    public formatter (text: string, type: string) {
        return this.formatters[type](text);
    }

    public minify (text: string, type: string) {
        return this.minimizers[type](text);
    }

    public async compileFile(file: string, data = {}, path = "", name = "index.html", options?: IOptionsDenoTemplate) {
        try {
            options = {...this._DEFAULT_, ...options};

            const text = await Deno.readTextFile(file);

            let result = await parseCode(text, data, this);

            if (options.format) result = this.formatter(result, options.format);

            if (options.minify) result = this.minify(result, options.minify);

            if (path) path = Deno.cwd() + "\\" + name;
            else path = path + "\\" + name;

            await Deno.writeTextFile(path, result);
    
            this.shared = {};
    
            return true;
        } catch (error) {
            console.error(error);
        }
    }

    public async compile(text: string, data = {}, path = "", name = "index.html", options?: IOptionsDenoTemplate) {
        try {
            options = {...this._DEFAULT_, ...options};

            let result = await parseCode(text, data, this);

            if (options.format) result = this.formatter(result, options.format);

            if (options.minify) result = this.minify(result, options.minify);

            if (!path) path = Deno.cwd() + "\\" + name;
            else path = path + "\\" + name;

            await Deno.writeTextFile(path, result);
    
            this.shared = {};
    
            return true;
        } catch (error) {
            console.log(error);
        }
    }
    
    public async renderFile(file: string, data = {}, options?: IOptionsDenoTemplate) {
        try {
            options = {...this._DEFAULT_, ...options};

            const text = await Deno.readTextFile(file);

            let result = await parseCode(text, data, this);

            if (options.format) result = this.formatter(result, options.format);

            if (options.minify) result = this.minify(result, options.minify);

            this.shared = {};
    
            return result;
        } catch (error) {
            console.error(error);
        }
    }

    public async render(text: string, data = {}, options?: IOptionsDenoTemplate) {
        try {
            options = {...this._DEFAULT_, ...options};

            let result = await parseCode(text, data, this)

            if (options.format) result = this.formatter(result, options.format);

            if (options.minify) result = this.minify(result, options.minify);

            this.shared = {};
            
            return result;
        } catch (error) {
            console.error(error);
        }
    }

    public async renderFileToResponse(file: string, data = {}, contentType = "text/html", options?: IOptionsDenoTemplate) {
        try {
            options = {...this._DEFAULT_, ...options};

            const text = await Deno.readTextFile(file);

            let result = await parseCode(text, data, this);

            if (options.format) result = this.formatter(result, options.format);

            if (options.minify) result = this.minify(result, options.minify);

            this.shared = {};
    
            return new Response(result, {
                headers: {
                    "Content-Type": contentType
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    public async renderToResponse(text: string, data = {}, contentType = "text/html", options?: IOptionsDenoTemplate) {
        try {
            options = {...this._DEFAULT_, ...options};

            let result = await parseCode(text, data, this)

            if (options.format) result = this.formatter(result, options.format);

            if (options.minify) result = this.minify(result, options.minify);

            this.shared = {};
            
            return new Response(result, {
                headers: {
                    "Content-Type": contentType
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    public async transpile(text: string) {
        try {
            const result = await convertCode(text, this)

            this.shared = {};
            
            return result;
        } catch (error) {
            console.error(error);
        }
    }

    public async transpileToFile(text: string, path = "", name = "index.js") {
        try {
            const result = await convertCode(text, this)

            if (!path) path = Deno.cwd() + "\\" + name;
            else path = path + "\\" + name;

            await Deno.writeTextFile(path, result);

            this.shared = {};

            return true;
        } catch (error) {
            console.error(error);
        }
    }

    public async transpileFile(file: string) {
        try {
            const text = await Deno.readTextFile(file);

            const result = await convertCode(text, this);

            this.shared = {};
    
            return result;
        } catch (error) {
            console.error(error);
        }
    }

    public async transpileFileToFile(file: string, path = "", name = "index.js") {
        try {
            const text = await Deno.readTextFile(file);
            
            const result = await convertCode(text, this)

            if (!path) path = Deno.cwd() + "\\" + name;
            else path = path + "\\" + name;

            await Deno.writeTextFile(path, result);

            this.shared = {};

            return true;
        } catch (error) {
            console.error(error);
        }
    }

    public share(object: any): void {
        this.shared = object;
    }

    public setModifiers<T extends "include" | "code">(type: T): TModifiers[T] {
        return this.engine.modifiers[type]
    }

    public preloadCode(data: any) {
        this.engine.preload = "/*!START PRELOAD CODE!*/\n";

        if (typeof data === "object") {
            for (const key in data) {
                if (data?.hasOwnProperty(key)) {
                    this.engine.preload += `const ${key} = ${parseVariable(data[key])};\n`;
                }
            }
        } else {
            this.engine.preload += data;
        }

        this.engine.preload += "/*!END PRELOAD CODE!*/\n";
    }

    public registerDirective(name: string, type: "basic" | "advanced", action: any) {
        try {
            if (this._DEFAULT_DIRECTIVES_.includes(name)) throw new Error(`You cannot register this '${name}' directive in the engine. This directive already exists in the directive base template engine.`)

            if (this.hasDirective(name)) throw new Error(`You cannot register this '${name}' directive in the engine because it already exists.`);

            this.directives[name] = action;

            if (this.engine.regExp.directives.length === 2) {
                this.engine.regExp.directives = this.engine.regExp.directives.slice(0,-1);
                this.engine.regExp.directives += `${ type === "advanced" ? `@${name}(\((.*?)+\)|)` : `@\\.${name}(\((.*?)+\)|)`}${ type === "advanced" ? `|@end${name}` : ''}` + ")";
            } else {
                if (this.engine.regExp.directives.includes("|")) {
                    this.engine.regExp.directives = this.engine.regExp.directives.slice(0,-1);
                    this.engine.regExp.directives += "|" + `${ type === "advanced" ? `@${name}(\((.*?)+\)|)` : `@\\.${name}(\((.*?)+\)|)`}${ type === "advanced" ? `|@end${name}` : ''}` + ")";
                } else {
                    this.engine.regExp.directives = this.engine.regExp.directives.slice(0,-1);
                    this.engine.regExp.directives += "|" + `${ type === "advanced" ? `@${name}(\((.*?)+\)|)` : `@\\.${name}(\((.*?)+\)|)`}${ type === "advanced" ? `|@end${name}` : ''}` + ")";
                }
            }
        } catch (exception) {
            console.error(exception);
        }
    }

    public hasDirective(name: string) {
        return !!this.directives[name];
    }

    
    public setDirective(name: string, value: any) {
        if (!this.hasDirective(name))
            throw new Error(`this directive '${name}' cannot be edited because it does not exist in the engine directives`)

        this.directives[name] = value;
    }

    public deleteDirective(name: string) {
        if (!this.hasDirective(name))
            return false;

        delete this.directives[name];

        return true;
    }
    
    public registerScoped(name: string, value: any) {
        try {
            if (this._DEFAULT_DIRECTIVES_.includes(name)) throw new Error(`You cannot register this '${name}' scoped in the engine. This function or property may affect the engine interpreter.`)

            if (this.hasScoped(name)) throw new Error(`You cannot register this '${name}' scoped in the engine because it already exists.`);

            this.scoped[name] = value;

            if (this.engine.regExp.scoped.length === 2) {
                this.engine.regExp.scoped = this.engine.regExp.scoped.slice(0,-1);
                this.engine.regExp.scoped += name + ")";
            } else {
                if (this.engine.regExp.scoped.includes("|")) {
                    this.engine.regExp.scoped = this.engine.regExp.scoped.slice(0,-1);
                    this.engine.regExp.scoped += "|" + name + ")";
                } else {
                    this.engine.regExp.scoped = this.engine.regExp.scoped.slice(0,-1);
                    this.engine.regExp.scoped += "|" + name + ")";
                }
            }
        } catch (exception) {
            console.error(exception);
        }
    }

    public hasScoped(name: string) {
        return !!this.scoped[name];
    }

    public setScope(name: string, value: any) {
        if (!this.hasScoped(name))
            throw new Error(`this scoped '${name}' cannot be edited because it does not exist in the engine scoped`)

        this.scoped[name] = value;
    }

    public deleteScoped(name: string) {
        if (!this.hasScoped(name))
            return false;

        delete this.scoped[name];

        return true;
    }
}