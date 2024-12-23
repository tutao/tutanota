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
import { ImportStatus, MailImporter, UiImportStatus } from "../mail/import/MailImporter.js"
import { ImportMailStateTypeRef, MailFolder } from "../../common/api/entities/tutanota/TypeRefs"
import { elementIdPart, generatedIdToTimestamp, isSameId, sortCompareByReverseId } from "../../common/api/common/utils/EntityUtils"
import { isDesktop } from "../../common/api/common/Env"
import { EntityClient } from "../../common/api/common/EntityClient.js"
import { NativeFileApp } from "../../common/native/common/FileApp.js"
import { Icons } from "../../common/gui/base/icons/Icons.js"
import { Button, ButtonType } from "../../common/gui/base/Button.js"
import { DropDownSelector, SelectorItemList } from "../../common/gui/base/DropDownSelector.js"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs.js"
import { ProgressBar, ProgressBarType } from "../../common/gui/base/ProgressBar.js"
import { ExpanderButton, ExpanderPanel } from "../../common/gui/base/Expander.js"
import { ColumnWidth, Table, TableLineAttrs } from "../../common/gui/base/Table.js"
import { mailLocator } from "../mailLocator.js"
import { formatDate } from "../../common/misc/Formatter.js"

/**
 * Settings viewer for mail import.
 */
export class MailImportSettingsViewer implements UpdatableSettingsViewer {
	private foldersForMailbox: FolderSystem | undefined
	private selectedTargetFolder: MailFolder | null = null
	private isImportHistoryExpanded: boolean = false

	private mailImporter: MailImporter
	private fileApp: NativeFileApp | null

	constructor(mailImporter: MailImporter, fileApp: NativeFileApp | null) {
		this.mailImporter = mailImporter
		this.fileApp = fileApp
	}

	async oninit(): Promise<void> {
		if (isDesktop()) {
			await this.mailImporter.initImportMailStates()
			let mailboxDetail = first(await this.mailImporter.mailboxModel.getMailboxDetails())
			if (mailboxDetail) {
				this.foldersForMailbox = this.getFoldersForMailGroup(mailboxDetail.mailGroup._id)
				this.selectedTargetFolder = this.foldersForMailbox.getSystemFolderByType(MailSetKind.INBOX)
			}
		}
	}

