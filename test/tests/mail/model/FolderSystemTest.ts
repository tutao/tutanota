import o from "ospec"
import {createMailFolder} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import {MailFolderType} from "../../../../src/api/common/TutanotaConstants.js"
import {FolderSystem} from "../../../../src/mail/model/FolderSystem.js"

o.spec("FolderSystem", function () {
	const listId = "listId"
	const inbox = createMailFolder({_id: [listId, "inbox"], folderType: MailFolderType.INBOX})
	const archive = createMailFolder({_id: [listId, "archive"], folderType: MailFolderType.ARCHIVE})
	const customFolder = createMailFolder({
		_id: [listId, "custom"],
		folderType: MailFolderType.CUSTOM,
		name: "X",
	})
	const customSubfolder = createMailFolder({
		_id: [listId, "customSub"],
		folderType: MailFolderType.CUSTOM,
		parentFolder: customFolder._id,
		name: "AA",
		mails: "customSubMailList"
	})
	const customSubSubfolder = createMailFolder({
		_id: [listId, "customSubSub"],
		folderType: MailFolderType.CUSTOM,
		parentFolder: customSubfolder._id,
		name: "B",
	})
	const customSubSubfolderAnother = createMailFolder({
		_id: [listId, "customSubSubAnother"],
		folderType: MailFolderType.CUSTOM,
		parentFolder: customSubfolder._id,
		name: "A",
	})

	const allFolders = [archive, inbox, customFolder, customSubfolder, customSubSubfolder, customSubSubfolderAnother]

	o("correctly builds the subtrees", function () {
		const system = new FolderSystem(allFolders)

		o(system.systemSubtrees).deepEquals([
			{folder: inbox, children: []},
			{folder: archive, children: []},
		])("system subtrees")
		o(system.customSubtrees).deepEquals([
			{
				folder: customFolder,
				children: [
					{
						folder: customSubfolder,
						children: [
							{folder: customSubSubfolderAnother, children: []},
							{folder: customSubSubfolder, children: []}
						]
					}
				]
			}
		])("custom subtrees")
	})

	o("indented list sorts folders correctly on the same level", function () {
		const system = new FolderSystem(allFolders)

		o(system.getIndentedList()).deepEquals([
			{level: 0, folder: inbox},
			{level: 0, folder: archive},
			{level: 0, folder: customFolder},
			{level: 1, folder: customSubfolder},
			{level: 2, folder: customSubSubfolderAnother},
			{level: 2, folder: customSubSubfolder},
		])
	})

	o("indented list sorts stepsiblings correctly", function () {
		const customFolderAnother = createMailFolder({
			_id: [listId, "customAnother"],
			folderType: MailFolderType.CUSTOM,
			name: "Another top-level custom",
		})
		const customFolderAnotherSub = createMailFolder({
			_id: [listId, "customAnotherSub"],
			folderType: MailFolderType.CUSTOM,
			parentFolder: customFolderAnother._id,
			name: "Y",
		})

		const system = new FolderSystem([...allFolders, customFolderAnother, customFolderAnotherSub])

		o(system.getIndentedList()).deepEquals([
			{level: 0, folder: inbox},
			{level: 0, folder: archive},
			{level: 0, folder: customFolderAnother},
			{level: 1, folder: customFolderAnotherSub},
			{level: 0, folder: customFolder},
			{level: 1, folder: customSubfolder},
			{level: 2, folder: customSubSubfolderAnother},
			{level: 2, folder: customSubSubfolder},
		])
	})

	o("getSystemFolderByType", function () {
		const system = new FolderSystem(allFolders)

		o(system.getSystemFolderByType(MailFolderType.ARCHIVE)).deepEquals(archive)
	})

	o("getFolderById", function () {
		const system = new FolderSystem(allFolders)

		o(system.getFolderById(archive._id)).deepEquals(archive)
	})

	o("getFolderById not there returns null", function () {
		const system = new FolderSystem(allFolders)

		o(system.getFolderById([listId, "randomId"])).equals(null)
	})

	o("getFolderByMailListId", function () {
		const system = new FolderSystem(allFolders)

		o(system.getFolderByMailListId(customSubfolder.mails)).equals(customSubfolder)
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