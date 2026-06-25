import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import m, { Children } from "mithril"
import { IconButton, IconButtonAttrs } from "../../../ui/base/IconButton"
import { ButtonSize } from "../../../ui/base/ButtonSize"
import { assertNotNull, lazy } from "../../../platform-kit/utils"
import { getFolderName, getIndentedFolderNameForDropdown, getPathToFolderString } from "../mail/model/MailUtils"
import { UpgradePromptType } from "../../../platform-kit/app-env"
import { IndentedFolder } from "../../common/api/common/mail/FolderSystem"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { FileMailImportController, UiImportStatus } from "../mail/import/FileMailImportController.js"
import { Icons } from "../../../ui/base/icons/Icons.js"
import { DropDownSelector, type DropDownSelectorAttrs, SelectorItemList } from "../../../ui/base/DropDownSelector.js"
import { showUpgradeWizardOrSwitchSubscriptionDialog } from "../../common/misc/SubscriptionDialogs.js"
import { ProgressBar, ProgressBarType } from "../../../ui/base/ProgressBar.js"
import { ExpanderButton, ExpanderPanel } from "../../../ui/base/Expander.js"
import { ColumnWidth, Table, TableLineAttrs } from "../../../ui/base/Table.js"
import { mailLocator } from "../mailLocator.js"
import { formatDate } from "../../../ui/utils/Formatter.js"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons.js"
import { getMailboxName } from "../../common/mailFunctionality/SharedMailUtils"
import { MailboxDetail } from "../../common/mailFunctionality/MailboxModel"
import { MailSet } from "@tutao/entities/tutanota"
import { FileImportStatus, MailSetKind } from "../../../entities/tutanota/Utils"
import { AvailablePlanType, HighestTierPlans, isHighestTierPlan } from "../../../entities/sys/Utils"
import { elementIdPart, EntityIdEncoding, generatedIdToTimestamp, isSameId, sortCompareByReverseId } from "../../../platform-kit/meta"
import { EntityUpdateData } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { client } from "../../../platform-kit/app-env/boot/ClientDetector"

/**
 * Settings viewer for mail import rendered only in the Desktop client.
 * See {@link WebMailImportSettingsViewer} for other views.
 */
export class DesktopMailImportSettingsViewer implements UpdatableSettingsViewer {
	private mailboxIdToImportHistoryExpanded: Map<Id, boolean> = new Map<Id, boolean>()

	constructor(private readonly fileMailImportController: lazy<FileMailImportController>) {}

	async oninit(): Promise<void> {
		await this.fileMailImportController().initImportMailStates()

		const mailboxDetails = this.fileMailImportController().mailboxDetails
		if (mailboxDetails) {
			const isSingleMailbox = mailboxDetails.length === 1
			for (const detail of mailboxDetails) {
				this.mailboxIdToImportHistoryExpanded.set(detail.mailbox._id, isSingleMailbox)
			}
		}
	}

	view(): Children {
		return m(".fill-absolute.scroll.plr-24.pb-48", [
			m(".h4.mt-32", lang.get("mailImportSettings_label")),
			this.renderMailboxSelectionControls(),
			this.renderTargetFolderControls(),
			!this.fileMailImportController().shouldRenderImportStatus() ? this.renderStartNewImportControls() : null,
			this.fileMailImportController().shouldRenderImportStatus() ? this.renderImportStatus() : null,
			this.renderImportHistories(),
		])
	}

	private async onImportButtonClick(dom: HTMLElement) {
		const userController = mailLocator.logins.getUserController()
		const currentPlanType = await userController.getPlanType()
		if (!isHighestTierPlan(currentPlanType)) {
			await showUpgradeWizardOrSwitchSubscriptionDialog(UpgradePromptType.IMPORT, userController, HighestTierPlans as readonly AvailablePlanType[])
			return
		}

		const allowedExtensions = ["eml", "mbox"]
		const fileUris = client.isMacOS
			? await mailLocator.fileApp.openMacImportFileChooser()
			: await mailLocator.fileApp.openFileChooser(dom.getBoundingClientRect(), allowedExtensions, true)
		await this.fileMailImportController().onStartBtnClick(fileUris.map((fp) => fp.location))
	}

	private renderMailboxSelectionControls() {
		const mailboxesDetails = this.fileMailImportController().mailboxDetails
		if (mailboxesDetails && mailboxesDetails.length > 1) {
			return m(DropDownSelector, {
				label: "mailboxToImport_label",
				items: mailboxesDetails.map((mailboxDetail) => {
					return { name: getMailboxName(mailLocator.logins, mailboxDetail), value: mailboxDetail }
				}),
				selectedValue: this.fileMailImportController().selectedMailBoxDetail,
				selectionChangedHandler: (selectedMailboxDetail) => {
					this.fileMailImportController().onNewMailboxSelected(selectedMailboxDetail)
				},
				dropdownWidth: 300,
				disabled: this.fileMailImportController().shouldRenderImportStatus(),
				helpLabel: () => null,
			} satisfies DropDownSelectorAttrs<MailboxDetail>)
		}
		return null
	}

