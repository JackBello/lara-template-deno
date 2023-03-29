// deno-lint-ignore-file no-explicit-any
type TFunction = (...params:any) => string;

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
    }
    regExp: {
        init: string;
        matches: string;
        component: string;
        scoped: string;
        directives: string;
    }
    custom: {
        directive: string;
        sentenceFor: string;
        params: string | string[];
    }
    modifiers: TModifiers;
    preload: string;
}

export type TModifiers = {
    include: {
        base: string | null,
        processing: TFunction | null
    }
    code: {
        base: string | null,
        processing: TFunction | null
    },
    import: {
        base: string | null,
        processing: TFunction | null
    }
}

export interface ILaraDenoContext {
    engine: ILaraDenoTemplate
    directives: any;
    scoped: any;
    shared: any;
}

export interface IOptionsDenoTemplate {
    format?: "html" | "css" | "js"
    minify?: "html" | "css" | "js"
}