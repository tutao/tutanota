import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { AllIcons, Icon } from "../../../common/gui/base/Icon"
import { theme } from "../../../common/gui/theme"

export interface DriveSortArrowAttrs {
	sortOrder: "asc" | "desc" | null
}

export class DriveSortArrow implements Component<DriveSortArrowAttrs> {
	view({ attrs: { sortOrder } }: Vnode<DriveSortArrowAttrs>): Children {
		let rotation: string
		let icon: AllIcons
		switch (sortOrder) {
			case "asc":
				rotation = "270deg"
				break
			case "desc":
				rotation = "90deg"
				break
			case null:
				rotation = "0"
				break
		}

		return m(
			".flex.items-center.justify-center	.button-height.button-width-fixed",
			// FIXME: aria description for the icon status
			m(Icon, {
				icon: Icons.SortArrow,
				// svg inside the span has some random line-height and it makes the svg overflow. na-ah ☝
				style: { lineHeight: "0", fill: theme.on_surface, transform: `rotate(${rotation})` },
			}),
		)
	}
}
