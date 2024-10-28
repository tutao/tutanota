import m, { Children, ClassComponent, Vnode } from "mithril"

export interface CardAttrs {
	rootElementType?: "div" | "section"
	class?: string
	style?: Record<string, any>
}

type HTMLElementWithAttrs = HTMLElement & CardAttrs

/**
 * Simple card component
 * @see Component attributes: {CardAttrs}
 * @example
 * m(Card, {
 *     rootElementType: "section", // Changing the default root element
 *     class: "custom-font-size", // Adding new styles
 *     style: {
 *         "font-size": px(size.font_size_base * 1.25) // Overriding the component style
 *     }
 * }),
 */
export class Card implements ClassComponent<CardAttrs> {
	view({ attrs, children }: Vnode<CardAttrs, this>): Children | void | null {
		return m(`${attrs.rootElementType ?? "div"}.card-container`, { class: attrs.class, style: attrs.style } as HTMLElementWithAttrs, children)
	}
}