	private renderTargetFolderControls() {
		let selectedMailboxDetail = this.fileMailImportController().selectedMailBoxDetail
		if (!selectedMailboxDetail) {
			return null
		}

		const mailboxId = selectedMailboxDetail?.mailbox._id
		let folders = this.fileMailImportController().mailboxToFolders.get(mailboxId)
		if (!folders) {
			return null
		}

		const loadingMsg = lang.get("loading_msg")
		const emptyLabel = m("br")
		const selectedTargetFolder = this.fileMailImportController().selectedTargetFolder
		const selectedTargetFolderPath = selectedTargetFolder ? getPathToFolderString(folders, selectedTargetFolder) : ""
		const isNotSubfolder = selectedTargetFolder ? selectedTargetFolderPath === getFolderName(selectedTargetFolder) : true
		let helpLabel = selectedTargetFolder ? (isNotSubfolder ? emptyLabel : selectedTargetFolderPath) : emptyLabel
		if (helpLabel === "") {
			helpLabel = emptyLabel
		}

		// do not allow importing to inbox folder,
		// problem:
		// if a folder receives/imports a very large amount of mails (hundreds of thousands) that all get moved/deleted at once,
		// the backend will not be able to read any live data from that list for a while.
		// if that happens, user will not see incoming mails in their inbox folder for that time,
		// this problem can still happen on other mailSets,
		// but at least we won't block inbox ( incoming new mails )
		const selectableFolders = folders
			.getIndentedList()
			.filter((folderInfo) => folderInfo.folder.folderType !== MailSetKind.INBOX && folderInfo.folder.folderType !== MailSetKind.SCHEDULED)

		let targetFolders: SelectorItemList<MailSet | null> = selectableFolders.map((folderInfo: IndentedFolder) => {
			return {
				name: getIndentedFolderNameForDropdown(folderInfo),
				value: folderInfo.folder,
			}
		})
		return m(DropDownSelector, {
			label: "mailImportTargetFolder_label",
			items: targetFolders,
			disabled: this.fileMailImportController().shouldRenderImportStatus(),
			selectedValue: selectedTargetFolder,
			selectedValueDisplay: selectedTargetFolder ? getFolderName(selectedTargetFolder) : loadingMsg,
			selectionChangedHandler: (newFolder: MailSet | null) => (this.fileMailImportController().selectedTargetFolder = newFolder),
			helpLabel: () => helpLabel,
		})
	}

	private renderStartNewImportControls() {
		return [
			m(".flex-start.mt-12", this.renderImportInfoText()),
			m(
				".flex-start.mt-8",
				m(PrimaryButton, {
					width: "flex",
					label: "import_action",
					onclick: (_, dom) => this.onImportButtonClick(dom),
				}),
			),
		]
	}

	private renderImportInfoText() {
		return [m(".small", lang.get("mailImportInfoText_label"))]
	}

	private renderImportStatus() {
		const processedMailsCountLabel = m(
			".flex-start.p.small",
			lang.get("mailImportStateProcessedMailsTotalMails_label", {
				"{processedMails}": this.fileMailImportController().getProcessedMailsCount(),
				"{totalMails}": this.fileMailImportController().getTotalMailsCount(),
			}),
		)
		const resumeMailImportIconButtonAttrs: IconButtonAttrs = {
			label: "resumeMailImport_action",
			icon: Icons.PlayOutline,
			click: () => this.fileMailImportController().onResumeBtnClick(),
			size: ButtonSize.Normal,
			hidden: this.fileMailImportController().shouldDisableResumeButton(),
		}
		const pauseMailImportIconButtonAttrs: IconButtonAttrs = {
			label: "pauseMailImport_action",
			icon: Icons.PauseOutline,
			click: () => {
				this.fileMailImportController().onPauseBtnClick()
			},
			size: ButtonSize.Normal,
			hidden: this.fileMailImportController().shouldDisablePauseButton(),
		}
		const cancelMailImportIconButtonAttrs: IconButtonAttrs = {
			label: "cancelMailImport_action",
			icon: Icons.X,
			click: () => {
				this.fileMailImportController().onCancelBtnClick()
			},
			size: ButtonSize.Normal,
			hidden: this.fileMailImportController().shouldDisableCancelButton(),
		}

		let buttonControls = []
		if (this.fileMailImportController().shouldRenderPauseButton()) {
			buttonControls.push(m(IconButton, pauseMailImportIconButtonAttrs))
		}
		if (this.fileMailImportController().shouldRenderResumeButton()) {
			buttonControls.push(m(IconButton, resumeMailImportIconButtonAttrs))
		}
		if (this.fileMailImportController().shouldRenderCancelButton()) {
			buttonControls.push(m(IconButton, cancelMailImportIconButtonAttrs))
		}

		return [
			[
				m(
					".flex-space-between.p.small.mt-12",
					getReadableUiImportStatus(assertNotNull(this.fileMailImportController().getUiStatus())),
					this.fileMailImportController().shouldRenderProcessedMails() ? processedMailsCountLabel : null,
				),
			],
			[m(".flex-space-between.border-radius-12.mt-8.rel.nav-bg.full-width", this.renderMailImportProgressBar(), ...buttonControls)],
		]
	}

