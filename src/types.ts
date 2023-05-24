import { LaraTemplateComponent } from "./component.code.ts";

type TFunctionProcessing = (...params:any) => string;
export type TFunction = (...params:any) => any;

export interface ILaraDenoTemplate {
    code: {
        is_code: boolean;
        is_code_anonymous: boolean;
        is_code_import: boolean;
        is_code_raw: boolean;
        is_if: boolean;
        is_else_if: boolean;
        is_else: boolean;
        is_function: boolean;
        is_call_function: boolean;
        is_class: boolean;
        is_make_class: boolean;
        is_do_while: boolean;
        is_while: boolean;
        is_for: boolean;
        is_switch: boolean;
        is_default: boolean;
        is_continue: boolean;
        is_break: boolean;
        is_case: boolean;
        is_with: boolean;
        is_import: boolean;
        is_include: boolean;
        is_custom_directive: boolean;
        is_component: boolean;
    }
    comments: {
        code: string[];
        codeRaw: string[];
        codeImport: string[];
        codeAnonymous: string[];
        eval: string[];
        directives: string[];
        preload: string[];
    },
    regExp: {
        init: RegExp;
        expressions: RegExp;
        component: RegExp;
        compile: RegExp;
        scoped: string;
        directives: string;
    }
    custom: {
        directive: string;
        sentenceFor: string;
        component: string;
        params: any[];
        anonymous: number;
        componentContent: string;
        beforeTranspile?: (part: string, replacer: TReplaces) => string;
        afterTranspile?: (part: string, replacer: TReplaces) => string;
    }
    modifiers: TModifiers;
    preloadCode: string;
    preloadDirectives: string;
    settings: TSettings;
}

export type TReplaces = {
    replaceMatchCode: (part: string) => string;
    replaceMatch: (part: string) => string;
}

export type TSettings = {
    escapeHTML?: boolean;
    comments?: boolean;
    ignoredEmptyExpressions?: boolean;
}

export type TModifiers = {
    include: {
        base: string | null,
        processing: TFunctionProcessing | null
    }
    code: {
        base: string | null,
        processing: TFunctionProcessing | null
    },
    import: {
        base: string | null,
        processing: TFunctionProcessing | null
    }
}

export interface ILaraDenoContext {
    engine: ILaraDenoTemplate
    directives: Record<string, any>;
    scoped: Record<string, any>;
    shared: Record<string, any>;
    functions: Record<string, TFunction>;
    components: any;
}

export interface IOptionsDenoTemplate {
    format?: "html" | "css" | "js"
    minify?: "html" | "css" | "js"
}

export type TAttributes = Record<string, TAttributesValue>

export type TAttributesValue = {
    value: string
    active: boolean
}

export type TSettingsProcessRender = {
    input: "file" | "text";
    output: "file" | "text" | "response";
    options: {
        data: any;
        entry: string;
        typescript?: boolean;
    },
    extra?: any;
}

export type TSettingsProcessTranspile = {
    input: "file" | "text";
    output: "file" | "text" | "response";
    options: {
        entry: string;
        typeCheck: boolean;
        evaluate: boolean;
        export: boolean;
        strict: boolean;
    };
    extra?: any;
}

export type TOptionsRender = {
    text: string;
    data?: any;
    options?: IOptionsDenoTemplate;
    typescript?: boolean;
    headers: Record<string, string>;
    file: string;
    path: string;
    name: string;
}

export type TOptionsTranspile = {
    text: string;
    typeCheck: boolean;
    evaluate: boolean;
    export: boolean;
    strict: boolean;
    headers: Record<string, string>;
    file: string;
    path: string;
    name: string;
}

export type TOptionsConvertCode = {
    typeCheck: boolean;
    evaluate: boolean;
    export: boolean;
    strict: boolean;
}

export type TComponentSettings = {
    abstract: LaraTemplateComponent,
    props: string[]
}