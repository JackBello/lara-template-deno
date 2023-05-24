import { Handlebars } from "https://deno.land/x/handlebars@v0.10.0/mod.ts";

const handle = new Handlebars();

Deno.bench(async function render() {
    await handle.render(
        './bench/handlebars/index.hbs',
        {
            title: "Home",
            heading: 'Alosaur',
            items: ["js","css","html"]
        }
    );
});