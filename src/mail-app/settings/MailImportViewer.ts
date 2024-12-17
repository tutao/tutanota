import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import m, { Children } from "mithril"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils"
import { LoginButton } from "../../common/gui/base/buttons/LoginButton"
import { IconButton, IconButtonAttrs } from "../../common/gui/base/IconButton"
import { TextField, type TextFieldAttrs } from "../../common/gui/base/TextField"
import { ButtonSize } from "../../common/gui/base/ButtonSize"
import { showMailFolderDropdown } from "../mail/view/MailGuiUtils"
import { assertNotNull, first, isEmpty } from "@tutao/tutanota-utils"
import { FolderInfo, getFolderName, getIndentedFolderNameForDropdown } from "../mail/model/MailUtils"
import { getMailFolderType, ImportStatus, MailSetKind, PlanType } from "../../common/api/common/TutanotaConstants"
import { IndentedFolder } from "../../common/api/common/mail/FolderSystem"
import { lang, TranslationKey } from "../../common/misc/LanguageViewModel"
import { MailImporter } from "../mail/import/MailImporter.js"
import { ExpanderButton, ExpanderPanel } from "../../common/gui/base/Expander"
import { ColumnWidth, Table, type TableLineAttrs } from "../../common/gui/base/Table"
import { ImportMailState, ImportMailStateTypeRef } from "../../common/api/entities/tutanota/TypeRefs"
import { elementIdPart, isSameId, sortCompareByReverseId } from "../../common/api/common/utils/EntityUtils"
import { isDesktop } from "../../common/api/common/Env"
import { ExternalLink } from "../../common/gui/base/ExternalLink"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs.js"
import { EntityClient } from "../../common/api/common/EntityClient.js"
import { LoginController } from "../../common/api/main/LoginController.js"
import { NativeFileApp } from "../../common/native/common/FileApp.js"
import { theme } from "../../common/gui/theme.js"
import { px } from "../../common/gui/size.js"
import { Icons } from "../../common/gui/base/icons/Icons.js"

/**
 * Settings viewer for mail import.
 */
export class MailImportViewer implements UpdatableSettingsViewer {
	private indentedFoldersForMailbox: Array<IndentedFolder> = []

	private selectedTargetFolder: IndentedFolder | undefined
	private isImportHistoryExpanded: boolean = false

	private mailImporter: MailImporter
	private entityClient: EntityClient
	private loginController: LoginController
	private fileApp: NativeFileApp | null

	constructor(mailImporter: MailImporter, entityClient: EntityClient, loginController: LoginController, fileApp: NativeFileApp | null) {
		this.mailImporter = mailImporter
		this.entityClient = entityClient
		this.loginController = loginController
		this.fileApp = fileApp
	}

	async oninit(): Promise<void> {
		await this.mailImporter.initImportMailStates()
		let mailboxDetail = first(await this.mailImporter.mailboxModel.getMailboxDetails())
		if (mailboxDetail) {
			this.indentedFoldersForMailbox = await this.getIndentedFoldersForMailGroup(mailboxDetail.mailGroup._id)
			this.selectedTargetFolder = this.indentedFoldersForMailbox.find((f) => getMailFolderType(f.folder) === MailSetKind.INBOX)
		}
	}

