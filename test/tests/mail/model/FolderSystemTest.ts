import o from "@tutao/otest"
import { getElementId } from "../../../../src/platform-kit/meta"
import { FolderSystem } from "../../../../src/applications/common/api/common/mail/FolderSystem.js"
import { createTestEntity } from "../../TestUtils.js"

import { MailSetKind } from "../../../../src/entities/tutanota/Utils"
import { MailSetTypeRef, MailTypeRef } from "@tutao/entities/tutanota"

o.spec("FolderSystem", function () {
	const listId = "listId"
	const inbox = createTestEntity(MailSetTypeRef, { _id: [listId, "inbox"], folderType: MailSetKind.INBOX })
	const archive = createTestEntity(MailSetTypeRef, { _id: [listId, "archive"], folderType: MailSetKind.ARCHIVE })
	const customFolder = createTestEntity(MailSetTypeRef, {
		_id: [listId, "custom"],
		folderType: MailSetKind.CUSTOM,
		name: "X",
	})
	const customSubfolder = createTestEntity(MailSetTypeRef, {
		_id: [listId, "customSub"],
		folderType: MailSetKind.CUSTOM,
		parentFolder: customFolder._id,
		name: "AA",
	})
	const customSubSubfolder = createTestEntity(MailSetTypeRef, {
		_id: [listId, "customSubSub"],
		folderType: MailSetKind.CUSTOM,
		parentFolder: customSubfolder._id,
		name: "B",
	})
	const customSubSubfolderAnother = createTestEntity(MailSetTypeRef, {
		_id: [listId, "customSubSubAnother"],
		folderType: MailSetKind.CUSTOM,
		parentFolder: customSubfolder._id,
		name: "A",
	})
	const orphanFolder = createTestEntity(MailSetTypeRef, {
		_id: [listId, "orphan"],
		folderType: MailSetKind.CUSTOM,
		parentFolder: [listId, "deletedParent"],
		name: "Orphan",
	})
	const subOrphanFolder1 = createTestEntity(MailSetTypeRef, {
		_id: [listId, "subOrphan1"],
		folderType: MailSetKind.CUSTOM,
		parentFolder: orphanFolder._id,
		name: "Sub-Orphan 1",
	})
	const subOrphanFolder2 = createTestEntity(MailSetTypeRef, {
		_id: [listId, "subOrphan2"],
		folderType: MailSetKind.CUSTOM,
		parentFolder: orphanFolder._id,
		name: "Sub-Orphan 2",
	})
	const subSubOrphanFolder = createTestEntity(MailSetTypeRef, {
		_id: [listId, "subSubOrphan"],
		folderType: MailSetKind.CUSTOM,
		parentFolder: subOrphanFolder2._id,
		name: "Sub-Sub-Orphan",
	})

	const mail = createTestEntity(MailTypeRef, { _id: ["mailListId", "inbox"], sets: [customSubfolder._id] })
	const mailInOrphanFolder = createTestEntity(MailTypeRef, { _id: ["mailListId", "orphanMail"], sets: [orphanFolder._id] })
	const mailInSubOrphanFolder = createTestEntity(MailTypeRef, { _id: ["mailListId", "subOrphanMail"], sets: [subOrphanFolder1._id] })

	const allFolders = [
		archive,
		inbox,
		customFolder,
		customSubfolder,
		customSubSubfolder,
		customSubSubfolderAnother,
		orphanFolder,
		subOrphanFolder1,
		subOrphanFolder2,
		subSubOrphanFolder,
	]

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
		o(system.orphanSubtrees).deepEquals([
			{
				folder: orphanFolder,
				children: [
					{
						folder: subOrphanFolder1,
						children: [],
					},
					{
						folder: subOrphanFolder2,
						children: [{ folder: subSubOrphanFolder, children: [] }],
					},
				],
			},
		])("orphan subtrees")
	})

	o("indented list sorts mailSets correctly on the same level", function () {
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
		const customFolderAnother = createTestEntity(MailSetTypeRef, {
			_id: [listId, "customAnother"],
			folderType: MailSetKind.CUSTOM,
			name: "Another top-level custom",
		})
		const customFolderAnotherSub = createTestEntity(MailSetTypeRef, {
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
		o(system.getFolderById(getElementId(orphanFolder))).deepEquals(orphanFolder)
		o(system.getFolderById(getElementId(subSubOrphanFolder))).deepEquals(subSubOrphanFolder)
	})

	o("getFolderById not there returns null", function () {
		const system = new FolderSystem(allFolders)

		o(system.getFolderById("randomId")).equals(null)
	})

	o("getFolderByMail", function () {
		const system = new FolderSystem(allFolders)
		o(system.getFolderByMail(mail)).equals(customSubfolder)
		o(system.getFolderByMail(mailInOrphanFolder)).equals(orphanFolder)
		o(system.getFolderByMail(mailInSubOrphanFolder)).equals(subOrphanFolder1)
	})

	o("getCustomFoldersOfParent", function () {
		const system = new FolderSystem(allFolders)

		o(system.getCustomFoldersOfParent(customSubfolder._id)).deepEquals([customSubSubfolderAnother, customSubSubfolder])
		o(system.getCustomFoldersOfParent(orphanFolder._id)).deepEquals([subOrphanFolder1, subOrphanFolder2])
	})

	o("getPathToFolder", function () {
		const system = new FolderSystem(allFolders)

		o(system.getPathToFolder(customSubSubfolder._id)).deepEquals([customFolder, customSubfolder, customSubSubfolder])
		o(system.getPathToFolder(subSubOrphanFolder._id)).deepEquals([orphanFolder, subOrphanFolder2, subSubOrphanFolder])
	})
})
