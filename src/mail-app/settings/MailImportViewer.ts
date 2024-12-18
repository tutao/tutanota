import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import m, { Children } from "mithril"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils"
import { IconButton, IconButtonAttrs } from "../../common/gui/base/IconButton"
import { ButtonSize } from "../../common/gui/base/ButtonSize"
import { assertNotNull, first } from "@tutao/tutanota-utils"
import { getFolderName, getIndentedFolderNameForDropdown, getPathToFolderString } from "../mail/model/MailUtils"
import { HighestTierPlans, MailSetKind, PlanType } from "../../common/api/common/TutanotaConstants"
import { FolderSystem, IndentedFolder } from "../../common/api/common/mail/FolderSystem"
import { lang, TranslationKey } from "../../common/misc/LanguageViewModel"
import { ImportStatus, isFinalisedImportStatus, MailImporter } from "../mail/import/MailImporter.js"
import { ImportMailStateTypeRef, MailFolder } from "../../common/api/entities/tutanota/TypeRefs"
import { isSameId, sortCompareByReverseId } from "../../common/api/common/utils/EntityUtils"
import { isDesktop } from "../../common/api/common/Env"
import { ExternalLink } from "../../common/gui/base/ExternalLink"
import { EntityClient } from "../../common/api/common/EntityClient.js"
import { LoginController } from "../../common/api/main/LoginController.js"
import { NativeFileApp } from "../../common/native/common/FileApp.js"
import { Icons } from "../../common/gui/base/icons/Icons.js"
import { Button, ButtonType } from "../../common/gui/base/Button.js"
import { DropDownSelector, SelectorItemList } from "../../common/gui/base/DropDownSelector.js"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs.js"
import { ProgressBar } from "../../common/gui/base/ProgressBar.js"
import { ExpanderButton, ExpanderPanel } from "../../common/gui/base/Expander.js"
import { ColumnWidth, Table, TableLineAttrs } from "../../common/gui/base/Table.js"
import { LocalImportMailState } from "../../common/native/common/generatedipc/LocalImportMailState.js"
import { mailLocator } from "../mailLocator.js"

/**
 * Settings viewer for mail import.
 */
export class MailImportViewer implements UpdatableSettingsViewer {
	private foldersForMailbox: FolderSystem | undefined
	private selectedTargetFolder: MailFolder | null = null
	private isImportHistoryExpanded: boolean = false

	private mailImporter: MailImporter
	private entityClient: EntityClient
	private fileApp: NativeFileApp | null

	constructor(mailImporter: MailImporter, entityClient: EntityClient, loginController: LoginController, fileApp: NativeFileApp | null) {
		this.mailImporter = mailImporter
		this.entityClient = entityClient
		this.fileApp = fileApp
	}

	async oninit(): Promise<void> {
		await this.mailImporter.initImportMailStates()
		let mailboxDetail = first(await this.mailImporter.mailboxModel.getMailboxDetails())
		if (mailboxDetail) {
			this.foldersForMailbox = this.getFoldersForMailGroup(mailboxDetail.mailGroup._id)
			this.selectedTargetFolder = this.foldersForMailbox.getSystemFolderByType(MailSetKind.INBOX)
		}
	}

