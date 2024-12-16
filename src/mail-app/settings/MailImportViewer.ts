import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import m, { Children } from "mithril"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils"
import { LoginButton } from "../../common/gui/base/buttons/LoginButton"
import { IconButton } from "../../common/gui/base/IconButton"
import { Icons } from "../../common/gui/base/icons/Icons"
import { TextField, type TextFieldAttrs } from "../../common/gui/base/TextField"
import { ButtonSize } from "../../common/gui/base/ButtonSize"
import { showMailFolderDropdown } from "../mail/view/MailGuiUtils"
import { assertNotNull, first, isEmpty } from "@tutao/tutanota-utils"
import { FolderInfo, getFolderName, getIndentedFolderNameForDropdown } from "../mail/model/MailUtils"
import { getMailFolderType, ImportStatus, MailSetKind, PlanType } from "../../common/api/common/TutanotaConstants"
import { IndentedFolder } from "../../common/api/common/mail/FolderSystem"
import { lang, TranslationText } from "../../common/misc/LanguageViewModel"
import { MailImporter } from "../mail/import/MailImporter.js"
import { ExpanderButton, ExpanderPanel } from "../../common/gui/base/Expander"
import { ColumnWidth, Table, type TableLineAttrs } from "../../common/gui/base/Table"
import { ImportMailState, ImportMailStateTypeRef } from "../../common/api/entities/tutanota/TypeRefs"
import { elementIdPart, isSameId, sortCompareById, sortCompareByReverseId } from "../../common/api/common/utils/EntityUtils"
import { isDesktop } from "../../common/api/common/Env"
import { ExternalLink } from "../../common/gui/base/ExternalLink"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs.js"
import { EntityClient } from "../../common/api/common/EntityClient.js"
import { LoginController } from "../../common/api/main/LoginController.js"
import { NativeFileApp } from "../../common/native/common/FileApp.js"
import { MailboxDetail } from "../../common/mailFunctionality/MailboxModel.js"

/**
 * Settings viewer for mail import.
 */
export class MailImportViewer implements UpdatableSettingsViewer {
	private indentedFolders: Array<IndentedFolder> = []

