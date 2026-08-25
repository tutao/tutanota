import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { MailboxType, MigrationMailboxRow } from "./MigrationCsvParser"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"

export interface MigrationCsvPreviewRowAttrs {
	row: MigrationMailboxRow
	selected: boolean
	onToggleSelected: () => void
}

export class MigrationCsvPreviewRow implements Component<MigrationCsvPreviewRowAttrs> {
	view({ attrs }: Vnode<MigrationCsvPreviewRowAttrs>): Children {
		const { row, selected, onToggleSelected } = attrs
		return m(".items-center.subgrid-columns.fill-grid-row.pt-8.pb-8.plr-12.content-bg.border-radius-8", [
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
			m(".flex.items-center.gap-8", [
				m(Icon, {
					icon: row.mailboxType === MailboxType.User ? Icons.PersonOutline : Icons.PeopleOutline,
					size: IconSize.PX20,
				}),
				m(
					"div.text-ellipsis",
					row.mailboxType === MailboxType.User
						? lang.getTranslationText("migrationMailboxTypeUser_label")
						: lang.getTranslationText("migrationMailboxTypeShared_label"),
				),
			]),

			m("div.text-ellipsis", row.aliases.join(", ") || "-"),
		])
	}
}
