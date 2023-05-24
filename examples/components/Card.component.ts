import { LaraTemplateComponent } from "../../src/component.code.ts";

export class Card extends LaraTemplateComponent{
    public async render() {
        return await this.component(`
            <article class="card-main {{ $attr.class }}">
                <header>
                    {{ $title }}
                </header>
                <section>
                    {{ $body }}
                    <ul>
                        @for(const language of $languages);
                            <li> {{ language }} </li>
                        @endFor
                    </ul>
                </section>
                <section>
                    {{ $slot }}
                <section>
            </article>
        `);
    }
}