import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header"
import m, { Children, Vnode } from "mithril"
import { DriveViewModel } from "./DriveViewModel"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView"
import { DataFile } from "../../../common/api/common/DataFile"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { ArchiveDataType, GroupType } from "../../../common/api/common/TutanotaConstants"
import { locator } from "../../../common/api/main/CommonLocator"
import { getUserGroupMemberships } from "../../../common/api/common/utils/GroupUtils"
import { GroupTypeRef } from "../../../common/api/entities/sys/TypeRefs"
import { assertNotNull } from "@tutao/tutanota-utils"
import { createDriveCreateData, createDriveUploadedFile, DriveGroupRootTypeRef, FileTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { DriveService } from "../../../common/api/entities/tutanota/Services"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider"
import { ColumnType, ViewColumn } from "../../../common/gui/base/ViewColumn"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { size } from "../../../common/gui/size"
import { IconButton } from "../../../common/gui/base/IconButton"
import { showFileChooserForAttachments } from "../../../mail-app/mail/editor/MailEditorViewModel"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { ButtonSize } from "../../../common/gui/base/ButtonSize"

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

	protected onNewUrl(args: Record<string, any>, requestedPath: string): void {}

	protected files: (DataFile | FileReference)[] = []

	constructor(vnode: Vnode<DriveViewAttrs>) {
		super()
		this.driveNavColumn = this.createDriveNavColumn(vnode.attrs.drawerAttrs) // this is where we see the left bar
		this.currentFolderColumn = this.createCurrentFolderColumn() // this where we see the files of the selected folder being listed
		this.viewSlider = new ViewSlider([this.driveNavColumn, this.currentFolderColumn])
	}

	oninit({ attrs }: m.Vnode<TopLevelAttrs>) {
		console.log(this.files)
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

						m(IconButton, {
							title: "attachFiles_action",
							click: (ev, dom) =>
								showFileChooserForAttachments(dom.getBoundingClientRect()).then((files) => {
									if (files) {
										this.files = [...files]
										this.uploadFiles(this.files)
									}
								}),
							icon: Icons.Attachment,
							size: ButtonSize.Compact,
						}),
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

	async onNewFile_Click(dom: HTMLElement): Promise<void> {
		showFileChooserForAttachments(dom.getBoundingClientRect()).then((files) => {
			if (files) {
				this.files = [...files]
				this.uploadFiles(this.files)
			}
		})
	}

	async uploadFiles(files: (FileReference | DataFile)[]): Promise<void> {
		// We should inject this dependency somewhere else, but this is a prototype so we don't care. Wheeeeee!
		const blobFacade = locator.blobFacade
		const groupIds = await locator.groupManagementFacade.loadTeamGroupIds()
		console.log("groupIds for this user :: ", groupIds)

		let memberships = getUserGroupMemberships(locator.logins.getUserController().user, GroupType.File)
		console.log("groupMemberships:: for this user :: ", memberships)

		const fileGroupMembership = memberships[0]

		console.log("fileGroupMembership:: for this user :: ", fileGroupMembership)
		let fileGroup = await locator.entityClient.load(GroupTypeRef, fileGroupMembership.group)
		console.log("fileGroup:: for this user :: ", fileGroup)

		// [x] file grouyp root to get file root
		// [x] new file
		// set blobs
		// set name ?
		// set size
		// upload
		const driveGroupRoot = await locator.entityClient.load(DriveGroupRootTypeRef, fileGroup._id)
		console.log(`driveGroupRoot :: `, driveGroupRoot)

		const rootFileIdTuple = driveGroupRoot.root
		const rootFile = await locator.entityClient.load(FileTypeRef, rootFileIdTuple)
		console.log(`rootFile :: `, rootFile)

		const ownerGroupId = fileGroup._ownerGroup
		console.log(`fileGroupOwnerGroup :: ${ownerGroupId}`)
		console.log(`fileGroup_Id :: ${fileGroup._id}`)

		//random.addStaticEntropy(Uint8Array.from([10, 50, 90, 30]))
		const aStupidKey = [0, 1, 2, 3, 4, 5, 6, 7]

		const driveCreateResponses = await Promise.all(
			files.map(async (f: DataFile) => {
				const blobRefTokens = await blobFacade.encryptAndUpload(ArchiveDataType.DriveFile, f.data /*FileUri*/, assertNotNull(ownerGroupId), aStupidKey)

				const uploadedFile = createDriveUploadedFile({
					referenceTokens: blobRefTokens,
					encFileName: new Uint8Array(0),
					encCid: new Uint8Array(0),
					encMimeType: new Uint8Array(0),
					ownerEncSessionKey: new Uint8Array(0),
				})
				const data = createDriveCreateData({ uploadedFile: uploadedFile })
				const response = await locator.serviceExecutor.post(DriveService, data, { sessionKey: aStupidKey })
				return response
			}),
		)
		console.log(`received ::`, driveCreateResponses)
	}
}
