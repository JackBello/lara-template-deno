// deno-lint-ignore-file no-explicit-any no-unused-vars
import "https://deno.land/std@0.180.0/dotenv/load.ts";
import { LaraTemplateDeno } from "../src/index.ts";
import { empty, isset } from "../src/helpers.ts";
import { LaraTemplateComponent } from "../src/component.code.ts";
import { Card } from "./components/Card.component.ts";

/* examples of deno template */
const examples = [
    "./examples/templates/basic.deno",
    "./examples/templates/code.deno",
    "./examples/templates/cycles.deno",
    "./examples/templates/conditionals.deno",
    "./examples/templates/with.deno",
    "./examples/templates/functions.deno",
    "./examples/templates/class.deno",
    "./examples/templates/import.deno",
    "./examples/templates/includes.deno",
    "./examples/templates/custom_directives.deno",
    "./examples/templates/error.deno",
    "./examples/templates/inline.deno",
    "./examples/templates/typescript.deno",
    "./examples/templates/components.deno",
    "./examples/templates/all.deno"
];

/* initialize lara deno template */
const templateDeno = new LaraTemplateDeno({
    escapeHTML: true,
    ignoredEmptyExpressions: true,
    comments: true
});

// Data passed to render
/**
 * properties not valid init with @, $, #
 */
const data = {
    information: "this is a information in data",
    "%hidden": "this is hidden",
    languages: ['js','html','css'],
    type: "error",
    title: "Home",
    heading: 'Alosaur',
    items: ["js","css","html"]
}

// Temporal data passed to render
const shared = {
    description: "this is a description in shared"
}

// you can preload code using this
/**
 * denoTemplate.preloadCode("const { empty, isset, varDump } = await import('./helpers.ts')")
 */
// or this
templateDeno.preloadCode({
    empty,
    isset
})

/* Register directives */

// Directive const
templateDeno.registerDirective("PI", "const", 3.1416);

// Directive basic
templateDeno.registerDirective("test", "basic", () => "hello world")

templateDeno.registerDirective("table", "basic", (size: string) => {
    const [cols, rows] = size.split("x");

    let result = "<table>\n";
    for (let row = 1; row <= Number(rows); row++) {
        let tr = "<tr>\n"

        for (let col = 1; col <= Number(cols); col++) {
            const th = "<th>" + col + "</th>"

            tr += th;
        }

        tr += "</tr>\n"

        result = result + tr;
    }

    result = result + "</table>"

    return result;
})

templateDeno.registerDirective("list", "basic", (elements: any[]) => {
    let result = "<nav>\n"

    for(const element of elements) {
        result += `\t<a href="${element.path}">${element.name}</a>\n`
    }

    result = result + "</nav>"

    return result;
});

// Directive Advanced
templateDeno.registerDirective("auth", "advanced", (EXPRESSION: any) => {
    const isAuth = true;

    if (isAuth) {
        // EXPRESSION
    }
})

templateDeno.registerDirective("env", "advanced", (key: string, EXPRESSION: any) => {
    if (Deno.env.has(key)) {
        // EXPRESSION
    }
});

templateDeno.registerDirective("production", "advanced", (EXPRESSION: any) => {
    if (Deno.env.get("DENO_ENVIRONMENT") === "production") {
        // EXPRESSION
    }
});

templateDeno.registerDirective("development", "advanced", (EXPRESSION: any) => {
    if (Deno.env.get("DENO_ENVIRONMENT") === "development") {
        // EXPRESSION
    }
});

templateDeno.registerDirective("isset", "advanced", (accessor: any, EXPRESSION: any) => {
    if (isset(accessor)) {
        // EXPRESSION
    }
});

templateDeno.registerDirective("empty", "advanced", (accessor: any, EXPRESSION: any) => {
    if (empty(accessor)) {
        // EXPRESSION
    }
});

templateDeno.registerDirective("unless", "advanced", (accessor: any, EXPRESSION: any) => {
    if (!accessor) {
        // EXPRESSION
    }
});

templateDeno.registerDirective("each", "advanced", (elements: any, EXPRESSION: string) => {
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        // EXPRESSION
    }
});

/* Register scoped */
templateDeno.registerScoped("add", (number1: number, number2: number) => number1 + number2);

templateDeno.registerScoped("pi", 3.1416);

/* Share temporal data */
templateDeno.share(shared);

/* Processing path after to include file into template */
templateDeno.setModifiers("include").processing = (path: string) => {
    path = path.startsWith("./") ? path.slice(1,) : path;
    path = path.replace(/\./g, "/");
    path = path + ".deno";
    return path;
}

/* Preload advanced directives */
templateDeno.preloadAdvancedDirectives();

/* Add custom regexp */
templateDeno.addCustomRegExp(/print\s*\(([\s\S]*?)\)\s*;/);

/* after transpile */
templateDeno.afterTranspile((part, { replaceMatchCode }) => {
    if (part.match(/print\s*\(([\s\S]*?)\)\s*;/g)) {
        return replaceMatchCode(part).replace("print(","_.push(`${").slice(0,-2)+"}\\n`)"
    }

    return part;
});

templateDeno.registerComponent("Card", Card, ["title", "body", "languages", "type"]);

LaraTemplateComponent.renderTemplate = templateDeno;

const file = examples[Deno.args[0] ? parseInt(Deno.args[0].replace("--file=","")) : 0];

// <%SayHello name="jack"%/>

/* result of each compilation */

const result = await templateDeno.renderFile({
    file,
    data,
    // typescript: true
});

/* print result */
console.log(file);
console.log(result);