	private mailboxDetail: MailboxDetail | null = null
	private selectedTargetFolder: IndentedFolder | undefined
	private expanded: boolean = true

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
		this.mailboxDetail = first(await this.mailImporter.mailboxModel.getMailboxDetails())
		this.indentedFolders = await this.getIndentedFolders()
		this.selectedTargetFolder = this.indentedFolders.find((f) => getMailFolderType(f.folder) === MailSetKind.INBOX)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImportMailStateTypeRef, update)) {
				const updatedState = await this.entityClient.load(ImportMailStateTypeRef, [update.instanceListId, update.instanceId])
				this.mailImporter.updateImportMailState(update.instanceId, updatedState)
				this.mailImporter.deleteStartedCancellation(update.instanceId)
			}
		}
		m.redraw()
	}

	private async getIndentedFolders(): Promise<Array<IndentedFolder>> {
		let mailboxDetail = this.mailboxDetail
		if (mailboxDetail) {
			const groupId = mailboxDetail.mailGroup._id
			const folderSystem = this.mailImporter.mailModel.getFolderSystemByGroupId(groupId)
			if (folderSystem) {
				return folderSystem.getIndentedList()
			}
		}
		throw new Error("could not load indented folder list")
	}

	private async onFolderDropdownSelect(dom: HTMLElement) {
		if (this.loginController.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog()
			return
		}
		this.mailboxDetail = first(await this.mailImporter.mailboxModel.getMailboxDetails())
		const folderInfos = await this.getIndentedFolders()
		await showMailFolderDropdown(dom.getBoundingClientRect(), folderInfos as FolderInfo[], (folder) => {
			this.selectedTargetFolder = folder
			m.redraw()
		})
	}

	private async onImportButtonClick(dom: HTMLElement) {
		if (this.loginController.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog([PlanType.Legend, PlanType.Unlimited])
			return
		}
		const filePaths = await assertNotNull(this.fileApp).openFileChooser(dom.getBoundingClientRect(), undefined, true)
		this.expanded = true
		if (this.selectedTargetFolder && this.mailboxDetail) {
			await this.mailImporter.importFromFiles(
				this.selectedTargetFolder.folder,
				filePaths.map((fp) => fp.location),
			)
		}
	}

	/**
	 * Parses the importMailStates into displayable table lines.
	 * Returns array of the parsed table lines
	 */
	private parseRecentImportsToTableLines(): Array<TableLineAttrs> {
		if (isEmpty(this.indentedFolders)) {
			return []
		}
		return Array.from(this.mailImporter.importMailStates.values())
			.sort(sortCompareByReverseId)
			.map((im) => {
				const targetFolderId = im.targetFolder
				const displayTargetFolder = this.indentedFolders.find((f) => isSameId(f.folder._id, targetFolderId))

				return {
					cells: () => [
						{
							main: `${lang.getMaybeLazy(this.makeStatusRowForImport(im))}`,
							info: [`Imported: ${im.successfulMails}`, `Failed: ${im.failedMails}`],
						},
						{ main: displayTargetFolder ? getFolderName(displayTargetFolder.folder) : "folder deleted" },
					],
					actionButtonAttrs:
						im.status === ImportStatus.Running
							? {
									icon: Icons.Cancel,
									title: () => "Cancel import",
									click: () => {
										this.mailImporter.stopImport(elementIdPart(im._id))
									},
							  }
							: null,
				}
			})
	}

	private makeStatusRowForImport(importState: ImportMailState): TranslationText {
		let status = this.mailImporter.startedCancellations.has(elementIdPart(importState._id))
			? "Canceling..."
			: getMailImportStatusName(importState.status as ImportStatus)
		return () => `${status}`
	}

	view(): Children {
		return m(
			".fill-absolute.scroll.plr-l.pb-xl",
			m(".h4.mt-l", "Email import"),
			isDesktop() ? [this.renderImportControls(), this.renderImportInfoText(), this.renderRecentImports()] : [this.renderNoImportOnWebText()],
		)
	}

	private renderRecentImports() {
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", "Recent imports"),
				m(ExpanderButton, {
					label: "show_action",
					expanded: this.expanded,
					onExpandedChange: () => {
						this.expanded = !this.expanded
					},
				}),
			]),
			m(
				ExpanderPanel,
				{
					expanded: this.expanded,
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

	private renderImportInfoText() {
		return [m(".small", "You can import EML or MBOX files.")]
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

	private renderImportControls() {
		const importSelectionAttrs: TextFieldAttrs = {
			label: () => "Target Folder",
			value: this.selectedTargetFolder ? getIndentedFolderNameForDropdown(this.selectedTargetFolder as FolderInfo) : lang.get("loading_msg"),
			oninput: () => "test",
			isReadOnly: true,
			injectionsRight: () =>
				m(IconButton, {
					title: "move_action",
					icon: Icons.Folder,
					size: ButtonSize.Compact,
					click: async (_, dom) => await this.onFolderDropdownSelect(dom),
				}),
		}

		return [
			m(TextField, importSelectionAttrs),
			m(
				".flex.center-horizontally.center-vertically.col.mt-l.pb",
				m(LoginButton, {
					class: "text-ellipsis max-width-200",
					label: () => "Select files to import",
					onclick: async (_, dom) => await this.onImportButtonClick(dom),
				}),
			),
		]
	}
}

export function getMailImportStatusName(state: ImportStatus): string | TranslationText {
	switch (state) {
		case ImportStatus.Running:
			return "Running..."
		case ImportStatus.Canceled:
			return "Canceled"
		case ImportStatus.Finished:
			return "Finished"
	}
}