	view(): Children {
		let activeImport = isDesktop() ? this.mailImporter.getActiveImport() : null

		return m(
			".fill-absolute.scroll.plr-l.pb-xl",
			m(".h4.mt-l", lang.get("mailImportSettings_label")),
			isDesktop()
				? [
						this.renderTargetFolderControls(),
						!activeImport ? this.renderStartNewMailImportControls() : null,
						activeImport ? this.renderImportMailStatus(activeImport) : null,
						this.renderMailImportHistory(),
				  ]
				: [this.renderNoImportOnWebText()],
		)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImportMailStateTypeRef, update)) {
				const updatedState = await this.entityClient.load(ImportMailStateTypeRef, [update.instanceListId, update.instanceId])
				if (isFinalisedImportStatus(parseInt(updatedState.status))) {
					this.mailImporter.removeActiveImport(update.instanceId)
					this.mailImporter.updateFinalisedImport(update.instanceId, updatedState)
					m.redraw()
				}
			}
		}
	}

	private async onImportButtonClick(dom: HTMLElement) {
		const currentPlanType = await mailLocator.logins.getUserController().getPlanType()
		const isHighestTierPlan = HighestTierPlans.includes(currentPlanType)
		if (!isHighestTierPlan) {
			showNotAvailableForFreeDialog([PlanType.Legend, PlanType.Unlimited])
			return
		}

		const allowedExtensions = ["eml", "mbox"]
		const filePaths = await assertNotNull(this.fileApp).openFileChooser(dom.getBoundingClientRect(), allowedExtensions, true)
		if (this.selectedTargetFolder) {
			await this.mailImporter.importFromFiles(
				this.selectedTargetFolder,
				filePaths.map((fp) => fp.location),
			)
		}
	}

	private renderNoImportOnWebText() {
		return [
			// FIXME: download links for the tuta desktop client
			m(
				"p",
				"Please download our desktop client to get started with the Email Import." + " ",
				m(ExternalLink, {
					href: "https://tuta.com/#download",
					isCompanySite: true,
				}),
			),
		]
	}

	private renderTargetFolderControls() {
		let isImportRunning = this.mailImporter.getActiveImport() != null
		let folders = this.foldersForMailbox
		if (folders) {
			const loadingMsg = lang.get("loading_msg")
			let targetFolders: SelectorItemList<MailFolder | null> = folders.getIndentedList().map((folderInfo: IndentedFolder) => {
				return {
					name: getIndentedFolderNameForDropdown(folderInfo),
					value: folderInfo.folder,
				}
			})
			return m(DropDownSelector, {
				label: "mailImportTargetFolder_label",
				items: targetFolders,
				disabled: isImportRunning,
				selectedValue: this.selectedTargetFolder,
				selectedValueDisplay: this.selectedTargetFolder ? getFolderName(this.selectedTargetFolder) : loadingMsg,
				selectionChangedHandler: (newFolder: MailFolder | null) => (this.selectedTargetFolder = newFolder),
				helpLabel: () => (this.selectedTargetFolder ? getPathToFolderString(folders!, this.selectedTargetFolder) : ""),
			})
		} else {
			return null
		}
	}

	private renderStartNewMailImportControls() {
		return [
			m(
				".flex-end",
				m(Button, {
					type: ButtonType.Secondary,
					label: "import_action",
					click: (_, dom) => this.onImportButtonClick(dom),
				}),
			),
			m(".flex-end", this.renderImportInfoText()),
		]
	}

	private renderImportInfoText() {
		return [m(".small", "You can import EML or MBOX files.")]
	}

	private renderImportMailStatus(activeImport: LocalImportMailState) {
		const successfulMailsCountLabel = m(
			".p",
			lang.get("mailImportStateSuccessfulMails_label", {
				"{successfulMails}": activeImport.successfulMails,
			}),
		)
		const failedMailsCountLabel = m(
			".p",
			lang.get("mailImportStateFailedMails_label", {
				"{failedMails}": activeImport.failedMails,
			}),
		)
		const continueMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "continueMailImport_action",
			icon: Icons.Play,
			click: () => {},
			size: ButtonSize.Normal,
		}
		const pauseMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "pauseMailImport_action",
			icon: Icons.Pause,
			click: () => {},
			size: ButtonSize.Normal,
		}
		const cancelMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "cancelMailImport_action",
			icon: Icons.Cancel,
			click: () => {
				this.mailImporter.stopImport(activeImport.importMailStateElementId)
			},
			size: ButtonSize.Normal,
		}

		let importStatus = activeImport ? activeImport.status : ImportStatus.Running

		let buttonControls = []
		if (importStatus == ImportStatus.Running) {
			buttonControls.push(m(IconButton, pauseMailImportIconButtonAttrs))
			buttonControls.push(m(IconButton, cancelMailImportIconButtonAttrs))
		} else if (importStatus == ImportStatus.Paused) {
			buttonControls.push(m(IconButton, continueMailImportIconButtonAttrs))
			buttonControls.push(m(IconButton, cancelMailImportIconButtonAttrs))
		}

		let statusLabels = []
		statusLabels.push(successfulMailsCountLabel)
		if (Number(activeImport.failedMails) > 0) {
			statusLabels.push(failedMailsCountLabel)
		}

		return [
			m(".flex-start.row", [m(".h5", getReadableImportMailStatus(importStatus)), statusLabels]),
			[m(".flex-start.rel.full-width", this.renderMailImportProgressBar()), m(".flex-end", [buttonControls])],
		]
	}

	private renderMailImportProgressBar() {
		return m(".rel.header-bg.full-width", m(ProgressBar, { progress: this.mailImporter.getProgress() }))
	}

	private renderMailImportHistory() {
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get("mailImportHistory_label")),
				m(ExpanderButton, {
					label: "show_action",
					expanded: this.isImportHistoryExpanded,
					onExpandedChange: () => {
						this.isImportHistoryExpanded = !this.isImportHistoryExpanded
					},
				}),
			]),
			m(
				ExpanderPanel,
				{
					expanded: this.isImportHistoryExpanded,
				},
				m(Table, {
					columnHeading: ["state_label", "mailImportTargetFolder_label"],
					columnWidths: [ColumnWidth.Small, ColumnWidth.Largest],
					showActionButtonColumn: true,
					lines: this.makeMailImportHistoryTableLines(),
				}),
			),
		]
	}

	/**
	 * Parses the importMailStates into displayable table lines.
	 * @returns array of the parsed table lines.
	 */
	private makeMailImportHistoryTableLines(): Array<TableLineAttrs> {
		let folders = this.foldersForMailbox?.getIndentedList()
		if (folders) {
			return this.mailImporter
				.getFinalisedImports()
				.sort(sortCompareByReverseId)
				.map((im) => {
					const targetFolderId = im.targetFolder
					const displayTargetFolder = folders!.find((f) => isSameId(f.folder._id, targetFolderId))

					return {
						cells: () => [
							{
								main: `${lang.get(getImportMailStatusTranslationKey(parseInt(im.status)))}`,
								info: [`Imported: ${im.successfulMails}`, `Failed: ${im.failedMails}`],
							},
							{ main: displayTargetFolder ? getFolderName(displayTargetFolder.folder) : "folder deleted" },
						],
					}
				})
		} else {
			return []
		}
	}

	private getFoldersForMailGroup(mailGroupId: Id): FolderSystem {
		if (mailGroupId) {
			const folderSystem = this.mailImporter.mailModel.getFolderSystemByGroupId(mailGroupId)
			if (folderSystem) {
				return folderSystem
			}
		}
		throw new Error("could not load folder list")
	}
}

export function getReadableImportMailStatus(importStatus: ImportStatus): string {
	return lang.get(getImportMailStatusTranslationKey(importStatus))
}

export function getImportMailStatusTranslationKey(status: ImportStatus): TranslationKey {
	switch (status) {
		case ImportStatus.Running:
			return "mailImportStatusRunning_label"
		case ImportStatus.Canceled:
			return "mailImportStatusCanceled_label"
		case ImportStatus.Finished:
			return "mailImportStatusFinished_label"
		case ImportStatus.Starting:
			return "mailImportStatusStarting_label"
		case ImportStatus.Canceling:
			return "mailImportStatusCancelling_label"
		case ImportStatus.Finishing:
			return "mailImportStatusFinished_label"
		case ImportStatus.Paused:
			return "mailImportStatusPaused_label"
	}
}
