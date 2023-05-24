<h1 align="center">
Lara Template Deno
</h1>

<p align="center">
<a href="https://deno.land/x/lara_template_deno">Lara Template Deno</a> is a template compiler inspired by the <a href="https://laravel.com/docs/10.x/blade" target="_blank">Blade Template</a> compiler of the <a href="https://laravel.com" target="_blank">Laravel Framework</a> for the <a href="https://deno.land" target="_blank">Deno</a> runtime environment.
</p>

<p align="center">
	<a href="https://github.com/JackBello/lara-template-deno/blob/master/LICENSE">
		<img src="https://img.shields.io/github/license/JackBello/lara-template-deno?style=for-the-badge&logo=github" alt="License (MIT)" />
	</a>
	<a href="#installation">
		<img src="https://img.shields.io/github/v/tag/JackBello/lara-template-deno?style=for-the-badge&logo=github" alt="Version" />
	</a>
	<a href="#">
		<img alt="GitHub stars" src="https://img.shields.io/github/stars/JackBello/lara-template-deno?style=for-the-badge&logo=github" />
	</a>
	<a href="https://github.com/JackBello/lara-template-deno/issues?q=is%3Aissue+is%3Aclosed">
		<img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed-raw/JackBello/lara-template-deno?style=for-the-badge&logo=github" />
	</a>
	<a href="https://github.com/JackBello/lara-template-deno/issues">
		<img alt="GitHub open issues" src="https://img.shields.io/github/issues-raw/JackBello/lara-template-deno?style=for-the-badge&color=red&logo=github" />
	</a>
    <a href="https://github.com/JackBello/lara-template-deno/pulls?q=is%3Aopen+is%3Apr">
        <img alt="GitHub Open Pull Request" src="https://img.shields.io/github/issues-pr-raw/JackBello/lara-template-deno?style=for-the-badge&logo=github">
    </a>
    <a href="https://github.com/JackBello/lara-template-deno/pulls?q=is%3Apr+is%3Aclosed">
        <img src="https://img.shields.io/github/issues-pr-closed-raw/JackBello/lara-template-deno?style=for-the-badge&logo=github" alt="GitHub Closed Pull Request"/>
    </a>
    <a href="https://github.com/JackBello/lara-template-deno/commits/master">
        <img src="https://img.shields.io/github/last-commit/JackBello/lara-template-deno?color=%2357d3af&style=for-the-badge&logo=github"alt="GitHub Commits"/>
    </a>
</p>

<hr>

# Features

- Render
- Transpile
- Minify
- Formatter
- Custom Directives
- Global Scoped
- Preload Code
- Http Response
- Temporal Data
- Support Typescript into templates
- Components

# Overview

What I am looking for with this tool is to facilitate the creation of templates quickly and efficiently, with the possibility for developers to add extra functionality through custom directives and adding functionality globally to the scoped.

# Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Introduction](#introduction)
- [Displaying Data](#displaying-data)
    - [Escape Html](#escape-html)
    - [Unescape Html](#unescape-html)
    - [Comments](#comments)
    - [Temporal Data](#temporal-data)
- [Examples](#examples)
- [Benchmarks](#benchmarks)
- [Testing](#testing)
- [Used By](#used-by)
- [Feedback](#feedback)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

> The following prerequisites are only necessary for the installation of Lara Template Deno

- Deno@^1.32.1

<details>
  <summary style="cursor: pointer;">Prerequisites Installation (Click to show)</summary>

- to install deno you need to follow the steps in the following link <a href="https://deno.land/manual@v1.32.1/getting_started/installation">Deno Install</a>.
</details>


## Installation

In order to use the lara template deno follow the following code as an example

you can import the library using this form

```ts
import { LaraDenoTemplate } from "https://deno.land/x/lara_template_deno/mod.ts";
```

or

```ts
import * as laraDenoTemplate from "https://deno.land/x/lara_template_deno/mod.ts";
```

## Introduction

Create in your project or folder an `index.ts` file and place the following code

```ts
// imports the class LaraTemplateDeno
import { LaraDenoTemplate } from "https://deno.land/x/lara_template_deno/mod.ts";

// initializes the class
const denoTemplate = new LaraDenoTemplate();

// creates a variable containing the text to render
const render = `<html>
    <head>
        <title>{{ $title }}</title>
    </head>
    <body>
        <h1>{{ $heading }}</h1>
        <ul>
            @for(const item of $items);
            <li>{{ item }}</li>
            @endFor
        </ul>
    </body>
</html>
`;

// pass it the variable containing the text to be rendered and an object with the properties and methods to be interpreted in the template
const result = await denoTemplate.render({
    text: render,
    data: {
        title: "Home",
        heading: 'Alosaur',
        items: ["js","css","html"]
    }
});

// prints the result
console.log(result);
```

Then you execute the following command

```bash
deno run -A index.ts
```
This is the result
```html
<html>
    <head>
        <title>Home</title>
    </head>
    <body>
        <h1>Alosaur</h1>
        <ul>
            <li>js</li>
            <li>css</li>
            <li>html</li>
        </ul>
    </body>
</html>
```
## Displaying Data
To display data in the template you only need to pass it an object with the data to be interpreted in the template.
```ts
import { LaraDenoTemplate } from "https://deno.land/x/lara_template_deno/mod.ts";

const denoTemplate = new LaraDenoTemplate();

const result = await denoTemplate.render({
    text: `{{ $name }}`,
    data: {
        name: "jack"
    }
});

// prints the result
console.log(result);

/**
 * Output
 * jack
 */
```
to call the value to be interpreted in the template, it has to start with the symbol `$`. For example `{{ $name }}`

### Escape Html
You can escape your html using the following statement

```ts
import { LaraDenoTemplate } from "https://deno.land/x/lara_template_deno/mod.ts";

const denoTemplate = new LaraDenoTemplate();

const result = await denoTemplate.render({
    text: `{> "<p>hello</p>" <}`
});

// prints the result
console.log(result);

/**
 * Output
 * &lt;p&gt;hello&lt;/p&gt;
 */
```
When you use this expressions `{> ... <}` it escapes everything that's inside.

Or you can enable HTML escaping in the LaraTemplateDeno configuration so that it is automatically applied to `{{ ... }}` expressions. With the following code.

```ts
import { LaraDenoTemplate } from "https://deno.land/x/lara_template_deno/mod.ts";

const denoTemplate = new LaraDenoTemplate({
    escapeHTML: true
});

const result = await denoTemplate.render({
    text: `{{ "<p>hello</p>" }}`
});

// prints the result
console.log(result);

/**
 * Output
 * &lt;p&gt;hello&lt;/p&gt;
 */
```
### Unescape Html
You can also do the process in reverse
```ts
import { LaraDenoTemplate } from "https://deno.land/x/lara_template_deno/mod.ts";

const denoTemplate = new LaraDenoTemplate();

const result = await denoTemplate.render({
    text: `{< "&lt;html&gt;hello&lt;/html&gt;" >}`
});

// prints the result
console.log(result);

/**
 * Output
 * <html>hello</html>
 */
```
Using this expressions `{< ... >}` you can do the process in reverse.

### Comments
Sometimes we just want to leave comments to explain what our code does without affecting the rendering of the templates. 

In the following example you can see how to add comments in the 

```ts
import { LaraDenoTemplate } from "https://deno.land/x/lara_template_deno/mod.ts";

const denoTemplate = new LaraDenoTemplate();

// we load our temporary data 
denoTemplate.share({
    id: 1455746
});

const result = await denoTemplate.render({
    text: `{{ #id }} {* This is a comment *}`
});

// prints the result
console.log(result);

/**
 * Output
 * 1455746
 */
```
Using this expression `{* ... *}` the renderer will ignore it in the final result

### Temporal Data
The temporal data is similar to when you pass the object to be interpreted in the template to the renderer. The difference is that the temporal data is preloaded before rendering the template. Once the template is rendered the temporary data is removed.

The method we will use to load the temporary data is `share`.
```ts
import { LaraDenoTemplate } from "https://deno.land/x/lara_template_deno/mod.ts";

const denoTemplate = new LaraDenoTemplate();

// we load our temporary data 
denoTemplate.share({
    id: 1455746
});

const result = await denoTemplate.render({
    text: `{{ #id }}`
});

// prints the result
console.log(result);

/**
 * Output
 * 1455746
 */
```

<!-- ## Deno Template Directives

## Render Templates

## Compile Templates

## Transpile Templates

## Register Custom Directives

## Register Scoped

## Preload Code

## Modifiers -->

## Examples
To test these examples you have to run the following command in your console
```bash
deno run -A https://deno.land/x/lara_template_deno@v1.0.0/examples/render.ts
```
this will render the first example "Basic.deno".

But if you want to render each example you can use the --file flag passing the index of the example to render

```bash
deno run -A https://deno.land/x/lara_template_deno@v1.0.0/examples/render.ts --file=1
```
This will render the example "Code.deno"

- [Basic](/examples/templates/basic.deno)
- [Code](/examples/templates/code.deno)
- [Cycles](/examples/templates/cycles.deno)
- [Conditionals](/examples/templates/conditionals.deno)
- [With](/examples/templates/with.deno)
- [Functions](/examples/templates/functions.deno)
- [Class](/examples/templates/class.deno)
- [Import](/examples/templates/import.deno)
- [Includes](/examples/templates/includes.deno)
- [Custom Directives](/examples/templates/custom_directives.deno)
- [Error](/examples/templates/error.deno)
- [Inline](/examples/templates/inline.deno)
- [Typescript](/examples/templates/typescript.deno)
- [Components](/examples/templates/components.deno)
- [Html](/examples/templates/html.deno)
- [All](/examples/templates/all.deno)
## Benchmarks
performance testing with [Lara Deno Template](https://deno.land/x/lara_template_deno)
![alt](/bench/lara/lara-bench.png)

performance testing with [Handlebars](https://handlebarsjs.com/)
![alt](/bench/handlebars/handlebars-bench.png)

You can run the benchmarks on your console with the following command
```bash
deno bench -A https://deno.land/x/lara_template_deno@v1.0.0/bench/
```
You can also run the performance tests individually
```bash
deno bench -A https://deno.land/x/lara_template_deno@v1.0.0/bench/lara/bench.ts
#OR
deno bench -A https://deno.land/x/lara_template_deno@v1.0.0/bench/handlebars/bench.ts
```
## Testing
You can run all the tests in your local with the following command
```bash
deno test -A https://deno.land/x/lara_template_deno@v1.0.0/tests/
```

## Used By

This project is used by the following companies:

> Fork the repository, append your company's name with the URL in above format inside the README.md file and make a PR! or create a GitHub issue mentioning (Site's name & domain).

## Feedback

Create an issue on github repo. and mention the details there.

## Contributing

All contributions are super welcomed!

## License

Lara Template Deno is provided under [MIT License](https://opensource.org/licenses/MIT)