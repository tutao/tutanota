import m, { ClassComponent, Vnode } from "mithril"

export interface DividerAttrs {
	color: string
	style?: Pick<CSSStyleDeclaration, "margin">
}

export class Divider implements ClassComponent<DividerAttrs> {
	view({ attrs }: Vnode<DividerAttrs>) {
		return m("hr.m-0.border-none.full-width", {
			style: {
				height: "1px",
				backgroundColor: attrs.color,
				color: attrs.color,
				...attrs.style,
			},
		})
	}
}
