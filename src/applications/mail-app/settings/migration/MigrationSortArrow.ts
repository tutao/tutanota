import m, { Children, Component, Vnode } from "mithril"
import { Icon } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { theme } from "../../../../ui/theme"
import { lang, Translation } from "../../../../ui/utils/LanguageViewModel"

export interface MigrationSortArrowAttrs {
	sortOrder: "asc" | "desc" | null
}

/**
 * Mirrors Drive's `DriveSortArrow` (src/applications/drive-app/drive/view/DriveSortArrow.ts) - duplicated rather
 * than imported since mail-app must not statically depend on drive-app code (see bundle chunking rules).
 */
export class MigrationSortArrow implements Component<MigrationSortArrowAttrs> {
	view({ attrs: { sortOrder } }: Vnode<MigrationSortArrowAttrs>): Children {
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
			".flex.items-center.justify-center.button-height.button-width-fixed",
			{
				"aria-description": label.text,
			},
			m(Icon, {
				icon: Icons.ArrowRight,
				// svg inside the span has some random line-height and it makes the svg overflow. na-ah ☝
				style: { lineHeight: "0", fill: theme.on_surface, transform: `rotate(${rotation})` },
			}),
		)
	}
}
