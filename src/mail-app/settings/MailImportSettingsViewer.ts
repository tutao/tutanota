import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import m, { Children } from "mithril"
import { EntityUpdateData } from "../../common/api/common/utils/EntityUpdateUtils"
import { IconButton, IconButtonAttrs } from "../../common/gui/base/IconButton"
import { ButtonSize } from "../../common/gui/base/ButtonSize"
import { assertNotNull, lazy } from "@tutao/tutanota-utils"
import { getFolderName, getIndentedFolderNameForDropdown, getPathToFolderString } from "../mail/model/MailUtils"
import { HighestTierPlans, ImportStatus, MailSetKind, PlanType } from "../../common/api/common/TutanotaConstants"
import { FolderSystem, IndentedFolder } from "../../common/api/common/mail/FolderSystem"
import { lang, TranslationKey } from "../../common/misc/LanguageViewModel"
import { MailImporter, UiImportStatus } from "../mail/import/MailImporter.js"
import { MailFolder } from "../../common/api/entities/tutanota/TypeRefs"
import { elementIdPart, generatedIdToTimestamp, isSameId, sortCompareByReverseId } from "../../common/api/common/utils/EntityUtils"
import { isDesktop } from "../../common/api/common/Env"
import { NativeFileApp } from "../../common/native/common/FileApp.js"
import { Icons } from "../../common/gui/base/icons/Icons.js"
import { DropDownSelector, SelectorItemList } from "../../common/gui/base/DropDownSelector.js"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs.js"
import { ProgressBar, ProgressBarType } from "../../common/gui/base/ProgressBar.js"
import { ExpanderButton, ExpanderPanel } from "../../common/gui/base/Expander.js"
import { ColumnWidth, Table, TableLineAttrs } from "../../common/gui/base/Table.js"
import { mailLocator } from "../mailLocator.js"
import { formatDate } from "../../common/misc/Formatter.js"
import { LoginButton, LoginButtonType } from "../../common/gui/base/buttons/LoginButton"
import { MailModel } from "../mail/model/MailModel.js"

/**
 * Settings viewer for mail import.
 */
export class MailImportSettingsViewer implements UpdatableSettingsViewer {
	private foldersForMailbox: FolderSystem | undefined
	private selectedTargetFolder: MailFolder | null = null
	private isImportHistoryExpanded: boolean = true

	private importStatePoolHandle: TimeoutID

	constructor(private readonly mailImporter: lazy<MailImporter>, private readonly fileApp: NativeFileApp | null, private readonly mailModel: MailModel) {}

	async oninit(): Promise<void> {
		if (isDesktop()) {
			await this.mailImporter().initImportMailStates()

			let mailbox = await this.mailImporter().getMailbox()
			this.foldersForMailbox = this.getFoldersForMailGroup(assertNotNull(mailbox._ownerGroup))
			this.selectedTargetFolder = this.foldersForMailbox.getSystemFolderByType(MailSetKind.INBOX)
		}
	}

	onbeforeremove(): void {
		if (isDesktop()) {
			clearInterval(this.importStatePoolHandle)
		}
	}

	view(): Children {
		return m(
			".fill-absolute.scroll.plr-l.pb-xl",
			m(".h4.mt-l", lang.get("mailImportSettings_label")),
			isDesktop()
				? [
						this.renderTargetFolderControls(),
						!this.mailImporter().shouldRenderImportStatus() ? this.renderStartNewImportControls() : null,
						this.mailImporter().shouldRenderImportStatus() ? this.renderImportStatus() : null,
						this.renderImportHistory(),
				  ]
				: [this.renderNoImportOnWebText()],
		)
	}

	private async onImportButtonClick(dom: HTMLElement) {
		const currentPlanType = await mailLocator.logins.getUserController().getPlanType()
		const isHighestTierPlan = HighestTierPlans.includes(currentPlanType)
		if (!isHighestTierPlan) {
			showNotAvailableForFreeDialog([PlanType.Legend, PlanType.Unlimited]).then()
			return
		}

		const allowedExtensions = ["eml", "mbox"]
		const filePaths = await assertNotNull(this.fileApp).openFileChooser(dom.getBoundingClientRect(), allowedExtensions, true)
		if (this.selectedTargetFolder) {
			await this.mailImporter().onStartBtnClick(
				this.selectedTargetFolder,
				filePaths.map((fp) => fp.location),
			)
		}
	}

