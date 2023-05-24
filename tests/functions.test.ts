import { assertThrows } from "https://deno.land/std@0.188.0/testing/asserts.ts";
import { LaraTemplateDeno } from "../src/index.ts";

const templateDeno = new LaraTemplateDeno();

templateDeno.registerScoped("add", (a: number, b: number) => a + b)

Deno.test("invalid scoped duplicate", () => {
    assertThrows(() => {
        templateDeno.registerScoped("add", (a: number, b: number) => a + b)
    }, Deno.errors.InvalidData, `You cannot register this 'add' scoped in the engine because it already exists.`);
})

Deno.test("scoped not support", () => {
    assertThrows(() => {
        templateDeno.registerScoped("code", (a: number, b: number) => a + b)
    }, Deno.errors.NotSupported, `You cannot register this 'code' scoped in the engine. This function or property may affect the engine interpreter.`);
})

Deno.test("scoped not found", () => {
    assertThrows(() => {
        templateDeno.setScope("sub", (a: number, b: number) => a - b)
    }, Deno.errors.NotFound, `this scoped 'sub' cannot be edited because it does not exist in the engine scoped`);
})