	private renderMailImportProgressBar() {
		// the ProgressBar uses progress values 0 ... 1
		return m(
			".rel.border-radius-12.full-width",
			m(ProgressBar, {
				progress: this.fileMailImportController().getProgress() / 100,
				type: ProgressBarType.Large,
			}),
		)
	}

	private renderImportHistories() {
		const mailboxDetails = this.fileMailImportController().mailboxDetails
		if (mailboxDetails) {
			return m(
				".mt-32.mb-16",
				mailboxDetails.map((details) => this.renderImportHistory(details, mailboxDetails.length <= 1)),
			)
		}
		return null
	}

	private renderImportHistory(mailboxDetail: MailboxDetail, isSingleMailbox: boolean) {
		const mailboxLabel = isSingleMailbox ? "" : " · " + getMailboxName(mailLocator.logins, mailboxDetail)
		const mailboxId = mailboxDetail.mailbox._id
		return [
			m(".flex-space-between.items-center.mt-4.mb-4", [
				m(".h5", lang.getTranslation("mailImportHistory_label").text + mailboxLabel),
				m(ExpanderButton, {
					label: "show_action",
					expanded: this.mailboxIdToImportHistoryExpanded.get(mailboxId) || false,
					onExpandedChange: () => {
						this.mailboxIdToImportHistoryExpanded.set(mailboxId, !this.mailboxIdToImportHistoryExpanded.get(mailboxId))
					},
				}),
			]),
			m(
				ExpanderPanel,
				{
					expanded: this.mailboxIdToImportHistoryExpanded.get(mailboxId) || false,
				},
				m(Table, {
					columnHeading: ["mailImportHistoryTableHeading_label"],
					columnWidths: [ColumnWidth.Small, ColumnWidth.Largest],
					showActionButtonColumn: true,
					lines: this.makeMailImportHistoryTableLines(mailboxId),
				}),
			),
		]
	}

	/**
	 * Parses the importMailStates into displayable table lines.
	 * @returns array of the parsed table lines.
	 */
	private makeMailImportHistoryTableLines(mailboxId: Id): Array<TableLineAttrs> {
		let folders = this.fileMailImportController().mailboxToFolders?.get(mailboxId)?.getIndentedList()
		if (folders) {
			return this.fileMailImportController()
				.getFinalisedImports(mailboxId)
				.sort((a, b) => sortCompareByReverseId(a, b, EntityIdEncoding.Base64Ext))
				.map((im) => {
					const targetFolderId = im.targetFolder
					const displayTargetFolder = folders!.find((f) => isSameId(f.folder._id, targetFolderId))

					return {
						cells: () => [
							{
								main: lang.get("mailImportHistoryTableRowTitle_label", {
									"{status}": getReadableImportStatus(parseInt(im.status) as FileImportStatus),
									"{folder}": displayTargetFolder
										? getFolderName(displayTargetFolder.folder)
										: lang.get("mailImportHistoryTableRowFolderDeleted_label"),
								}),
								info: [
									lang.get("mailImportHistoryTableRowSubtitle_label", {
										"{date}": formatDate(new Date(generatedIdToTimestamp(elementIdPart(im._id)))),
										"{successfulMails}": im.successfulMails,
										"{failedMails}": im.failedMails,
									}),
								],
							},
						],
					}
				})
		} else {
			return []
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {}
}

export function getReadableUiImportStatus(uiStatus: UiImportStatus): string {
	return lang.get(getUiImportStatusTranslationKey(uiStatus))
}

export function getUiImportStatusTranslationKey(uiStatus: UiImportStatus): TranslationKey {
	switch (uiStatus) {
		case UiImportStatus.Starting:
			return "mailImportStatusStarting_label"
		case UiImportStatus.Resuming:
			return "mailImportStatusResuming_label"
		case UiImportStatus.Running:
			return "mailImportStatusRunning_label"
		case UiImportStatus.Pausing:
			return "mailImportStatusPausing_label"
		case UiImportStatus.Paused:
			return "mailImportStatusPaused_label"
		case UiImportStatus.Cancelling:
			return "mailImportStatusCancelling_label"
	}
}

export function getReadableImportStatus(importStatus: FileImportStatus): string {
	return lang.get(getImportStatusTranslationKey(importStatus))
}

export function getImportStatusTranslationKey(importStatus: FileImportStatus): TranslationKey {
	switch (importStatus) {
		case FileImportStatus.Running:
			return "mailImportStatusRunning_label"
		case FileImportStatus.Paused:
			return "mailImportStatusPaused_label"
		case FileImportStatus.Canceled:
			return "mailImportStatusCanceled_label"
		case FileImportStatus.Finished:
			return "mailImportStatusFinished_label"
	}
}