	view(): Children {
		let runningImport = this.mailImporter.getRunningImportMailState()
		return m(
			".fill-absolute.scroll.plr-l.pb-xl",
			m(".h4.mt-l", lang.get("mailImportSettings_label")),
			isDesktop()
				? [
					!runningImport ? this.renderNonRunningMailImportControls() : null,
					runningImport ? this.renderRunningMailImportStatusCard(runningImport) : null,
					this.renderRecentImports()
				]
				: [this.renderNoImportOnWebText()],
		)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImportMailStateTypeRef, update)) {
				this.mailImporter.startedCancellation = false
				this.mailImporter.waitingForFirstEvent = false
				const updatedState = await this.entityClient.load(ImportMailStateTypeRef, [update.instanceListId, update.instanceId])
				this.mailImporter.updateImportMailState(update.instanceId, updatedState)
			}
		}
		m.redraw()
	}

	private async onFolderDropdownSelect(dom: HTMLElement) {
		if (this.loginController.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog()
			return
		}
		let mailboxDetail = first(await this.mailImporter.mailboxModel.getMailboxDetails())
		if (mailboxDetail) {
			const folderInfos = await this.getIndentedFoldersForMailGroup(mailboxDetail.mailGroup._id)
			await showMailFolderDropdown(dom.getBoundingClientRect(), folderInfos as FolderInfo[], (folder) => {
				this.selectedTargetFolder = folder
				m.redraw()
			})
		}
	}

	private async onImportButtonClick(dom: HTMLElement) {
		if (this.loginController.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog([PlanType.Legend, PlanType.Unlimited])
			return
		}
		const allowedExtensions = ["eml", "mbox"]
		const filePaths = await assertNotNull(this.fileApp).openFileChooser(dom.getBoundingClientRect(), allowedExtensions, true)
		if (this.selectedTargetFolder) {
			this.mailImporter.waitingForFirstEvent = true
			m.redraw()
			await this.mailImporter.importFromFiles(
				this.selectedTargetFolder.folder,
				filePaths.map((fp) => fp.location),
			)
		}
	}

	/**
	 * Parses the importMailStates into displayable table lines.
	 * @returns array of the parsed table lines.
	 */
	private parseRecentImportsToTableLines(): Array<TableLineAttrs> {
		if (isEmpty(this.indentedFoldersForMailbox)) {
			return []
		}
		return this.mailImporter
				   .getNonRunningImportMailStates()
				   .sort(sortCompareByReverseId)
				   .map((im) => {
					   const targetFolderId = im.targetFolder
					   const displayTargetFolder = this.indentedFoldersForMailbox.find((f) => isSameId(f.folder._id, targetFolderId))

					   return {
						   cells: () => [
							   {
								   main: `${lang.get(getImportMailStatusTranslationKey(im.status as ImportStatus))}`,
								   info: [`Imported: ${im.successfulMails}`, `Failed: ${im.failedMails}`],
							   },
							   { main: displayTargetFolder ? getFolderName(displayTargetFolder.folder) : "folder deleted" },
						   ],
					   }
				   })
	}

	private renderRecentImports() {
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", "Recent imports"),
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
					columnHeading: ["state_label", "inboxRuleTargetFolder_label"],
					columnWidths: [ColumnWidth.Small, ColumnWidth.Largest],
					showActionButtonColumn: true,
					lines: this.parseRecentImportsToTableLines(),
				}),
			),
		]
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
		let isImportRunning = this.mailImporter.isMailImportRunning()
		const importSelectionAttrs: TextFieldAttrs = {
			label: "inboxRuleTargetFolder_label",
			value: this.selectedTargetFolder ? getIndentedFolderNameForDropdown(this.selectedTargetFolder as FolderInfo) : lang.get("loading_msg"),
			isReadOnly: true,
			disabled: isImportRunning,
			injectionsRight: () =>
				!isImportRunning ? m(IconButton, {
					title: "selectMailImportTargetFolder_action",
					icon: Icons.Folder,
					size: ButtonSize.Compact,
					click: async (_, dom) => await this.onFolderDropdownSelect(dom),
				}) : null,
		}
		return [
			m(TextField, importSelectionAttrs),
		]
	}

	private renderNonRunningMailImportControls() {
		return [
			this.renderTargetFolderControls(),
			m(
				".flex-end.mt-l.pb",
				m(LoginButton, {
					class: "text-ellipsis max-width-200",
					label: () => "Select files to import",
					disabled: this.mailImporter.waitingForFirstEvent,
					onclick: async (_, dom) => await this.onImportButtonClick(dom),
				}),
			),
			m(".flex-end",
				this.renderImportInfoText()
			)
		]
	}

	private renderImportInfoText() {
		return [m(".small", "You can import EML or MBOX files.")]
	}

	private renderImportMailStatus(runningImport: ImportMailState) {
		const startingMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "continueMailImport_action",
			icon: Icons.Mobile,
			click: () => null,
			size: ButtonSize.Normal,
		}

		const continueMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "continueMailImport_action",
			icon: Icons.Play,
			click: () => null,
			size: ButtonSize.Normal,
		}

		const pauseMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "pauseMailImport_action",
			icon: Icons.Pause,
			click: () => null,
			size: ButtonSize.Normal,
		}

		const cancelMailImportIconButtonAttrs: IconButtonAttrs = {
			title: "cancelMailImport_action",
			icon: Icons.Cancel,
			click: () => {
				this.mailImporter.startedCancellation = true;
				this.mailImporter.stopImport(elementIdPart(runningImport._id))
			},
			size: ButtonSize.Normal,
		}

		return [m("center.mb-s.text-center", [
			m(
				".h4.mb-s",
				this.getReadableImportMailStatus(runningImport.status as ImportStatus),
			),
			m(
				".h5",
				lang.get("mailImportStateSuccessfulMails_label", {
					"{successfulMails}": runningImport.successfulMails,
					"{failedMails}": runningImport.successfulMails,
				}),
			),
			Number(runningImport.failedMails) != 0 ? m(
				".h5",
				lang.get("mailImportStateFailedMails_label", {
					"{failedMails}": runningImport.failedMails,
				}),
			) : null,
		]),
			m("center", [
				//this.mailImportState().state != ImportState.RUNNING ? m(IconButton, continueMailImportIconButtonAttrs) : null,
				runningImport.status == ImportStatus.Running ? m(IconButton, pauseMailImportIconButtonAttrs) : null,
				runningImport.status == ImportStatus.Running ? m(IconButton, cancelMailImportIconButtonAttrs) : null
			]),
		]
	}

	private renderMailImportStatusCard() {
		let runningImport = this.mailImporter.getRunningImportMailState()
		return [
			this.renderTargetFolderControls(),
			m(".border-radius-big",
				{
					style: {
						border: `2px solid ${theme.content_accent}`,
						backgroundColor: theme.content_bg,
						marginTop: px(16),
						marginBottom: px(16),
						padding: px(16),
					},
				},
				[
					runningImport && !this.mailImporter.waitingForFirstEvent ? this.renderImportMailStatus(runningImport) :
						this.renderImportMailStatus(
							{

							}: ImportMailState
						)
			),
		]
	}

	private getReadableImportMailStatus(importStatus: ImportStatus): string {
		return lang.get(getImportMailStatusTranslationKey(importStatus))
	}

	private async getIndentedFoldersForMailGroup(mailGroupId: Id): Promise<Array<IndentedFolder>> {
		if (mailGroupId) {
			const folderSystem = this.mailImporter.mailModel.getFolderSystemByGroupId(mailGroupId)
			if (folderSystem) {
				return folderSystem.getIndentedList()
			}
		}
		throw new Error("could not load indented folder list")
	}
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
		case ImportStatus.Cancelling:
			return "mailImportStatusCancelling_label"
		default:
			return "mailImportStatusFinished_label"
	}
}