import m, { Children, Component, Vnode } from "mithril"
import type { ButtonAttrs } from "./Button.js"
import { Button } from "./Button.js"
import type { lazy, MaybeLazy } from "@tutao/tutanota-utils"
import { resolveMaybeLazy } from "@tutao/tutanota-utils"

export type DialogHeaderBarAttrs = {
	left?: MaybeLazy<Array<ButtonAttrs>>
	right?: MaybeLazy<Array<ButtonAttrs>>
	middle?: lazy<string>
	create?: (dom: HTMLElement) => void
	remove?: () => void
	noHeader?: boolean
	class?: string
}

/**
 * An action bar is a bar that contains buttons (either on the left or on the right).
 */
export class DialogHeaderBar implements Component<DialogHeaderBarAttrs> {
	view(vnode: Vnode<DialogHeaderBarAttrs>): Children {
		const a = Object.assign(
			{},
			{
				left: [],
				right: [],
			},
			vnode.attrs,
		)
		let columnClass = a.middle ? ".flex-third.overflow-hidden" : ".flex-half.overflow-hidden"
		return m(
			".dialog-header.plr-l.flex-space-between.dialog-header-line-height",
			{
				oncreate: ({ dom }) => {
					if (a.create) a.create(dom as HTMLElement)
				},
				onremove: () => {
					if (a.remove) a.remove()
				},
				class: vnode.attrs.class,
			},
			[
				m(
					columnClass + ".ml-negative-s",
					resolveMaybeLazy(a.left).map((a) => m(Button, a)),
				), // ellipsis is not working if the text is directly in the flex element, so create a child div for it
				a.middle ? m("#dialog-title.flex-third-middle.overflow-hidden.flex.justify-center.items-center.b", [m(".text-ellipsis", a.middle())]) : null,
				m(
					columnClass + ".mr-negative-s.flex.justify-end",
					resolveMaybeLazy(a.right).map((a) => m(Button, a)),
				),
			],
		)
	}
}
