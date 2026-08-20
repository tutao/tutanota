import m, { Children } from "mithril"
import { assertMainOrNode } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { lazy } from "@tutao/utils"
import { CustomerMigrationController } from "./CustomerMigrationController"
import { TitleSection } from "../../../../ui/TitleSection"
import { Icons } from "../../../../ui/base/icons/Icons"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { BannerType, InfoBanner } from "../../../../ui/base/InfoBanner"
import { PrimaryButton, TertiaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { ExpanderButton, ExpanderPanel } from "../../../../ui/base/Expander"
import { theme } from "../../../../ui/theme"
import { formatDate } from "../../../../ui/utils/Formatter"
import { Dialog } from "../../../../ui/base/Dialog"
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
import { CustomerMigrationInfoStatus, CustomerMigrationMailboxInfoStatus } from "../../../../entities/tutanota/Utils"
import { MigrationMailboxTable } from "./MigrationMailboxTable"
import { MigrationMailboxRowView } from "./MigrationMailboxTableRow"

assertMainOrNode()

type MigrationBatchView = {
	id: IdTuple
	status: CustomerMigrationInfoStatus
	startedAt: number
	rows: MigrationMailboxRowView[]
}

const ACTIVE_MIGRATION_STATUSES: ReadonlySet<CustomerMigrationInfoStatus> = new Set([
	CustomerMigrationInfoStatus.CREATED,
	CustomerMigrationInfoStatus.RUNNING,
	CustomerMigrationInfoStatus.FINISHING_MIGRATION,
])

class MigrationViewer implements UpdatableSettingsViewer {
	private showWizard = false
	private loading = true
	private batches: MigrationBatchView[] = []
	private wizard: ReturnType<typeof createMigrationWizard> | null = null
	private wizardData: MultiUserMigrationData | null = null
	private showPastMigrations = false

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
			".fill-absolute.scroll.plr-24.pb-48.gap-16",
			{
				style: {
					backgroundColor: theme.surface_container,
					display: "flex",
					flexDirection: "column",
				},
			},
			this.showWizard ? this.renderWizard() : this.renderOverview(),
		)
	}

	private renderOverview(): Children {
		const activeBatch = this.batches.find((batch) => ACTIVE_MIGRATION_STATUSES.has(batch.status))
		const pastBatches = this.batches.filter((batch) => !ACTIVE_MIGRATION_STATUSES.has(batch.status))

		return [
			m(TitleSection, {
				icon: Icons.SimpleArrowRight,
				title: lang.getTranslationText("migrationSetup_title"),
				subTitle: lang.getTranslationText("migrationMultiUserDescription_msg"),
			}),
			this.loading
				? null
				: activeBatch == null
					? m(InfoBanner, {
							message: "migrationNoSynchronizationActive_msg",
							icon: Icons.InfoFilled,
							type: BannerType.SettingsInfo,
							buttons: [],
						})
					: this.renderBatch(activeBatch),
			m(".flex-end.mt-8", activeBatch == null ? this.renderStartButton() : this.renderActiveMigrationButtons(activeBatch)),
			pastBatches.length > 0 ? this.renderPastMigrations(pastBatches) : null,
		]
	}

	private renderStartButton(): Children {
		return m(PrimaryButton, {
			width: "flex",
			label: "migrationAddSynchronization_action",
			onclick: () => {
				this.wizard = createMigrationWizard()
				this.wizardData = newMultiUserMigrationData()
				this.showWizard = true
				m.redraw()
			},
		})
	}

	private renderActiveMigrationButtons(activeBatch: MigrationBatchView): Children {
		return m(".flex.gap-16", [
			m(TertiaryButton, {
				width: "flex",
				label: "migrationCancel_action",
				onclick: () => this.onCancelMigration(activeBatch),
			}),
			m(PrimaryButton, {
				width: "flex",
				label: "migrationFinish_action",
				onclick: async () => {
					const customerMigrationInformation = await mailLocator.entityClient.load(CustomerMigrationInformationTypeRef, activeBatch.id)
					customerMigrationInformation.status = CustomerMigrationInfoStatus.FINISHING_MIGRATION
					await mailLocator.entityClient.update(customerMigrationInformation)
					await this.reload()
				},
			}),
		])
	}

	private async onCancelMigration(batch: MigrationBatchView): Promise<void> {
		const confirmed = await Dialog.confirm("migrationCancelConfirm_msg")
		if (!confirmed) return
		await this.customerMigrationController().cancelMigration(batch.id)
		await this.reload()
	}

	private renderPastMigrations(pastBatches: ReadonlyArray<MigrationBatchView>): Children {
		return m(".mt-16", [
			m(ExpanderButton, {
				label: "migrationPastMigrations_label",
				expanded: this.showPastMigrations,
				onExpandedChange: (value) => {
					this.showPastMigrations = value
				},
			}),
			m(
				ExpanderPanel,
				{ expanded: this.showPastMigrations },
				pastBatches.map((batch) => this.renderBatch(batch)),
			),
		])
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
							onclick: () => downloadCredentials(batch.rows, batch.startedAt),
						})
					: null,
			]),
			m(InfoBanner, {
				message: () => lang.getTranslation("migrationAccountsCompleted_label", { "{count}": completed, "{total}": batch.rows.length }).text,
				icon: allCompleted ? Icons.Checkmark : Icons.InfoFilled,
				type: BannerType.SettingsInfo,
				buttons: [],
			}),
			m(MigrationMailboxTable, {
				rows: batch.rows,
				onDownloadSelectedCredentials: (rows) => downloadCredentials(rows, batch.startedAt),
			}),
		])
	}

	private renderWizard(): Children {
		if (this.wizard == null || this.wizardData == null) return null

		return [
			m(TertiaryButton, {
				label: "cancel_action",
				onclick: () => {
					this.closeWizard()
					m.redraw()
				},
			}),
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
				status: batch.status as CustomerMigrationInfoStatus,
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

async function downloadCredentials(rows: ReadonlyArray<MigrationMailboxRowView>, startedAt: number): Promise<void> {
	const csv = renderCsv(
		["username", "tutaEmail", "password"],
		rows.filter((row) => row.initialPassword).map((row) => [row.name, row.mailAddress, row.initialPassword ?? ""]),
		",",
	)
	const dataFile = createDataFile(`migration-credentials-${startedAt}.csv`, "text/csv", stringToUtf8Uint8Array(csv))
	await mailLocator.fileController.saveDataFile(dataFile)
}

export default MigrationViewer
