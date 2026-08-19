import m, { Children, Component, Vnode } from "mithril"
import { CustomerMigrationMailboxInfoStatus } from "../../../../entities/tutanota/Utils"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { IconButton } from "../../../../ui/base/IconButton"
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { copyToClipboard } from "../../../../ui/utils/ClipboardUtils"
import { showSnackBar } from "../../../../ui/base/SnackBar"

export type MigrationMailboxRowView = {
	name: string
	mailAddress: string
	status: CustomerMigrationMailboxInfoStatus
	initialPassword: string | null
}

export function migrationMailboxStatusLabel(status: CustomerMigrationMailboxInfoStatus): TranslationKey {
	switch (status) {
		case CustomerMigrationMailboxInfoStatus.CREATED:
			return "migrationStatusNotStarted_label"
		case CustomerMigrationMailboxInfoStatus.RUNNING:
			return "migrationStatusSyncing_label"
		case CustomerMigrationMailboxInfoStatus.FINISHED_SYNC:
			return "migrationStatusSynced_label"
		case CustomerMigrationMailboxInfoStatus.COMPLETED_SUCCESSFULLY:
			return "migrationStatusComplete_label"
		case CustomerMigrationMailboxInfoStatus.ERROR:
			return "migrationStatusError_label"
		case CustomerMigrationMailboxInfoStatus.CANCELLED:
			return "migrationStatusCancelled_label"
		default:
			return "migrationStatusNotStarted_label"
	}
}

function migrationMailboxStatusColor(status: CustomerMigrationMailboxInfoStatus): string {
	switch (status) {
		case CustomerMigrationMailboxInfoStatus.COMPLETED_SUCCESSFULLY:
			return theme.success
		case CustomerMigrationMailboxInfoStatus.ERROR:
		case CustomerMigrationMailboxInfoStatus.CANCELLED:
			return theme.error
		default:
			return theme.on_surface_variant
	}
}

function migrationMailboxStatusIcon(status: CustomerMigrationMailboxInfoStatus) {
	switch (status) {
		case CustomerMigrationMailboxInfoStatus.COMPLETED_SUCCESSFULLY:
			return Icons.Checkmark
		case CustomerMigrationMailboxInfoStatus.ERROR:
		case CustomerMigrationMailboxInfoStatus.CANCELLED:
			return Icons.FailureFilled
		case CustomerMigrationMailboxInfoStatus.RUNNING:
			return Icons.Sync
		default:
			return Icons.ClockOutlines
	}
}

export interface MigrationMailboxTableRowAttrs {
	row: MigrationMailboxRowView
	selected: boolean
	onToggleSelected: () => void
	revealed: boolean
	onToggleRevealed: () => void
}

/** A single row of the migration status table: checkbox, name, Tuta address, status badge, and password reveal/copy. */
export class MigrationMailboxTableRow implements Component<MigrationMailboxTableRowAttrs> {
	view({ attrs }: Vnode<MigrationMailboxTableRowAttrs>): Children {
		const { row, selected, onToggleSelected, revealed, onToggleRevealed } = attrs
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
				m("div.text-ellipsis", row.name),
				m("div.text-ellipsis", row.mailAddress),
				m(".flex.items-center.gap-8", [
					m(Icon, { icon: migrationMailboxStatusIcon(row.status), size: IconSize.PX20, style: { fill: migrationMailboxStatusColor(row.status) } }),
					m(
						"div.small",
						{ style: { color: migrationMailboxStatusColor(row.status) } },
						lang.getTranslationText(migrationMailboxStatusLabel(row.status)),
					),
				]),
				row.initialPassword
					? m(".flex.items-center.gap-4", [
							m("div.small", revealed ? row.initialPassword : "***"),
							m(ToggleButton, {
								title: revealed ? "concealPassword_action" : "revealPassword_action",
								toggled: revealed,
								icon: revealed ? Icons.EyeCrossedFilled : Icons.EyeFilled,
								size: ButtonSize.Compact,
								onToggled: (_, e) => {
									onToggleRevealed()
									e.stopPropagation()
								},
							}),
							m(IconButton, {
								title: "copy_action",
								icon: Icons.ClipboardFilled,
								size: ButtonSize.Compact,
								click: () => {
									copyToClipboard(row.initialPassword!)
									showSnackBar({ message: "copied_msg", showingTime: 3000, leadingIcon: Icons.ClipboardFilled })
								},
							}),
						])
					: m("div.small", "-"),
			],
		)
	}
}
