import { LaraTemplateDeno } from "./index.ts";

export class LaraTemplateComponent {
    private static templateDeno: LaraTemplateDeno;

    private _properties: Record<string, any> = {};
    private _attributes: Record<string, any> = {};
    private _tagName!: string;
    private _slot!: string;
    private _raw: string;

    static set renderTemplate(templateDeno: LaraTemplateDeno) {
        LaraTemplateComponent.templateDeno = templateDeno;
    }

    static get renderTemplate() {
        return LaraTemplateComponent.templateDeno;
    }

    constructor (html: string) {
        this._raw = html;
        this.loadSlot();
        this.loadTagName();
    }

    private loadSlot(): void {
        this._slot = this._raw.replace(/(<%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%>|<%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%\/>|<\/%((?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+|)%>)/g, "");
    }

    private loadTagName(): void {
        this._tagName = this._raw.replace(this._slot, "").replace(/(\:|)[\w-]+="[^"]*"/g,"").replace(/\s/g,"").trim().replace(/<\/%[a-zA-Z-]+%>/g,"").replace(/(<%|%\/>|%>)/g,"").trim()
    }

    public load(attributes: Record<string, any>, properties: string[]): void {
        for (const key in attributes) {
            if (properties.includes(key.replace(":",""))) {
                this._properties[key.replace(":","")] = attributes[key];
            } else {
                this._attributes[key.replace(":","")] = attributes[key];
            }
        }
    }

    public async component(html: string): Promise<string> {
        return await LaraTemplateComponent.renderTemplate.component(html, {
            attr: this._attributes,
            name: this._tagName, 
            slot: this._slot,
            ...this._properties
        });
    }
}