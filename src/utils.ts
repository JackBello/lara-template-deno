// deno-lint-ignore-file no-explicit-any
import { depEscapeText } from "../dependencies.ts";
import { ILaraDenoContext } from "./types.ts";

export const escapeHTML = (text: string) => {
    return depEscapeText.escapeHtml(text);
}

export const unescapedHTML = (text: string) => {
    return depEscapeText.unescapeHtml(text);
}

export const parseVariable = (variable: any) => {
    if (typeof variable === "string") {
        return `"${variable}"`;
    } else if (typeof variable === "number") {
        return variable;
    } else if (typeof variable === "boolean") {
        return variable;
    } else if (typeof variable === "object") {
        return JSON.stringify(variable);
    } else if (typeof variable === "function") {
        return `${variable}`;
    } else {
        return variable;
    }
}

export const includeCode = async (path: string, context: ILaraDenoContext) => {
    let base, processing;

    if (typeof context.engine.modifiers.code.processing === "function") {
        processing = context.engine.modifiers.code.processing;
        path = processing(path);
    }

    if (context.engine.modifiers.code.base) {
        base = context.engine.modifiers.code.base.endsWith("/") ? context.engine.modifiers.code.base.slice(0,-1) : context.engine.modifiers.code.base;
        path = path.startsWith("/") ? path : "/" + path;
        path = `${base}${path}`
    }

    return await Deno.readTextFile(path);
}

export const includeFile = async (path: string, context: ILaraDenoContext) => {
    let base, processing;

    if (typeof context.engine.modifiers.include.processing === "function") {
        processing = context.engine.modifiers.include.processing;
        path = processing(path);
    }

    if (context.engine.modifiers.include.base) {
        base = context.engine.modifiers.include.base.endsWith("/") ? context.engine.modifiers.include.base.slice(0,-1) : context.engine.modifiers.include.base;
        path = path.startsWith("/") ? path : "/" + path;
        path = `${base}${path}`
    }
    
    return await Deno.readTextFile(path);
}