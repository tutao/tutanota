import m, { Children, Component, Vnode } from "mithril"
import { CustomerMailboxMigrationInfoStatus } from "../../../../entities/tutanota/Utils"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { IconButton } from "../../../../ui/base/IconButton"
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { theme } from "../../../../ui/theme"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { copyToClipboard } from "../../../../ui/utils/ClipboardUtils"
import { showSnackBar } from "../../../../ui/base/SnackBar"
import { MigrationErrorCause } from "../../../common/api/common/error/MigrationError"
import { migrationErrorCauseToReadableMigrationError } from "./MigrationErrorHandler"

export type MigrationMailboxRowView = {
	name: string
	mailAddress: string
	status: CustomerMailboxMigrationInfoStatus
	initialPassword: string | null
	errorCode: string | null
}

export function migrationMailboxStatusLabel(status: CustomerMailboxMigrationInfoStatus): TranslationKey {
	switch (status) {
		case CustomerMailboxMigrationInfoStatus.CREATED:
			return "migrationStatusNotStarted_label"
		case CustomerMailboxMigrationInfoStatus.RUNNING:
			return "migrationStatusSyncing_label"
		case CustomerMailboxMigrationInfoStatus.FINISHED_SYNC:
			return "migrationStatusSynced_label"
		case CustomerMailboxMigrationInfoStatus.COMPLETED_SUCCESSFULLY:
			return "migrationStatusComplete_label"
		case CustomerMailboxMigrationInfoStatus.ERROR:
			return "migrationStatusError_label"
		case CustomerMailboxMigrationInfoStatus.CANCELLED:
			return "migrationStatusCancelled_label"
		default:
			return "migrationStatusNotStarted_label"
	}
}

function migrationMailboxStatusColor(status: CustomerMailboxMigrationInfoStatus): string {
	switch (status) {
		case CustomerMailboxMigrationInfoStatus.COMPLETED_SUCCESSFULLY:
			return theme.success
		case CustomerMailboxMigrationInfoStatus.ERROR:
		case CustomerMailboxMigrationInfoStatus.CANCELLED:
			return theme.error
		default:
			return theme.on_surface_variant
	}
}

function migrationMailboxStatusIcon(status: CustomerMailboxMigrationInfoStatus) {
	switch (status) {
		case CustomerMailboxMigrationInfoStatus.COMPLETED_SUCCESSFULLY:
			return Icons.Checkmark
		case CustomerMailboxMigrationInfoStatus.FINISHED_SYNC:
			return Icons.CircleCheckOutline
		case CustomerMailboxMigrationInfoStatus.ERROR:
			return Icons.FailureFilled
		case CustomerMailboxMigrationInfoStatus.CANCELLED:
			return Icons.StopOutline
		case CustomerMailboxMigrationInfoStatus.RUNNING:
			return Icons.Sync
		default:
			return Icons.ClockOutlines
	}
}

/** Readable error for an ERROR-status row, derived from its stored `errorCode` (a `MigrationErrorCause`), or null if not applicable. */
function migrationMailboxErrorMessage(row: MigrationMailboxRowView): string | null {
	if (row.status !== CustomerMailboxMigrationInfoStatus.ERROR || row.errorCode == null) return null
	return migrationErrorCauseToReadableMigrationError(parseInt(row.errorCode) as MigrationErrorCause).errorMessage
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
					background: row.status === CustomerMailboxMigrationInfoStatus.COMPLETED_SUCCESSFULLY ? theme.success_container : theme.surface,
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
								label: "copy_action",
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
