import m, { Children } from "mithril"
import { EnvProvider } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces"
import { EntityUpdateData } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { lazy } from "@tutao/utils"
import { CustomerMigrationController, MigrationBatchView } from "./CustomerMigrationController"
import { TitleSection } from "../../../../ui/TitleSection"
import { Icons } from "../../../../ui/base/icons/Icons"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { BannerType, InfoBanner } from "../../../../ui/base/InfoBanner"
import { PrimaryButton, TertiaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { ExpanderButton, ExpanderPanel } from "../../../../ui/base/Expander"
import { Dialog } from "../../../../ui/base/Dialog"
import { renderCsv, stringToUtf8Uint8Array } from "../../../../platform-kit/utils"
import { createDataFile } from "../../../common/api/worker/utils/DataFile"
import { mailLocator } from "../../mailLocator"
import { createMigrationWizard, migrationWizardSteps, MultiUserMigrationData, newMultiUserMigrationData } from "./AddMultiUserMigrationWizard"
import { MigrationWizardLayout } from "./MigrationWizardLayout"
import { CustomerMailboxMigrationInfoStatus, CustomerMigrationInfoStatus } from "../../../../entities/tutanota/Utils"
import { MigrationMailboxTable } from "./MigrationMailboxTable"
import { MigrationMailboxRowView } from "./MigrationMailboxTableRow"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { MigrationErrorCause } from "../../../common/api/common/error/MigrationError"
import { migrationErrorCauseToReadableMigrationError } from "./MigrationErrorHandler"

EnvProvider.assertMainOrNode()

const ACTIVE_MIGRATION_STATUSES: ReadonlySet<CustomerMigrationInfoStatus> = new Set([
	CustomerMigrationInfoStatus.CREATED,
	CustomerMigrationInfoStatus.RUNNING,
	CustomerMigrationInfoStatus.FINISHING_MIGRATION,
])

class MigrationViewer implements UpdatableSettingsViewer {
	private showWizard = false
	private wizard: ReturnType<typeof createMigrationWizard> | null = null
	private wizardData: MultiUserMigrationData | null = null
	private showPastMigrations = false

	constructor(private readonly customerMigrationController: lazy<CustomerMigrationController>) {}

	async oninit() {
		await this.customerMigrationController().init()
	}

	view(): Children {
		return m(".fill-absolute.scroll.plr-24.pb-48.gap-16.flex.flex-column.nav-bg", this.showWizard ? this.renderWizard() : this.renderOverview())
	}

	private renderOverview(): Children {
		const batches = this.customerMigrationController().batches
		const activeBatch = batches.find((batch) => ACTIVE_MIGRATION_STATUSES.has(batch.status))
		const pastBatches = batches.filter((batch) => !ACTIVE_MIGRATION_STATUSES.has(batch.status))
		return [
			m(TitleSection, {
				icon: Icons.SimpleArrowRight,
				title: lang.getTranslationText("migrationSetup_title"),
				subTitle: lang.getTranslationText("migrationMultiUserDescription_msg"),
			}),
			this.customerMigrationController().loading
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
			activeBatch.status !== CustomerMigrationInfoStatus.FINISHING_MIGRATION
				? m(PrimaryButton, {
						width: "flex",
						label: "migrationFinish_action",
						onclick: () => showProgressDialog("migrationFinishing_msg", this.customerMigrationController().finishMigration(activeBatch.id)),
					})
				: m(PrimaryButton, {
						width: "flex",
						label: "migrationComplete_action",
						onclick: async () => {
							if (this.customerMigrationController().batchAllMailboxesCompleted(activeBatch)) {
								await showProgressDialog("migrationCompleting_msg", this.customerMigrationController().completeMigration(activeBatch.id))
							} else {
								Dialog.message("migrationNotAllMailboxesCompleteYet_msg")
							}
						},
					}),
		])
	}

	private async onCancelMigration(batch: MigrationBatchView): Promise<void> {
		const confirmed = await Dialog.confirm("migrationCancelConfirm_msg")
		if (!confirmed) return
		await this.customerMigrationController().cancelMigration(batch.id)
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
		const completed = batch.rows.filter((row) => row.status === CustomerMailboxMigrationInfoStatus.COMPLETED_SUCCESSFULLY).length
		const allCompleted = batch.rows.length > 0 && completed === batch.rows.length
		const hasCredentials = batch.rows.some((row) => row.initialPassword)

		return m(".mt-16", [
			m(".flex.items-center.justify-between", [
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
					this.customerMigrationController().refresh()
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
		// no-op: CustomerMigrationController listens for the relevant entity updates itself and refreshes its own state.
	}
}

async function downloadCredentials(rows: ReadonlyArray<MigrationMailboxRowView>, startedAt: number): Promise<void> {
	const exportedRows = rows.filter((row) => row.initialPassword || row.status === CustomerMailboxMigrationInfoStatus.ERROR)
	const hasErrors = exportedRows.some((row) => row.status === CustomerMailboxMigrationInfoStatus.ERROR)

	const header = hasErrors ? ["username", "tutaEmail", "password", "error"] : ["username", "tutaEmail", "password"]
	const body = exportedRows.map((row) => {
		const line = [row.name, row.mailAddress, row.initialPassword ?? ""]
		if (hasErrors) {
			line.push(row.status === CustomerMailboxMigrationInfoStatus.ERROR && row.errorCode != null ? errorCodeToMessage(row.errorCode) : "")
		}
		return line
	})

	const csv = renderCsv(header, body, ",")
	const dataFile = createDataFile(`migration-credentials-${startedAt}.csv`, "text/csv", stringToUtf8Uint8Array(csv))
	await mailLocator.fileController.saveDataFile(dataFile)
}

function errorCodeToMessage(errorCode: string): string {
	return migrationErrorCauseToReadableMigrationError(parseInt(errorCode) as MigrationErrorCause).errorMessage
}

export default MigrationViewer
