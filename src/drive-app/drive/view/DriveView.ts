import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { AppHeaderAttrs, Header } from "../../../common/gui/Header"
import m, { Children, Vnode } from "mithril"
import { DriveViewModel } from "./DriveViewModel"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView"
import { DataFile } from "../../../common/api/common/DataFile"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { GroupType } from "../../../common/api/common/TutanotaConstants"
import { locator } from "../../../common/api/main/CommonLocator"
import { getUserGroupMemberships } from "../../../common/api/common/utils/GroupUtils"
import { GroupTypeRef } from "../../../common/api/entities/sys/TypeRefs"
import { createDriveGetIn, DriveGroupRootTypeRef, File, FileTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { DriveService } from "../../../common/api/entities/tutanota/Services"
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
		console.log(this.files)

		this.driveFacade.testDriveFacade().then((value) => console.log("Testing Drive Facade: it returns ", value))

		//this.loadDriveRoot()
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
		const serviceExecutor = locator.serviceExecutor

		const data = createDriveGetIn({ nodeId: null })
		const driveGetOut = await serviceExecutor.get(DriveService, data)
		console.log("DriveGetOut: ", driveGetOut)

		console.log("doing it like babies would do")

		const files = await Promise.all(driveGetOut.subFilesIds.map((idTupple) => locator.entityClient.load(FileTypeRef, idTupple)))
		console.log(files)

		this.currentFolderFiles = files

		// console.log(".... and NOW")
		// console.log("doing it like Bernd would do")
		// const files2 = await locator.entityClient.loadAll(FileTypeRef, driveGetOut.subFilesIds[0][0])
		// console.log(files2)
	}

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

		// TODO: Move into DriveFacade
		// const fileGroupKey = await locator.keyLoaderFacade.getCurrentSymGroupKey(ownerGroupId)
		// const sk = aes256RandomKey()
		// const ownerEncSessionKey = _encryptKeyWithVersionedKey(fileGroupKey, sk)
		// const driveCreateResponses = await Promise.all(
		// 	files.map(async (f: DataFile) => {
		// 		const blobRefTokens = await blobFacade.encryptAndUpload(ArchiveDataType.DriveFile, f.data /*FileUri*/, assertNotNull(ownerGroupId), aStupidKey)
		//
		// 		const uploadedFile = createDriveUploadedFile({
		// 			referenceTokens: blobRefTokens,
		// 			encFileName: new Uint8Array(0),
		// 			encCid: new Uint8Array(0),
		// 			encMimeType: new Uint8Array(0),
		// 			ownerEncSessionKey: ownerEncSessionKey.key,
		// 			_ownerGroup: assertNotNull(ownerGroupId),
		// 		})
		// 		const data = createDriveCreateData({ uploadedFile: uploadedFile })
		// 		const response = await locator.serviceExecutor.post(DriveService, data)
		// 		return response
		// 	}),
		// )
		//console.log(`received ::`, driveCreateResponses)
	}
}
