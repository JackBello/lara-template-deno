// @deno-types="npm:js-beautify@^1.14.7"
import beautify from "npm:js-beautify@^1.14.7";
import htmlMinifier from "npm:html-minifier@4.0.0"
import uglifyJS from "npm:uglify-js@3.17.4"
import cleanCSS from "npm:clean-css@5.3.2";
import * as escapeText from "https://deno.land/x/escape@1.4.2/mod.ts";

export const depMinifier = {
    html: htmlMinifier,
    ccs: cleanCSS,
    js: uglifyJS
}
export const depBeautify = beautify;
export const depEscapeText = escapeText;