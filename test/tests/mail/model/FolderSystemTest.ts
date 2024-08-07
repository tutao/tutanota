import o from "@tutao/otest"
import { MailFolderTypeRef, MailTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { MailSetKind } from "../../../../src/common/api/common/TutanotaConstants.js"
import { FolderSystem } from "../../../../src/common/api/common/mail/FolderSystem.js"
import { createTestEntity } from "../../TestUtils.js"
import { getElementId } from "../../../../src/common/api/common/utils/EntityUtils.js"

o.spec("FolderSystem", function () {
	const listId = "listId"
	const inbox = createTestEntity(MailFolderTypeRef, { _id: [listId, "inbox"], folderType: MailSetKind.INBOX })
	const archive = createTestEntity(MailFolderTypeRef, { _id: [listId, "archive"], folderType: MailSetKind.ARCHIVE })
	const customFolder = createTestEntity(MailFolderTypeRef, {
		_id: [listId, "custom"],
		folderType: MailSetKind.CUSTOM,
		name: "X",
	})
	const customSubfolder = createTestEntity(MailFolderTypeRef, {
		_id: [listId, "customSub"],
		folderType: MailSetKind.CUSTOM,
		parentFolder: customFolder._id,
		name: "AA",
		mails: "customSubMailList",
	})
	const customSubSubfolder = createTestEntity(MailFolderTypeRef, {
		_id: [listId, "customSubSub"],
		folderType: MailSetKind.CUSTOM,
		parentFolder: customSubfolder._id,
		name: "B",
	})
	const customSubSubfolderAnother = createTestEntity(MailFolderTypeRef, {
		_id: [listId, "customSubSubAnother"],
		folderType: MailSetKind.CUSTOM,
		parentFolder: customSubfolder._id,
		name: "A",
	})

	const mail = createTestEntity(MailTypeRef, { _id: ["mailListId", "inbox"], sets: [customSubfolder._id] })

	const allFolders = [archive, inbox, customFolder, customSubfolder, customSubSubfolder, customSubSubfolderAnother]

	o("correctly builds the subtrees", function () {
		const system = new FolderSystem(allFolders)

		o(system.systemSubtrees).deepEquals([
			{ folder: inbox, children: [] },
			{ folder: archive, children: [] },
		])("system subtrees")
		o(system.customSubtrees).deepEquals([
			{
				folder: customFolder,
				children: [
					{
						folder: customSubfolder,
						children: [
							{ folder: customSubSubfolderAnother, children: [] },
							{ folder: customSubSubfolder, children: [] },
						],
					},
				],
			},
		])("custom subtrees")
	})

	o("indented list sorts folders correctly on the same level", function () {
		const system = new FolderSystem(allFolders)

		o(system.getIndentedList()).deepEquals([
			{ level: 0, folder: inbox },
			{ level: 0, folder: archive },
			{ level: 0, folder: customFolder },
			{ level: 1, folder: customSubfolder },
			{ level: 2, folder: customSubSubfolderAnother },
			{ level: 2, folder: customSubSubfolder },
		])
	})

	o("indented list sorts stepsiblings correctly", function () {
		const customFolderAnother = createTestEntity(MailFolderTypeRef, {
			_id: [listId, "customAnother"],
			folderType: MailSetKind.CUSTOM,
			name: "Another top-level custom",
		})
		const customFolderAnotherSub = createTestEntity(MailFolderTypeRef, {
			_id: [listId, "customAnotherSub"],
			folderType: MailSetKind.CUSTOM,
			parentFolder: customFolderAnother._id,
			name: "Y",
		})

		const system = new FolderSystem([...allFolders, customFolderAnother, customFolderAnotherSub])

		o(system.getIndentedList()).deepEquals([
			{ level: 0, folder: inbox },
			{ level: 0, folder: archive },
			{ level: 0, folder: customFolderAnother },
			{ level: 1, folder: customFolderAnotherSub },
			{ level: 0, folder: customFolder },
			{ level: 1, folder: customSubfolder },
			{ level: 2, folder: customSubSubfolderAnother },
			{ level: 2, folder: customSubSubfolder },
		])
	})

	o("indented list will not return folder or descendants of given folder", function () {
		const system = new FolderSystem(allFolders)
		o(system.getIndentedList(customSubfolder)).deepEquals([
			{ level: 0, folder: inbox },
			{ level: 0, folder: archive },
			{ level: 0, folder: customFolder },
		])
	})

	o("getSystemFolderByType", function () {
		const system = new FolderSystem(allFolders)

		o(system.getSystemFolderByType(MailSetKind.ARCHIVE)).deepEquals(archive)
	})

	o("getFolderById", function () {
		const system = new FolderSystem(allFolders)

		o(system.getFolderById(getElementId(archive))).deepEquals(archive)
	})

	o("getFolderById not there returns null", function () {
		const system = new FolderSystem(allFolders)

		o(system.getFolderById("randomId")).equals(null)
	})

	o("getFolderByMail", function () {
		const system = new FolderSystem(allFolders)
		o(system.getFolderByMail(mail)).equals(customSubfolder)
	})

	o("getCustomFoldersOfParent", function () {
		const system = new FolderSystem(allFolders)

		o(system.getCustomFoldersOfParent(customSubfolder._id)).deepEquals([customSubSubfolderAnother, customSubSubfolder])
	})

	o("getPathToFolder", function () {
		const system = new FolderSystem(allFolders)

		o(system.getPathToFolder(customSubSubfolder._id)).deepEquals([customFolder, customSubfolder, customSubSubfolder])
	})
})
