import m, { Children, ClassComponent, Vnode } from "mithril"
import { lang, TranslationKey } from "../utils/LanguageViewModel"
import { EnvProvider } from "../../platform-kit/app-env"
import { IconButton, IconButtonAttrs } from "./IconButton"
import { progressIcon } from "./Icon"
import { Card } from "./Card"
import { component_size, px, size } from "../size"
import { theme } from "../theme"
import { isNotEmpty } from "@tutao/utils"

EnvProvider.assertMainOrNode()

export interface TableNewRowAttrs {
	text: string
	actionButtons?: ReadonlyArray<IconButtonAttrs>
}

export interface TableNewAttrs {
	heading?: TranslationKey
	rows: ReadonlyArray<TableNewRowAttrs> | null
	addButtonAttrs?: IconButtonAttrs | null
	class?: string
}

export class TableNew implements ClassComponent<TableNewAttrs> {
	view({ attrs }: Vnode<TableNewAttrs>): Children {
		const { heading, rows, addButtonAttrs } = attrs
		return m("", { class: attrs.class }, [
			heading != null || addButtonAttrs
				? m(
						".flex.items-center.justify-between",
						{ style: { minHeight: px(component_size.button_height_compact), paddingLeft: px(size.spacing_16), paddingBottom: px(size.spacing_4) } },
						[
							m("small.b.noselect", { style: { color: theme.on_surface_variant } }, heading != null ? lang.getTranslationText(heading) : null),
							addButtonAttrs ? m(IconButton, addButtonAttrs) : null,
						],
					)
				: null,
			m(
				Card,
				{
					shouldDivide: true,
					style: { backgroundColor: theme.surface_container_high, overflow: "hidden" },
				},
				rows == null
					? m(".flex-center.items-center.button-height", progressIcon())
					: rows.length === 0
						? m(".flex-center.items-center.button-height", lang.get("noEntries_msg"))
						: rows.map((row) => this.renderRow(row)),
			),
		])
	}

	private renderRow(row: TableNewRowAttrs): Children {
		return m(
			".table-new-row.flex.items-center",
			{
				style: {
					minHeight: px(component_size.button_height_lg),
					paddingLeft: px(size.spacing_16),
					paddingRight: px(size.spacing_8),
				},
			},
			[
				m(".flex-grow.min-width-0.flex.flex-column.justify-center", [
					m(".text-ellipsis", { title: row.text, style: { color: theme.on_surface } }, row.text),
				]),
				row.actionButtons && isNotEmpty(row.actionButtons)
					? m(
							".flex.items-center.flex",
							row.actionButtons.map((button) => m(IconButton, button)),
						)
					: null,
			],
		)
	}
}
