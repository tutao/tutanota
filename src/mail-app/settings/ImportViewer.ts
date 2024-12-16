import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import m, { Children } from "mithril"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils"
import { LoginButton } from "../../common/gui/base/buttons/LoginButton"
import { IconButton } from "../../common/gui/base/IconButton"
import { Icons } from "../../common/gui/base/icons/Icons"
import { TextField, type TextFieldAttrs } from "../../common/gui/base/TextField"
import { ButtonSize } from "../../common/gui/base/ButtonSize"
import { showMailFolderDropdown } from "../mail/view/MailGuiUtils"
import { MailboxDetail, MailboxModel } from "../../common/mailFunctionality/MailboxModel"
import { MailModel } from "../mail/model/MailModel"
import { assertNotNull, first, isEmpty } from "@tutao/tutanota-utils"
import { FolderInfo, getFolderName, getIndentedFolderNameForDropdown } from "../mail/model/MailUtils"
import { getMailFolderType, ImportStatus, MailSetKind, PlanType } from "../../common/api/common/TutanotaConstants"
import { IndentedFolder } from "../../common/api/common/mail/FolderSystem"
import { lang, TranslationText } from "../../common/misc/LanguageViewModel"
import { Importer } from "../mail/import/Importer"
import { NativeFileApp } from "../../common/native/common/FileApp"
import { ExpanderButton, ExpanderPanel } from "../../common/gui/base/Expander"
import { ColumnWidth, Table, type TableLineAttrs } from "../../common/gui/base/Table"
import { EntityClient } from "../../common/api/common/EntityClient"
import { ImportMailState, ImportMailStateTypeRef } from "../../common/api/entities/tutanota/TypeRefs"
import { elementIdPart, GENERATED_MAX_ID, isSameId } from "../../common/api/common/utils/EntityUtils"
import { isDesktop } from "../../common/api/common/Env"
import { ExternalLink } from "../../common/gui/base/ExternalLink"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs.js"
import { UserController } from "../../common/api/main/UserController.js"

/**
 * Settings viewer for Import
 * This Viewer includes its own ViewModel logic because of its small size
 */
export class ImportViewer implements UpdatableSettingsViewer {
	private mailboxModel: MailboxModel
	private mailModel: MailModel
	private mailboxDetail: MailboxDetail | null = null
	private selectedTargetFolder: IndentedFolder | undefined
	private fileApp: NativeFileApp | null
	private mailImporter: Importer
	private expanded: boolean = true
	private entityClient: EntityClient
	private importMailStates: Map<Id, ImportMailState> = new Map()
	private indentedFolders: Array<IndentedFolder> = []
	private userController: UserController
	private startedCancellation: Set<Id> = new Set()

	constructor(
		mailboxModel: MailboxModel,
		mailModel: MailModel,
		fileApp: NativeFileApp | null,
		mailImporter: Importer,
		entityClient: EntityClient,
		userController: UserController,
	) {
		this.mailboxModel = mailboxModel
		this.mailModel = mailModel
		this.fileApp = fileApp
		this.mailImporter = mailImporter
		this.entityClient = entityClient
		this.userController = userController
	}

	async oninit(): Promise<void> {
		if (isDesktop() || !this.userController.isFreeAccount()) {
			this.mailboxDetail = await this.getFirstMailBoxDetails()
			this.indentedFolders = await this.getIndentedFolders()
			this.selectedTargetFolder = this.indentedFolders.find((f) => getMailFolderType(f.folder) === MailSetKind.INBOX)
			if (this.mailboxDetail) {
				const importMailStatesCollection = await this.entityClient.loadRange(
					ImportMailStateTypeRef,
					this.mailboxDetail.mailbox.mailImportStates,
					GENERATED_MAX_ID,
					10,
					true,
				)
				for (const importState of importMailStatesCollection) {
					this.importMailStates.set(elementIdPart(importState._id), importState)
				}

				// const localMailStatesCollection = this.mailImporter.getLocalStateAsRemote()
			}
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImportMailStateTypeRef, update)) {
				const updatedState = await this.entityClient.load(ImportMailStateTypeRef, [update.instanceListId, update.instanceId])
				this.importMailStates.set(update.instanceId, updatedState)
				this.startedCancellation.delete(update.instanceId)
			}
		}
		m.redraw()
	}

	/**
	 * Gets the first mailbox details (aka the first, main mailbox)
	 * @private
	 */
	private async getFirstMailBoxDetails() {
		return first(await this.mailboxModel.getMailboxDetails())
	}

	/**
	 * Gets all folders in the currently set mailbox
	 * @private
	 */
	private async getIndentedFolders(): Promise<Array<IndentedFolder>> {
		if (this.mailboxDetail) {
			const groupId = this.mailboxDetail.mailGroup._id
			const folderSystem = this.mailModel.getFolderSystemByGroupId(groupId)
			if (folderSystem) {
				return folderSystem.getIndentedList()
			}
		}
		throw new Error("Init went wrong")
	}

	private async onFolderDropdownSelect(dom: HTMLElement) {
		if (this.userController.isFreeAccount()) {
			showNotAvailableForFreeDialog()
			return
		}
		this.mailboxDetail = await this.getFirstMailBoxDetails()
		const folderInfos = await this.getIndentedFolders()
		await showMailFolderDropdown(dom.getBoundingClientRect(), folderInfos as FolderInfo[], (folder) => {
			this.selectedTargetFolder = folder
			m.redraw()
		})
	}

	private async onImportButtonClick(dom: HTMLElement) {
		if (this.userController.isFreeAccount()) {
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
	 * @private
	 */
	private parseRecentImportsToTableLines(): Array<TableLineAttrs> {
		if (isEmpty(this.indentedFolders)) {
			return []
		}
		return Array.from(this.importMailStates.values()).map((im) => {
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
									this.startedCancellation.add(elementIdPart(im._id))
									this.mailImporter.stopImport()
								},
						  }
						: null,
			}
		})
	}

	private makeStatusRowForImport(importState: ImportMailState): TranslationText {
		let status = this.startedCancellation.has(elementIdPart(importState._id)) ? "Canceling.." : getMailImportStatusName(importState.status as ImportStatus)
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
			// TODO: Download links for the Tuta desktop
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

/**
 * Parses mail ImportStatus into its corresponding translated label
 * @param state
 */
export function getMailImportStatusName(state: ImportStatus): string {
	switch (state) {
		case ImportStatus.Running:
			return "Running..."
		case ImportStatus.Canceled:
			return "Canceled"
		case ImportStatus.Finished:
			return "Finished"
	}
}
