import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { Icon } from "../../../common/gui/base/Icon"
import { theme } from "../../../common/gui/theme"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"

export interface DriveSortArrowAttrs {
	sortOrder: "asc" | "desc" | null
}

export class DriveSortArrow implements Component<DriveSortArrowAttrs> {
	view({ attrs: { sortOrder } }: Vnode<DriveSortArrowAttrs>): Children {
		let rotation: string
		let label: Translation
		switch (sortOrder) {
			case "asc":
				rotation = "270deg"
				label = lang.getTranslation("sortAscending_label")
				break
			case "desc":
				rotation = "90deg"
				label = lang.getTranslation("sortDescending_label")
				break
			case null:
				rotation = "0"
				label = lang.getTranslation("sortNeutral_label")
				break
		}

		return m(
			".flex.items-center.justify-center	.button-height.button-width-fixed",
			{
				"aria-description": label.text,
			},
			m(Icon, {
				icon: Icons.SortArrow,
				// svg inside the span has some random line-height and it makes the svg overflow. na-ah ☝
				style: { lineHeight: "0", fill: theme.on_surface, transform: `rotate(${rotation})` },
			}),
		)
	}
}
