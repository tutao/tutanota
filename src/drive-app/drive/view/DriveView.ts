import { TopLevelAttrs, TopLevelView } from "../../../TopLevelView"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { AppHeaderAttrs } from "../../../common/gui/Header"
import m, { Children, Vnode } from "mithril"
import { DriveViewModel } from "./DriveViewModel"
import { BaseTopLevelView } from "../../../common/gui/BaseTopLevelView"
import { showFileChooserForAttachments } from "../../../mail-app/mail/editor/MailEditorViewModel"
import { DataFile } from "../../../common/api/common/DataFile"
import { FileReference } from "../../../common/api/common/utils/FileUtils"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { ButtonSize } from "../../../common/gui/base/ButtonSize"
import { IconButton } from "../../../common/gui/base/IconButton"
import { ArchiveDataType, GroupType } from "../../../common/api/common/TutanotaConstants"
import { locator } from "../../../common/api/main/CommonLocator"
import { getUserGroupMemberships } from "../../../common/api/common/utils/GroupUtils"
import { GroupTypeRef } from "../../../common/api/entities/sys/TypeRefs"
import { assertNotNull } from "@tutao/tutanota-utils"

export interface DriveViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	driveViewModel: DriveViewModel
	bottomNav?: () => Children
	lazySearchBar: () => Children
}

export class DriveView extends BaseTopLevelView implements TopLevelView<DriveViewAttrs> {
	protected onNewUrl(args: Record<string, any>, requestedPath: string): void {}

	protected files: (DataFile | FileReference)[] = []

	oninit({ attrs }: m.Vnode<TopLevelAttrs>) {
		console.log(this.files)
	}

	view({ attrs }: Vnode<DriveViewAttrs>): Children {
		console.log(this.files)
		return m("div", [
			m("p", "welcome to the drive"),

			m(IconButton, {
				title: "attachFiles_action",
				click: (ev, dom) =>
					showFileChooserForAttachments(dom.getBoundingClientRect())
						.then((files) => {
							if (files) {
								this.files = [...files]
								this.uploadFiles(this.files)
							}
						})
						.then(() => m.redraw()),
				icon: Icons.Attachment,
				size: ButtonSize.Compact,
			}),
		])
	}

	async uploadFiles(files: (FileReference | DataFile)[]): Promise<void> {
		// We should inject this dependency somewhere else, but this is a prototype so we don't care. Wheeeeee!
		const blobFacade = locator.blobFacade
		const groupIds = await locator.groupManagementFacade.loadTeamGroupIds()
		console.log("groupIds for this user :: ", groupIds)

		let memberships = getUserGroupMemberships(locator.logins.getUserController().user, GroupType.File)
		console.log("groupMemberships:: for this user :: ", memberships)

		let fileGroupMembership = memberships[0]
		console.log("fileGroupMembership:: for this user :: ", fileGroupMembership)

		let fileGroup = await locator.entityClient.load(GroupTypeRef, fileGroupMembership.group)
		console.log("fileGroup:: for this user :: ", fileGroup)

		const ownerGroupId = fileGroup._ownerGroup
		console.log(`fileGroupOwnerGroup :: ${ownerGroupId}`)
		console.log(`fileGroup_Id :: ${fileGroup._id}`)

		//random.addStaticEntropy(Uint8Array.from([10, 50, 90, 30]))
		const aStupidKey = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1]

		const blobReferenceTokenWrappers = await blobFacade.encryptAndUpload(
			ArchiveDataType.Attachments,
			(files[0] as DataFile).data /*FileUri*/,
			assertNotNull(ownerGroupId),
			aStupidKey,
		)
		console.log(`received ::`, blobReferenceTokenWrappers)
	}
}
