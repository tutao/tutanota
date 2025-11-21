import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import m, { Children } from "mithril"
import { EntityUpdateData } from "../../common/api/common/utils/EntityUpdateUtils"
import { IconButton, IconButtonAttrs } from "../../common/gui/base/IconButton"
import { ButtonSize } from "../../common/gui/base/ButtonSize"
import { assertNotNull, lazy } from "@tutao/tutanota-utils"
import { getFolderName, getIndentedFolderNameForDropdown, getPathToFolderString } from "../mail/model/MailUtils"
import { AvailablePlanType, HighestTierPlans, ImportStatus, MailSetKind } from "../../common/api/common/TutanotaConstants"
import { IndentedFolder } from "../../common/api/common/mail/FolderSystem"
import { lang, TranslationKey } from "../../common/misc/LanguageViewModel"
import { MailImporter, UiImportStatus } from "../mail/import/MailImporter.js"
import { MailFolder } from "../../common/api/entities/tutanota/TypeRefs"
import { elementIdPart, generatedIdToTimestamp, isSameId, sortCompareByReverseId } from "../../common/api/common/utils/EntityUtils"
import { Icons } from "../../common/gui/base/icons/Icons.js"
import { DropDownSelector, SelectorItemList } from "../../common/gui/base/DropDownSelector.js"
import { showUpgradeWizardOrSwitchSubscriptionDialog } from "../../common/misc/SubscriptionDialogs.js"
import { ProgressBar, ProgressBarType } from "../../common/gui/base/ProgressBar.js"
import { ExpanderButton, ExpanderPanel } from "../../common/gui/base/Expander.js"
import { ColumnWidth, Table, TableLineAttrs } from "../../common/gui/base/Table.js"
import { mailLocator } from "../mailLocator.js"
import { formatDate } from "../../common/misc/Formatter.js"
import { LoginButton, LoginButtonType } from "../../common/gui/base/buttons/LoginButton"
import { client } from "../../common/misc/ClientDetector"

/**
 * Settings viewer for mail import rendered only in the Desktop client.
 * See {@link WebMailImportSettingsViewer} for other views.
 */
export class DesktopMailImportSettingsViewer implements UpdatableSettingsViewer {
	private isImportHistoryExpanded: boolean = true
	private importStatePoolHandle: TimeoutID

	constructor(private readonly mailImporter: lazy<MailImporter>) {}

	async oninit(): Promise<void> {
		await this.mailImporter().initImportMailStates()
	}

	onbeforeremove(): void {
		clearInterval(this.importStatePoolHandle)
	}

	view(): Children {
		return m(".fill-absolute.scroll.plr-24.pb-48", [
			m(".h4.mt-32", lang.get("mailImportSettings_label")),
			this.renderTargetFolderControls(),
			!this.mailImporter().shouldRenderImportStatus() ? this.renderStartNewImportControls() : null,
			this.mailImporter().shouldRenderImportStatus() ? this.renderImportStatus() : null,
			this.renderImportHistory(),
		])
	}

	private async onImportButtonClick(dom: HTMLElement) {
		const userController = mailLocator.logins.getUserController()
		const currentPlanType = await userController.getPlanType()
		const isHighestTierPlan = HighestTierPlans.includes(currentPlanType)
		if (!isHighestTierPlan) {
			await showUpgradeWizardOrSwitchSubscriptionDialog(userController, HighestTierPlans as readonly AvailablePlanType[])
			return
		}

		const allowedExtensions = ["eml", "mbox"]
		const filePaths = client.isMacOS
			? await mailLocator.fileApp.openMacImportFileChooser()
			: await mailLocator.fileApp.openFileChooser(dom.getBoundingClientRect(), allowedExtensions, true)
		await this.mailImporter().onStartBtnClick(filePaths.map((fp) => fp.location))
	}

