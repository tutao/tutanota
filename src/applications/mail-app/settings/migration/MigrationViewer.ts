import m, { Children } from "mithril"
import { assertMainOrNode } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { lazy } from "@tutao/utils"
import { CustomerMigrationController } from "./CustomerMigrationController"
import { TitleSection } from "../../../../ui/TitleSection"
import { Icons } from "../../../../ui/base/icons/Icons"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { BannerType, InfoBanner } from "../../../../ui/base/InfoBanner"
import { PrimaryButton, TertiaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { IconButton } from "../../../../ui/base/IconButton"
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { AllIcons, Icon, IconSize } from "../../../../ui/base/Icon"
import { theme } from "../../../../ui/theme"
import { formatDate } from "../../../../ui/utils/Formatter"
import { copyToClipboard } from "../../../../ui/utils/ClipboardUtils"
import { showSnackBar } from "../../../../ui/base/SnackBar"
import { renderCsv, stringToUtf8Uint8Array } from "../../../../platform-kit/utils"
import { createDataFile } from "../../../common/api/worker/utils/DataFile"
import { generatedIdToTimestamp } from "../../../../platform-kit/meta/EntityUtils"
import { mailLocator } from "../../mailLocator"
import {
	CustomerMigrationInformation,
	CustomerMigrationInformationTypeRef,
	MailboxMigrationInformation,
	MailboxMigrationInformationTypeRef,
} from "@tutao/entities/sys"
import { ImapAccountSyncStateTypeRef } from "@tutao/entities/tutanota"
import { createMigrationWizard, migrationWizardSteps, MultiUserMigrationData, newMultiUserMigrationData } from "./AddMultiUserMigrationWizard"
import { MigrationWizardLayout } from "./MigrationWizardLayout"
import { CustomerMigrationMailboxInfoStatus } from "../../../../entities/tutanota/Utils"

assertMainOrNode()

const GRID_COLUMNS = "minmax(160px, 1fr) minmax(200px, 1.5fr) 140px 180px"

type MigrationMailboxRowView = {
	name: string
	mailAddress: string
	status: CustomerMigrationMailboxInfoStatus
	initialPassword: string | null
}

type MigrationBatchView = {
	id: IdTuple
	startedAt: number
	rows: MigrationMailboxRowView[]
}

function migrationMailboxStatusLabel(status: CustomerMigrationMailboxInfoStatus): TranslationKey {
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
			return theme.error
		case CustomerMigrationMailboxInfoStatus.CANCELLED:
			return theme.error
		default:
			return theme.on_surface_variant
	}
}

