import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import m, { Children } from "mithril"
import { EntityUpdateData } from "../../common/api/common/utils/EntityUpdateUtils"
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
import { getMailFolderType, ImportStatus, MailSetKind } from "../../common/api/common/TutanotaConstants"
import { IndentedFolder } from "../../common/api/common/mail/FolderSystem"
import { lang, TranslationText } from "../../common/misc/LanguageViewModel"
import { Importer } from "../mail/import/Importer"
import { NativeFileApp } from "../../common/native/common/FileApp"
import { ExpanderButton, ExpanderPanel } from "../../common/gui/base/Expander"
import { ColumnWidth, Table, type TableLineAttrs } from "../../common/gui/base/Table"
import { EntityClient } from "../../common/api/common/EntityClient"
import { ImportMailState, ImportMailStateTypeRef } from "../../common/api/entities/tutanota/TypeRefs"
import { GENERATED_MAX_ID, isSameId } from "../../common/api/common/utils/EntityUtils"
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
	private expanded: boolean = false
	private entityClient: EntityClient
	private importMailStates: Array<ImportMailState> = []
	private indentedFolders: Array<IndentedFolder> = []
	private userController: UserController

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
				this.importMailStates = await this.entityClient.loadRange(
					ImportMailStateTypeRef,
					this.mailboxDetail.mailbox.mailImportStates,
					GENERATED_MAX_ID,
					10,
					true,
				)
			}
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
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
			console.log(this.selectedTargetFolder)
			m.redraw()
		})
	}

	private async onImportButtonClick(dom: HTMLElement) {
		if (this.userController.isFreeAccount()) {
			showNotAvailableForFreeDialog()
			return
		}
		const filePaths = await assertNotNull(this.fileApp).openFileChooser(dom.getBoundingClientRect(), undefined, true)

		if (this.selectedTargetFolder && this.mailboxDetail) {
			await this.mailImporter.importFromFiles(
				this.selectedTargetFolder.folder,
				this.mailboxDetail,
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
		return this.importMailStates.map((im) => {
			const targetFolderId = im.targetFolder
			const displayTargetFolder = this.indentedFolders.find((f) => isSameId(f.folder._id, targetFolderId))
			return {
				cells: () => [
					{ main: displayTargetFolder ? getFolderName(displayTargetFolder.folder) : "folder deleted" },
					{ main: lang.getMaybeLazy(getMailImportStatusName(im.status as ImportStatus)) },
				],
			}
		})
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
					columnHeading: [() => "Import Instance", "state_label"],
					columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
					showActionButtonColumn: true,
					lines: this.parseRecentImportsToTableLines(),
				}),
			),
		]
	}

	private renderImportInfoText() {
		return [m(".small", "You can import EML or MBOX files. Further import options will be release in 2025.")]
	}

	private renderNoImportOnWebText() {
		return [
			m(
				".pb.mt-l",
				m("img.height-100p", {
					src: `${window.tutao.appState.prefixWithoutFile}/images/leaving-wizard/main.png`,
					alt: "",
					rel: "noreferrer",
					loading: "lazy",
					decoding: "async",
				}),
			),
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
export function getMailImportStatusName(state: ImportStatus): TranslationText {
	switch (state) {
		case ImportStatus.Finished:
			return () => "Finished"
		case ImportStatus.NotInitialized:
			return () => "Not started"
		case ImportStatus.Paused:
			return () => "Paused"
		case ImportStatus.Running:
			return () => "Running"
		case ImportStatus.Postponed:
			return () => "Postponed"
		default:
			return () => "Unknown"
	}
}