	private renderTargetFolderControls() {
		let folders = this.mailImporter().foldersForMailbox
		if (folders) {
			const loadingMsg = lang.get("loading_msg")
			const emptyLabel = m("br")
			const selectedTargetFolder = this.mailImporter().selectedTargetFolder
			const selectedTargetFolderPath = selectedTargetFolder ? getPathToFolderString(folders!, selectedTargetFolder) : ""
			const isNotSubfolder = selectedTargetFolder ? selectedTargetFolderPath === getFolderName(selectedTargetFolder) : false
			const helpLabel = selectedTargetFolder ? (isNotSubfolder ? emptyLabel : selectedTargetFolderPath) : emptyLabel

			// do not allow importing to inbox folder,
			// problem:
			// if a folder receives/imports a very large amount of mails (hundreds of thousands) that all get moved/deleted at once,
			// the backend will not be able to read any live data from that list for a while.
			// if that happens, user will not see incoming mails in their inbox folder for that time,
			// this problem can still happen on other folders,
			// but at least we won't block inbox ( incoming new mails )
			const selectableFolders = folders.getIndentedList().filter((folderInfo) => folderInfo.folder.folderType !== MailSetKind.INBOX)

			let targetFolders: SelectorItemList<MailFolder | null> = selectableFolders.map((folderInfo: IndentedFolder) => {
				return {
					name: getIndentedFolderNameForDropdown(folderInfo),
					value: folderInfo.folder,
				}
			})
			return m(DropDownSelector, {
				label: "mailImportTargetFolder_label",
				items: targetFolders,
				disabled: this.mailImporter().shouldRenderImportStatus(),
				selectedValue: selectedTargetFolder,
				selectedValueDisplay: selectedTargetFolder ? getFolderName(selectedTargetFolder) : loadingMsg,
				selectionChangedHandler: (newFolder: MailFolder | null) => (this.mailImporter().selectedTargetFolder = newFolder),
				helpLabel: () => helpLabel,
			})
		} else {
			return null
		}
	}

	private renderStartNewImportControls() {
		return [
			m(".flex-start.mt-12", this.renderImportInfoText()),
			m(
				".flex-start.mt-8",
				m(LoginButton, {
					type: LoginButtonType.FlexWidth,
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
				"{processedMails}": this.mailImporter().getProcessedMailsCount(),
				"{totalMails}": this.mailImporter().getTotalMailsCount(),
			}),
		)
		const resumeMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "resumeMailImport_action",
			icon: Icons.Play,
			click: () => this.mailImporter().onResumeBtnClick(),
			size: ButtonSize.Normal,
			hidden: this.mailImporter().shouldDisableResumeButton(),
		}
		const pauseMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "pauseMailImport_action",
			icon: Icons.Pause,
			click: () => {
				this.mailImporter().onPauseBtnClick()
			},
			size: ButtonSize.Normal,
			hidden: this.mailImporter().shouldDisablePauseButton(),
		}
		const cancelMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "cancelMailImport_action",
			icon: Icons.Cancel,
			click: () => {
				this.mailImporter().onCancelBtnClick()
			},
			size: ButtonSize.Normal,
			hidden: this.mailImporter().shouldDisableCancelButton(),
		}

		let buttonControls = []
		if (this.mailImporter().shouldRenderPauseButton()) {
			buttonControls.push(m(IconButton, pauseMailImportIconButtonAttrs))
		}
		if (this.mailImporter().shouldRenderResumeButton()) {
			buttonControls.push(m(IconButton, resumeMailImportIconButtonAttrs))
		}
		if (this.mailImporter().shouldRenderCancelButton()) {
			buttonControls.push(m(IconButton, cancelMailImportIconButtonAttrs))
		}

		return [
			[
				m(
					".flex-space-between.p.small.mt-12",
					getReadableUiImportStatus(assertNotNull(this.mailImporter().getUiStatus())),
					this.mailImporter().shouldRenderProcessedMails() ? processedMailsCountLabel : null,
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
				progress: this.mailImporter().getProgress() / 100,
				type: ProgressBarType.Large,
			}),
		)
	}

	private renderImportHistory() {
		return [
			m(".flex-space-between.items-center.mt-32.mb-8", [
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
					columnHeading: ["mailImportHistoryTableHeading_label"],
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
		let folders = this.mailImporter().foldersForMailbox?.getIndentedList()
		if (folders) {
			return this.mailImporter()
				.getFinalisedImports()
				.sort(sortCompareByReverseId)
				.map((im) => {
					const targetFolderId = im.targetFolder
					const displayTargetFolder = folders!.find((f) => isSameId(f.folder._id, targetFolderId))

					return {
						cells: () => [
							{
								main: lang.get("mailImportHistoryTableRowTitle_label", {
									"{status}": getReadableImportStatus(parseInt(im.status) as ImportStatus),
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

export function getReadableImportStatus(importStatus: ImportStatus): string {
	return lang.get(getImportStatusTranslationKey(importStatus))
}

export function getImportStatusTranslationKey(importStatus: ImportStatus): TranslationKey {
	switch (importStatus) {
		case ImportStatus.Running:
			return "mailImportStatusRunning_label"
		case ImportStatus.Paused:
			return "mailImportStatusPaused_label"
		case ImportStatus.Canceled:
			return "mailImportStatusCanceled_label"
		case ImportStatus.Finished:
			return "mailImportStatusFinished_label"
	}
}
