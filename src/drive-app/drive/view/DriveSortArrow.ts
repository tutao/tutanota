import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { AllIcons, Icon } from "../../../common/gui/base/Icon"

export interface DriveSortArrowAttrs {
	sortOrder: "asc" | "desc" | null
}

export class DriveSortArrow implements Component<DriveSortArrowAttrs> {
	view({ attrs: { sortOrder } }: Vnode<DriveSortArrowAttrs>): Children {
		let icon: AllIcons
		switch (sortOrder) {
			case "asc":
				icon = Icons.ArrowDropUp
				break
			case "desc":
				icon = Icons.ArrowDropDown
				break
			case null:
				icon = Icons.ArrowDropRight
				break
		}

		return m(Icon, {
			icon,
		})
	}
}
