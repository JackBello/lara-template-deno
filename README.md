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

<p align="center">

</p>

# Features

- Render
- Compiler
- Transpile
- Minify
- Formatter
- Custom Directives
- Global Scoped
- Preload Code
- Http Response
- Temporal Data

# Overview

What I am looking for with this tool is to facilitate the creation of templates quickly and efficiently, with the possibility for developers to add extra functionality through custom directives and adding functionality globally to the scoped.

# Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Introduction](#introduction)
- [Examples](#examples)
- [Used By](#used-by)
- [Feedback](#feedback)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

> The following prerequisites are only necessary for the installation of Lara Template Deno

- Deno@^1.32.1

<details>
  <summary>Prerequisites Installation (Click to show)</summary>

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
import { LaraDenoTemplate } from "https://deno.land/x/lara_template_deno/mod.ts"

// initializes the class
const denoTemplate = new LaraDenoTemplate();

// creates a variable containing the text to render
const render = `
    personal information:
    name {{ $name }}
    age {{ $age }}
`;

// pass it the variable containing the text to be rendered and an object with the properties and methods to be interpreted in the template
const result = await denoTemplate.render(render, {
    name: "jack",
    age: 27
});

// prints the result
console.log(result)

/**
 * Output
 *  personal information:
 *  name jack
 *  age 27
 */
```
Then you execute the following command

```bash
deno run -A index.ts
```

## Examples
- [Basic](https://deno.land/x/lara_template_deno@v1.0.0/examples/basic.deno?source)
- [Code](https://deno.land/x/lara_template_deno@v1.0.0/examples/code.deno?source)
- [Cycles](https://deno.land/x/lara_template_deno@v1.0.0/examples/cycles.deno?source)
- [Conditionals](https://deno.land/x/lara_template_deno@v1.0.0/examples/conditionals.deno?source)
- [With](https://deno.land/x/lara_template_deno@v1.0.0/examples/with.deno?source)
- [Functions](https://deno.land/x/lara_template_deno@v1.0.0/examples/functions.deno?source)
- [Class](https://deno.land/x/lara_template_deno@v1.0.0/examples/class.deno?source)
- [Import](https://deno.land/x/lara_template_deno@v1.0.0/examples/import.deno?source)
- [Includes](https://deno.land/x/lara_template_deno@v1.0.0/examples/includes.deno?source)
- [Custom Directives](https://deno.land/x/lara_template_deno@v1.0.0/examples/custom_directives.deno?source)


## Used By

This project is used by the following companies:

> Fork the repository, append your company's name with the URL in above format inside the README.md file and make a PR! or create a GitHub issue mentioning (Site's name & domain).

## Feedback

Create an issue on github repo. and mention the details there.

## Contributing

All contributions are super welcomed!

## License

Lara Template Deno is provided under [MIT License](https://opensource.org/licenses/MIT)