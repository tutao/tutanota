import { Thunk } from "@tutao/tutanota-utils"
import m, { Children, Component, Vnode } from "mithril"
import { SectionButton } from "../gui/base/buttons/SectionButton.js"

export type Props = {
	onClick: Thunk
}

export class NoSolutionSectionButton implements Component<Props> {
	view({ attrs: { onClick } }: Vnode<Props>): Children {
		return m(SectionButton, {
			text: "Other",
			onclick: onClick,
		})
	}
}