	view(): Children {
		return m(
			".fill-absolute.scroll.plr-l.pb-xl",
			m(".h4.mt-l", lang.get("mailImportSettings_label")),
			isDesktop()
				? [
						this.renderTargetFolderControls(),
						!this.mailImporter?.shouldShowImportStatus() ? this.renderStartNewImportControls() : null,
						this.mailImporter?.shouldShowImportStatus() ? this.renderImportStatus() : null,
						this.renderImportHistory(),
				  ]
				: [this.renderNoImportOnWebText()],
		)
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
			await this.mailImporter.onStartBtnClick(
				this.selectedTargetFolder,
				filePaths.map((fp) => fp.location),
			)
		}
	}

	private renderNoImportOnWebText() {
		return [
			m(
				".flex-column.center.mt-m",
				m("img.onboarding-logo.mt-m", {
					src: `${window.tutao.appState.prefixWithoutFile}/images/mail-import/tuta-desktop-illustration.webp`,
					alt: "",
					rel: "noreferrer",
					loading: "lazy",
					decoding: "async",
					class: "onboarding-logo-large",
				}),
				m(".p.mt-m", lang.get("mailImportNoImportOnWeb_label")),
				m(
					".flex-center.mt-m",
					m(Button, {
						type: ButtonType.Primary,
						label: "mailImportDownloadDesktopClient_label",
						click: () => {
							open("https://tuta.com#download")
						},
					}),
				),
			),
		]
	}

	private renderTargetFolderControls() {
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
				disabled: this.mailImporter.shouldShowImportStatus(),
				selectedValue: this.selectedTargetFolder,
				selectedValueDisplay: this.selectedTargetFolder ? getFolderName(this.selectedTargetFolder) : loadingMsg,
				selectionChangedHandler: (newFolder: MailFolder | null) => (this.selectedTargetFolder = newFolder),
				helpLabel: () => (this.selectedTargetFolder ? getPathToFolderString(folders!, this.selectedTargetFolder) : ""),
			})
		} else {
			return null
		}
	}

	private renderStartNewImportControls() {
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

	private renderImportStatus() {
		const importedPercentageLabel = m(
			".flex-start.p",
			lang.get("mailImportStateImportedPercentage", {
				"{importedPercentage}": this.mailImporter.getProgress(),
			}),
		)
		const processedMailsCountLabel = m(
			".flex-end.mt-s.small",
			lang.get("mailImportStateProcessedMailsTotalMails_label", {
				"{processedMails}": this.mailImporter.getProcessedMailsCount(),
				"{totalMails}": this.mailImporter.getTotalMailsCount(),
			}),
		)
		const resumeMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "resumeMailImport_action",
			icon: Icons.Play,
			click: () => this.mailImporter.onResumeBtnClick(),
			size: ButtonSize.Normal,
			disabled: this.mailImporter.shouldDisableResumeButton(),
		}
		const pauseMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "pauseMailImport_action",
			icon: Icons.Pause,
			click: () => {
				this.mailImporter.onPauseBtnClick()
			},
			size: ButtonSize.Normal,
			disabled: this.mailImporter.shouldDisablePauseButton(),
		}
		const cancelMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "cancelMailImport_action",
			icon: Icons.Cancel,
			click: () => {
				this.mailImporter.onCancelBtnClick()
			},
			size: ButtonSize.Normal,
			disabled: this.mailImporter.shouldDisableCancelButton(),
		}

		let buttonControls = []
		if (this.mailImporter.shouldShowPauseButton()) {
			buttonControls.push(m(IconButton, pauseMailImportIconButtonAttrs))
		}
		if (this.mailImporter.shouldShowResumeButton()) {
			buttonControls.push(m(IconButton, resumeMailImportIconButtonAttrs))
		}
		if (this.mailImporter.shouldShowCancelButton()) {
			buttonControls.push(m(IconButton, cancelMailImportIconButtonAttrs))
		}

		return [
			[m(".flex-space-between.h6.mt-s", getReadableUiImportStatus(this.mailImporter.getUiStatus()), importedPercentageLabel)],
			[m(".flex-space-between.border-radius-big.mt-s.rel.nav-bg.full-width", this.renderMailImportProgressBar(), ...buttonControls)],
			this.mailImporter.shouldShowProcessedMails() ? processedMailsCountLabel : null,
		]
	}

	private renderMailImportProgressBar() {
		// the ProgressBar uses progress values 0 ... 1
		return m(
			".rel.border-radius-big.full-width",
			m(ProgressBar, {
				progress: this.mailImporter.getProgress() / 100,
				type: ProgressBarType.Large,
			}),
		)
	}

	private renderImportHistory() {
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

	private getFoldersForMailGroup(mailGroupId: Id): FolderSystem {
		if (mailGroupId) {
			const folderSystem = this.mailImporter.mailModel.getFolderSystemByGroupId(mailGroupId)
			if (folderSystem) {
				return folderSystem
			}
		}
		throw new Error("could not load folder list")
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {}
}

export function getReadableUiImportStatus(uiStatus: UiImportStatus): string {
	return lang.get(getUiImportStatusTranslationKey(uiStatus))
}

export function getUiImportStatusTranslationKey(uiStatus: UiImportStatus): TranslationKey {
	switch (uiStatus) {
		case UiImportStatus.Idle:
			return "mailImportStatusIdle_label"
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
		case UiImportStatus.Canceled:
			return "mailImportStatusCanceled_label"
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
