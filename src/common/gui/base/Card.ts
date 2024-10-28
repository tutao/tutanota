import m, { Children, ClassComponent, Vnode } from "mithril"

export interface CardAttrs {
	rootElementType?: "div" | "section"
}

export class Card implements ClassComponent<CardAttrs> {
	view({ attrs, children }: Vnode<CardAttrs, this>): Children | void | null {
		return m(`${attrs.rootElementType ?? "div"}.card-container`, children)
	}
}