	private renderNoImportOnWebText() {
		return [
			m(
				".flex-column.mt",
				m(".p", lang.get("mailImportNoImportOnWeb_label")),
				m(
					".flex-start.mt-l",
					m(LoginButton, {
						type: LoginButtonType.FlexWidth,
						label: "mailImportDownloadDesktopClient_label",
						onclick: () => {
							open("https://tuta.com#download")
						},
					}),
				),
				m(
					".flex-v-center.full-width.mt-xl",
					m("img", {
						src: `${window.tutao.appState.prefixWithoutFile}/images/mail-import/email-import-webapp.svg`,
						alt: "",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
						class: "settings-illustration-large",
					}),
				),
			),
		]
	}

	private renderTargetFolderControls() {
		let folders = this.foldersForMailbox
		if (folders) {
			const loadingMsg = lang.get("loading_msg")
			const emptyLabel = m("br")
			const selectedTargetFolderPath = this.selectedTargetFolder ? getPathToFolderString(folders!, this.selectedTargetFolder) : ""
			const isNotSubfolder = this.selectedTargetFolder ? selectedTargetFolderPath == getFolderName(this.selectedTargetFolder) : false
			const helpLabel = this.selectedTargetFolder ? (isNotSubfolder ? emptyLabel : selectedTargetFolderPath) : emptyLabel
			let targetFolders: SelectorItemList<MailFolder | null> = folders.getIndentedList().map((folderInfo: IndentedFolder) => {
				return {
					name: getIndentedFolderNameForDropdown(folderInfo),
					value: folderInfo.folder,
				}
			})
			return m(DropDownSelector, {
				label: "mailImportTargetFolder_label",
				items: targetFolders,
				disabled: this.mailImporter().shouldRenderImportStatus(),
				selectedValue: this.selectedTargetFolder,
				selectedValueDisplay: this.selectedTargetFolder ? getFolderName(this.selectedTargetFolder) : loadingMsg,
				selectionChangedHandler: (newFolder: MailFolder | null) => (this.selectedTargetFolder = newFolder),
				helpLabel: () => helpLabel,
			})
		} else {
			return null
		}
	}

	private renderStartNewImportControls() {
		return [
			m(".flex-start.mt-m", this.renderImportInfoText()),
			m(
				".flex-start.mt-s",
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
			disabled: this.mailImporter().shouldDisableResumeButton(),
		}
		const pauseMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "pauseMailImport_action",
			icon: Icons.Pause,
			click: () => {
				this.mailImporter().onPauseBtnClick()
			},
			size: ButtonSize.Normal,
			disabled: this.mailImporter().shouldDisablePauseButton(),
		}
		const cancelMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "cancelMailImport_action",
			icon: Icons.Cancel,
			click: () => {
				this.mailImporter().onCancelBtnClick()
			},
			size: ButtonSize.Normal,
			disabled: this.mailImporter().shouldDisableCancelButton(),
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
					".flex-space-between.p.small.mt-m",
					getReadableUiImportStatus(assertNotNull(this.mailImporter().getUiStatus())),
					this.mailImporter().shouldRenderProcessedMails() ? processedMailsCountLabel : null,
				),
			],
			[m(".flex-space-between.border-radius-big.mt-s.rel.nav-bg.full-width", this.renderMailImportProgressBar(), ...buttonControls)],
		]
	}

	private renderMailImportProgressBar() {
		// the ProgressBar uses progress values 0 ... 1
		return m(
			".rel.border-radius-big.full-width",
			m(ProgressBar, {
				progress: this.mailImporter().getProgress() / 100,
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

	private getFoldersForMailGroup(mailGroupId: Id): FolderSystem {
		if (mailGroupId) {
			const folderSystem = this.mailModel.getFolderSystemByGroupId(mailGroupId)
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
