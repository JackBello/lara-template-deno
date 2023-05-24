import { assertEquals, assertIsError } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { LaraTemplateDeno } from "../src/index.ts";

const templateDeno = new LaraTemplateDeno({
    escapeHTML: true,

    // activated only render ignored empty expression
    ignoredEmptyExpressions: false
});

templateDeno.registerScoped("add", (a: number, b: number) => a + b)

Deno.test("render data", async () => {
    assertEquals(await templateDeno.render({text: "{{ $welcome }}", data: {welcome: "Lara Template Deno"} }), "Lara Template Deno");
});

Deno.test("render undefined data", async () => {
    assertEquals(await templateDeno.render({text: "{{ $welcome }}" }), "undefined");
});

Deno.test("render empty expression", async () => {
    assertEquals(await templateDeno.render({text: "{{ }}" }), "undefined");
});

Deno.test("render ignored empty expression", async () => {
    assertEquals(await templateDeno.render({text: "{{ }}" }), "");
});

Deno.test("render functions global scoped", async () => {
    assertEquals(await templateDeno.render({text: "{{ add(1, 2) }}" }), "3");
});

Deno.test("error function sub undefined", async () => {
    assertIsError(await templateDeno.render({text: "{{ sub(1, 2) }}" }), ReferenceError);
});

Deno.test("error sentence if", async () => {
    assertIsError(await templateDeno.render({text: "@if(); {{ 'enter' }} @endIf" }), SyntaxError);
});

Deno.test("error func undefined", async () => {
    assertIsError(await templateDeno.render({text: "{{ null.func() }}" }), TypeError);
});

Deno.test("error decodeURI", async () => {
    assertIsError(await templateDeno.render({text: "{{ decodeURIComponent('%') }}" }), URIError);
});
