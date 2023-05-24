import { depEscapeText } from "../dep.ts";
import { ILaraDenoContext, TAttributes } from "./types.ts";

const convertTextToJson = (value: any) => {
    try {
        return JSON.parse(value);
    } catch (error) {
        error;

        return value;
    }
}

export const classNames = (classes: Record<string, boolean>): string => {
    let classAttribute = `class="%REPLACE%"`;

    for (const className in classes) {
        if (classes[className]) {
            classAttribute = classAttribute.replace("%REPLACE%", `${className} %REPLACE%`)
        }
    }

    return classAttribute.replace(" %REPLACE%", "");
}

export const styles = (styles: Record<string, boolean>): string => {
    let stylesAttribute = `styles="%REPLACE%"`;

    for (const style in styles) {
        if (styles[style]) {
            stylesAttribute = stylesAttribute.replace("%REPLACE%", `${style.replace(";","")}; %REPLACE%`)
        }
    }

    return stylesAttribute.replace(" %REPLACE%", "");
}

export const attributes = (attributes: TAttributes): string => {
    let tagsAttribute = ``;

    for (const attribute in attributes) {
        if (attributes[attribute]?.active) {
            tagsAttribute += `${attribute}="${attributes[attribute].value}" `
        }
    }

    return tagsAttribute.slice(0, -1);
}

export const escapeHTML = (text: string): string => {
    return depEscapeText.escapeHtml(text);
}

export const unescapedHTML = (text: string): string => {
    return depEscapeText.unescapeHtml(text);
}

export const transpileDirective = (part: string): string => {
    console.log(part, 1);
    return part;
}

export const formatterVariable = (value: any): any => {
    if ((value.startsWith("[") && value.endsWith("]")))
        return eval(value);
    if ((value.startsWith("{") && value.endsWith("}")))
        return convertTextToJson(value)
    if (value === "undefined")
        return undefined;
    if (value === "null")
        return null;
    if (value === "true" || value === "false")
        return Boolean(value);
    if (isNaN(Number(value)))
        return String(value);
    
    return Number(value);
}

export const parseVariable = (variable: any): string => {
    if (typeof variable === "string") {
        return `"${variable}"`;
    } else if (typeof variable === "number") {
        return `${variable}`;
    } else if (typeof variable === "boolean") {
        return `${variable}`;
    } else if (typeof variable === "object") {
        return JSON.stringify(variable);
    } else if (typeof variable === "function") {
        return `${variable}`;
    } else {
        return variable;
    }
}

export const includeCode = async (path: string, context: ILaraDenoContext): Promise<string> => {
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

export const includeFile = async (path: string, context: ILaraDenoContext): Promise<string> => {
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

export const includeImport = (path: string, context: ILaraDenoContext): string => {
    let base, processing;

    if (typeof context.engine.modifiers.import.processing === "function") {
        processing = context.engine.modifiers.import.processing;
        path = processing(path);
    }

    if (context.engine.modifiers.import.base) {
        base = context.engine.modifiers.import.base.endsWith("/") ? context.engine.modifiers.import.base.slice(0,-1) : context.engine.modifiers.import.base;
        path = path.startsWith("/") ? path : "/" + path;
        path = `${base}${path}`
    }

    return path
}