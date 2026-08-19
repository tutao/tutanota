import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../../../ui/theme"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { MailboxType, MigrationMailboxRow } from "./MigrationCsvParser"

export interface MigrationCsvPreviewRowAttrs {
	row: MigrationMailboxRow
	selected: boolean
	onToggleSelected: () => void
}

/** A single row of the CSV upload preview: checkbox, source email, Tuta address, mailbox type, and aliases. */
export class MigrationCsvPreviewRow implements Component<MigrationCsvPreviewRowAttrs> {
	view({ attrs }: Vnode<MigrationCsvPreviewRowAttrs>): Children {
		const { row, selected, onToggleSelected } = attrs
		return m(
			".items-center",
			{
				style: {
					display: "grid",
					"grid-template-columns": "subgrid",
					"grid-column": "1 / 6",
					padding: "8px 12px",
					"border-radius": "10px",
					background: theme.surface,
				},
			},
			[
				m(
					"div",
					m("input.checkbox", {
						type: "checkbox",
						checked: selected,
						onchange: onToggleSelected,
					}),
				),
				m("div.text-ellipsis", row.sourceEmail),
				m("div.text-ellipsis", row.tutaEmail),
				m(
					"div.text-ellipsis",
					row.mailboxType === MailboxType.User
						? lang.getTranslationText("migrationMailboxTypeUser_label")
						: lang.getTranslationText("migrationMailboxTypeShared_label"),
				),
				m("div.text-ellipsis", row.aliases.join(", ") || "-"),
			],
		)
	}
}
