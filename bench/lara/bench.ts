import { LaraTemplateDeno } from "../../src/index.ts";

const templateDeno = new LaraTemplateDeno({
    escapeHTML: true
});

Deno.bench(async function render() {
    await templateDeno.renderFile({
        file: "./bench/lara/index.deno",
        data: {
            title: "Home",
            heading: 'Alosaur',
            items: ["js","css","html"]
        }
    });
});