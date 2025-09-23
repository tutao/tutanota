import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header"
import m, { Children, Vnode } from "mithril"
import { DriveViewModel } from "./DriveViewModel"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView"
import { DataFile } from "../../../common/api/common/DataFile"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { locator } from "../../../common/api/main/CommonLocator"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { size } from "../../../common/gui/size"
import { showFileChooserForAttachments } from "../../../mail-app/mail/editor/MailEditorViewModel"
import { DriveFacade } from "../../../common/api/worker/facades/DriveFacade"

export interface DriveViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	driveViewModel: DriveViewModel
	bottomNav?: () => Children
	lazySearchBar: () => Children
}

export class DriveView extends BaseTopLevelView implements TopLevelView<DriveViewAttrs> {
	private readonly viewSlider: ViewSlider
	private readonly driveNavColumn: ViewColumn
	private readonly currentFolderColumn: ViewColumn

	private readonly driveFacade: DriveFacade

	private currentFolderFiles: File[] = []

	protected onNewUrl(args: Record<string, any>, requestedPath: string): void {}

	protected files: (DataFile | FileReference)[] = []

	constructor(vnode: Vnode<DriveViewAttrs>) {
		super()
		this.driveNavColumn = this.createDriveNavColumn(vnode.attrs.drawerAttrs) // this is where we see the left bar
		this.currentFolderColumn = this.createCurrentFolderColumn() // this where we see the files of the selected folder being listed
		this.viewSlider = new ViewSlider([this.driveNavColumn, this.currentFolderColumn])

		this.driveFacade = locator.driveFacade
	}

	oninit({ attrs }: m.Vnode<TopLevelAttrs>) {
		this.loadDriveRoot()
	}

	view({ attrs }: Vnode<DriveViewAttrs>): Children {
		return m("#drive.main-view", {}, [
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.driveNavColumn.width,
					rightView: [],
					...attrs.header,
				}),
				bottomNav: null,
			}),
		])
	}

	private createDriveNavColumn(drawerAttrs: DrawerMenuAttrs) {
		return new ViewColumn(
			{
				view: () => {
					return m(FolderColumnView, {
						drawer: drawerAttrs,
						button: {
							label: "newFile_action",
							click: (ev, dom) => this.onNewFile_Click(dom),
						},
						content: "prout",
						ariaLabel: "folderTitle_label",
					})
				},
			},
			ColumnType.Background,
			{
				minWidth: size.first_col_min_width,
				maxWidth: size.first_col_max_width,
				headerCenter: "folderTitle_label",
			},
		)
	}

	private createCurrentFolderColumn() {
		return new ViewColumn(
			{
				view: () => {
					return [
						m("p", "welcome to the drive"),
						// m(List, {
						// 	renderConfig: {
						// 		createElement: (dom) => {
						// 			m.render(dom, m("div"))
						// 			return row
						// 		},
						// 	},
						// }),
						this.currentFolderFiles.map((value) => m("", `File named "${value.name}", size: ${value.size}, ID: ${value._id}`)),
					]
				},
			},
			ColumnType.Background,
			{
				minWidth: size.second_col_min_width,
				maxWidth: size.second_col_max_width,
			},
		)
	}

	// private renderFoldersAndLabels(editingFolderForMailGroup: Id | null) {
	// 	const details = locator.mailboxModel.mailboxDetails() ?? []
	// 	return [
	// 		...details.map((mailboxDetail) => {
	// 			return this.renderFoldersAndLabelsForMailbox(mailboxDetail, editingFolderForMailGroup)
	// 		}),
	// 	]
	// }
	//
	// private renderFoldersAndLabelsForMailbox(mailboxDetail: MailboxDetail, editingFolderForMailGroup: string | null) {
	// 	const inEditMode = editingFolderForMailGroup === mailboxDetail.mailGroup._id
	// 	// Only show folders for mailbox in which edit was selected
	// 	if (editingFolderForMailGroup && !inEditMode) {
	// 		return null
	// 	} else {
	// 		return m(
	// 			SidebarSection,
	// 			{
	// 				name: lang.makeTranslation("mailbox_name", getMailboxName(locator.logins, mailboxDetail)),
	// 			},
	// 			[
	// 				this.createMailboxFolderItems(mailboxDetail, inEditMode, () => {
	// 					EditFoldersDialog.showEdit(() => this.renderFoldersAndLabels(mailboxDetail.mailGroup._id))
	// 				}),
	// 				mailLocator.mailModel.canManageLabels()
	// 					? this.renderMailboxLabelItems(mailboxDetail, inEditMode, () => {
	// 						EditFoldersDialog.showEdit(() => this.renderFoldersAndLabels(mailboxDetail.mailGroup._id))
	// 					})
	// 					: null,
	// 			],
	// 		)
	// 	}
	// }

	// private renderSidebar(mailboxDetail: MailboxDetail, editingFolderForMailGroup: string | null) {
	// 	const inEditMode = editingFolderForMailGroup === mailboxDetail.mailGroup._id
	// 	// Only show folders for mailbox in which edit was selected
	// 	if (editingFolderForMailGroup && !inEditMode) {
	// 		return null
	// 	} else {
	// 		return m(
	// 			SidebarSection,
	// 			{
	// 				name: lang.makeTranslation("mailbox_name", getMailboxName(locator.logins, mailboxDetail)),
	// 			},
	// 			[
	// 				this.createMailboxFolderItems(mailboxDetail, inEditMode, () => {
	// 					EditFoldersDialog.showEdit(() => this.renderFoldersAndLabels(mailboxDetail.mailGroup._id))
	// 				}),
	// 				mailLocator.mailModel.canManageLabels()
	// 					? this.renderMailboxLabelItems(mailboxDetail, inEditMode, () => {
	// 							EditFoldersDialog.showEdit(() => this.renderFoldersAndLabels(mailboxDetail.mailGroup._id))
	// 						})
	// 					: null,
	// 			],
	// 		)
	// 	}
	// }

	async loadDriveRoot(): Promise<void> {
		this.currentFolderFiles = await this.driveFacade.getRootFiles()
	}

	async onNewFile_Click(dom: HTMLElement): Promise<void> {
		showFileChooserForAttachments(dom.getBoundingClientRect()).then((files) => {
			if (files) {
				this.driveFacade.uploadFiles([...files]).then((files) => this.currentFolderFiles.push(...files))
			}
		})
	}
}
