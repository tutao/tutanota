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
import { ImapErrorCause } from "../../../common/api/common/error/ImapError"
import { imapErrorCauseToReadableImapError } from "../imapimport/ImapErrorHandler"

export type MigrationMailboxRowView = {
	name: string
	mailAddress: string
	status: CustomerMigrationMailboxInfoStatus
	initialPassword: string | null
	errorCode: string | null
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
		case CustomerMigrationMailboxInfoStatus.FINISHED_SYNC:
			return Icons.CircleCheckOutline
		case CustomerMigrationMailboxInfoStatus.ERROR:
			return Icons.FailureFilled
		case CustomerMigrationMailboxInfoStatus.CANCELLED:
			return Icons.StopOutline
		case CustomerMigrationMailboxInfoStatus.RUNNING:
			return Icons.Sync
		default:
			return Icons.ClockOutlines
	}
}

/** Readable IMAP error for an ERROR-status row, derived from its stored `errorCode` (an `ImapErrorCause`), or null if not applicable. */
function migrationMailboxErrorMessage(row: MigrationMailboxRowView): string | null {
	if (row.status !== CustomerMigrationMailboxInfoStatus.ERROR || row.errorCode == null) return null
	return imapErrorCauseToReadableImapError(parseInt(row.errorCode) as ImapErrorCause).errorMessage
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
			".items-center.subgrid-columns.fill-grid-row.pt-8.pb-8.plr-12.border-radius-8",
			{
				style: {
					background: row.status === CustomerMigrationMailboxInfoStatus.COMPLETED_SUCCESSFULLY ? theme.success_container : theme.surface,
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
				m(".flex.items-center.gap-8", { title: migrationMailboxErrorMessage(row) ?? undefined }, [
					m(Icon, { icon: migrationMailboxStatusIcon(row.status), size: IconSize.PX20, style: { fill: migrationMailboxStatusColor(row.status) } }),
					m("div", { style: { color: migrationMailboxStatusColor(row.status) } }, lang.getTranslationText(migrationMailboxStatusLabel(row.status))),
				]),
				row.initialPassword
					? m(".flex.items-center.gap-4", [
							m("div", revealed ? row.initialPassword : "***"),
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
					: m("div", "-"),
			],
		)
	}
}