function migrationMailboxStatusIcon(status: CustomerMigrationMailboxInfoStatus): AllIcons {
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

class MigrationViewer implements UpdatableSettingsViewer {
	private showWizard = false
	private loading = true
	private batches: MigrationBatchView[] = []
	private revealedPasswords = new Set<string>()
	private wizard: ReturnType<typeof createMigrationWizard> | null = null
	private wizardData: MultiUserMigrationData | null = null

	constructor(private readonly customerMigrationController: lazy<CustomerMigrationController>) {}

	async oninit() {
		await this.reload()
	}

	private async reload(): Promise<void> {
		this.loading = true
		m.redraw()
		try {
			this.batches = await loadMigrationBatches()
		} finally {
			this.loading = false
			m.redraw()
		}
	}

	view(): Children {
		return m(
			".fill-absolute.scroll.plr-24.pb-48",
			{
				style: {
					backgroundColor: theme.surface_container,
					gap: "16px",
					display: "flex",
					flexDirection: "column",
				},
			},
			this.showWizard ? this.renderWizard() : this.renderOverview(),
		)
	}

	private renderOverview(): Children {
		return [
			m(TitleSection, {
				icon: Icons.SimpleArrowRight,
				title: lang.getTranslationText("migrationSetup_title"),
				subTitle: lang.getTranslationText("migrationMultiUserDescription_msg"),
			}),
			this.loading
				? null
				: this.batches.length === 0
					? m(InfoBanner, {
							message: "migrationNoSynchronizationActive_msg",
							icon: Icons.InfoFilled,
							type: BannerType.SettingsInfo,
							buttons: [],
						})
					: this.batches.map((batch) => this.renderBatch(batch)),
			m(
				".flex-end.mt-8",
				m(PrimaryButton, {
					width: "flex",
					label: "migrationAddSynchronization_action",
					onclick: () => {
						this.wizard = createMigrationWizard()
						this.wizardData = newMultiUserMigrationData()
						this.showWizard = true
						m.redraw()
					},
				}),
			),
		]
	}

	private renderBatch(batch: MigrationBatchView): Children {
		const completed = batch.rows.filter((row) => row.status === CustomerMigrationMailboxInfoStatus.COMPLETED_SUCCESSFULLY).length
		const allCompleted = batch.rows.length > 0 && completed === batch.rows.length
		const hasCredentials = batch.rows.some((row) => row.initialPassword)

		return m(".mt-16", [
			m(".flex.items-center.justify-between", [
				m(".b", formatDate(new Date(batch.startedAt))),
				hasCredentials
					? m(TertiaryButton, {
							label: "migrationDownloadCredentials_action",
							onclick: () => downloadBatchCredentials(batch),
						})
					: null,
			]),
			m(InfoBanner, {
				message: () => lang.getTranslation("migrationAccountsCompleted_label", { "{count}": completed, "{total}": batch.rows.length }).text,
				icon: allCompleted ? Icons.Checkmark : Icons.InfoFilled,
				type: BannerType.SettingsInfo,
				buttons: [],
			}),
			this.renderRows(batch.rows),
		])
	}

	private renderRows(rows: MigrationMailboxRowView[]): Children {
		return m(".mt-8", { style: { display: "grid", "grid-template-columns": GRID_COLUMNS } }, [
			m(".b.small.pb-8", { style: { display: "grid", "grid-template-columns": "subgrid", "grid-column": "1 / 5", color: theme.on_surface_variant } }, [
				m("div", lang.getTranslationText("migrationColumnUser_label")),
				m("div", lang.getTranslationText("migrationColumnTutaAddress_label")),
				m("div", lang.getTranslationText("migrationColumnStatus_label")),
				m("div", lang.getTranslationText("migrationColumnPassword_label")),
			]),
			rows.map((row) => this.renderRow(row)),
		])
	}

	private renderRow(row: MigrationMailboxRowView): Children {
		const revealed = this.revealedPasswords.has(row.mailAddress)
		return m(
			".items-center.mt-4",
			{
				style: {
					display: "grid",
					"grid-template-columns": "subgrid",
					"grid-column": "1 / 5",
					padding: "8px 12px",
					"border-radius": "10px",
					background: theme.surface,
				},
			},
			[
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
									if (revealed) {
										this.revealedPasswords.delete(row.mailAddress)
									} else {
										this.revealedPasswords.add(row.mailAddress)
									}
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

	private renderWizard(): Children {
		if (this.wizard == null || this.wizardData == null) return null

		return [
			m(
				".flex-end",
				m(TertiaryButton, {
					label: "cancel_action",
					onclick: () => {
						this.closeWizard()
						m.redraw()
					},
				}),
			),
			m(this.wizard, {
				steps: migrationWizardSteps,
				viewModel: this.wizardData,
				layout: MigrationWizardLayout,
				onComplete: () => {
					this.closeWizard()
					this.reload()
				},
			}),
		]
	}

	private closeWizard(): void {
		this.showWizard = false
		this.wizard = null
		this.wizardData = null
	}

	async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (
				isUpdateForTypeRef(CustomerMigrationInformationTypeRef, update) ||
				isUpdateForTypeRef(MailboxMigrationInformationTypeRef, update) ||
				isUpdateForTypeRef(ImapAccountSyncStateTypeRef, update)
			) {
				await this.reload()
				return
			}
		}
	}
}

async function loadMigrationBatches(): Promise<MigrationBatchView[]> {
	const customerInfo = await mailLocator.logins.getUserController().loadCustomerInfo()
	if (customerInfo.migrationInfos == null) return []

	const batches: CustomerMigrationInformation[] = await mailLocator.entityClient.loadAll(CustomerMigrationInformationTypeRef, customerInfo.migrationInfos)

	return await Promise.all(
		batches.map(async (batch) => {
			const mailboxInfos: MailboxMigrationInformation[] = await mailLocator.entityClient.loadAll(
				MailboxMigrationInformationTypeRef,
				batch.mailboxMigrationInformation,
			)
			return {
				id: batch._id,
				startedAt: generatedIdToTimestamp(batch._id[1]),
				rows: mailboxInfos.map((info) => ({
					name: info.name,
					mailAddress: info.mailAddress,
					status: info.status as CustomerMigrationMailboxInfoStatus,
					initialPassword: info.initialPassword,
				})),
			}
		}),
	)
}

async function downloadBatchCredentials(batch: MigrationBatchView): Promise<void> {
	const csv = renderCsv(
		["username", "tutaEmail", "password"],
		batch.rows.filter((row) => row.initialPassword).map((row) => [row.name, row.mailAddress, row.initialPassword ?? ""]),
		",",
	)
	const dataFile = createDataFile(`migration-credentials-${batch.startedAt}.csv`, "text/csv", stringToUtf8Uint8Array(csv))
	await mailLocator.fileController.saveDataFile(dataFile)
}

export default MigrationViewer
