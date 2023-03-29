// deno-lint-ignore-file no-explicit-any
import "https://deno.land/std@0.180.0/dotenv/load.ts";
import { LaraDenoTemplate } from "../src/deno_template.ts";
import { empty, isset } from "../src/helpers.ts";

// examples of deno template
const examples = [
    "./examples/basic.deno",
    "./examples/code.deno",
    "./examples/cycles.deno",
    "./examples/conditionals.deno",
    "./examples/with.deno",
    "./examples/functions.deno",
    "./examples/class.deno",
    "./examples/import.deno",
    "./examples/includes.deno",
    "./examples/custom_directives.deno"
];

// initialize lara deno template
const denoTemplate = new LaraDenoTemplate();

// Data passed to render
const data = {
    information: "this is a information in data"
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
denoTemplate.preloadCode({
    empty,
    isset
})

// Register directives
denoTemplate.registerDirective("test", "basic", () => "hello world")

denoTemplate.registerDirective("PI", "basic", 3.1416);

denoTemplate.registerDirective("table", "basic", (size: string) => {
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

denoTemplate.registerDirective("auth", "advanced", () => {
    const isAuth = false;

    if (isAuth) {
        //EXPRESSION
    }
})

denoTemplate.registerDirective("env", "advanced", (key: string) => {
    if (Deno.env.has(key)) {
        //EXPRESSION
    }
});

denoTemplate.registerDirective("production", "advanced", () => {
    if (Deno.env.get("DENO_ENVIRONMENT") === "production") {
        //EXPRESSION
    }
});

denoTemplate.registerDirective("development", "advanced", () => {
    if (Deno.env.get("DENO_ENVIRONMENT") === "development") {
        //EXPRESSION
    }
});

denoTemplate.registerDirective("isset", "advanced", (accessor: any) => {
    if (isset(accessor)) {
        //EXPRESSION
    }
});

denoTemplate.registerDirective("empty", "advanced", (accessor: any) => {
    if (empty(accessor)) {
        //EXPRESSION
    }
});

denoTemplate.registerDirective("unless", "advanced", (accessor: any) => {
    if (!accessor) {
        //EXPRESSION
    }
});

// Register scoped
denoTemplate.registerScoped("add", (number1: number, number2: number) => number1 + number2);

denoTemplate.registerScoped("pi", 3.1416);

// Share temporal data
denoTemplate.share(shared);

// Processing path after to include file into template
denoTemplate.setModifiers("include").processing = (path: string) => {
    path = path.startsWith("./") ? path.slice(1,) : path;
    path = path.replace(/\./g, "/");
    path = path + ".deno";
    return path;
}

// result of each compilation
const result = await denoTemplate.renderFile(examples[8], data);

// print result
console.log(result);
