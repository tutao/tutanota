import m, { Children, ClassComponent, Vnode } from "mithril"

export interface CardAttrs {
	rootElementType?: "div" | "section"
	classes?: Array<string>
	style?: Partial<Pick<CSSStyleDeclaration, "padding">>
}

type HTMLElementWithAttrs = Partial<Pick<m.Attributes, "class"> & Omit<HTMLElement, "style"> & CardAttrs>

/**
 * Simple card component
 * @see Component attributes: {CardAttrs}
 * @example
 * m(Card, {
 *     rootElementType: "section", // Changing the default root element
 *     classes: ["mt"], // Adding new styles
 *     style: {
 *         "font-size": px(size.font_size_base * 1.25) // Overriding the component style
 *     }
 * }, m("span", "Child span text")),
 */
export class Card implements ClassComponent<CardAttrs> {
	view({ attrs, children }: Vnode<CardAttrs, this>): Children | void | null {
		return m(
			`${attrs.rootElementType ?? "div"}.tutaui-card-container`,
			{
				class: attrs.classes?.join(" "),
				style: attrs.style,
			} satisfies HTMLElementWithAttrs,
			children,
		)
	}
}
