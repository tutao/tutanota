import { FolderSystem, IndentedFolder } from "../../../common/api/common/mail/FolderSystem.js"
import { Header, InboxRule, Mail, MailDetails, MailFolder, TutanotaProperties } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { assertNotNull, contains, first, isNotEmpty, neverNull } from "@tutao/tutanota-utils"
import { MailModel } from "./MailModel.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { UserController } from "../../../common/api/main/UserController.js"
import { getEnabledMailAddressesForGroupInfo } from "../../../common/api/common/utils/GroupUtils.js"
import { MailSetKind, SystemFolderType } from "../../../common/api/common/TutanotaConstants.js"
import { isSameId } from "../../../common/api/common/utils/EntityUtils"

export type FolderInfo = { level: number; folder: MailFolder }
export const MAX_FOLDER_INDENT_LEVEL = 10

export function getFolderName(folder: MailFolder): string {
	switch (folder.folderType) {
		case "0":
			return folder.name

		case "1":
			return lang.get("received_action")

		case "2":
			return lang.get("sent_action")

		case "3":
			return lang.get("trash_action")

		case "4":
			return lang.get("archive_label")

		case "5":
			return lang.get("spam_action")

		case "6":
			return lang.get("draft_action")

		default:
			// do not throw an error - new system folders may cause problems
			//throw new Error("illegal folder type: " + this.folder.getFolderType())
			return ""
	}
}

export function getIndentedFolderNameForDropdown(folderInfo: FolderInfo) {
	const indentLevel = Math.min(folderInfo.level, MAX_FOLDER_INDENT_LEVEL)
	return ". ".repeat(indentLevel) + getFolderName(folderInfo.folder)
}

export async function getMoveTargetFolderSystems(foldersModel: MailModel, mails: readonly Mail[]): Promise<Array<FolderInfo>> {
	const firstMail = first(mails)
	if (firstMail == null) return []

	const mailboxDetails = await foldersModel.getMailboxDetailsForMail(firstMail)
	if (mailboxDetails == null || mailboxDetails.mailbox.folders == null) {
		return []
	}

	const folders = await foldersModel.getMailboxFoldersForId(mailboxDetails.mailbox.folders._id)
	if (folders == null) {
		return []
	}
	const folderOfFirstMail = foldersModel.getMailFolderForMail(firstMail)
	if (folderOfFirstMail == null) {
		return []
	}

	const areMailsInDifferentFolders =
		mails.length > 1 &&
		mails.some((mail) => {
			return !isSameId(folderOfFirstMail._id, assertNotNull(foldersModel.getMailFolderForMail(mail))._id)
		})

	if (areMailsInDifferentFolders) {
		return folders.getIndentedList()
	} else {
		return folders.getIndentedList().filter((f: IndentedFolder) => {
			return !isSameId(f.folder._id, folderOfFirstMail._id)
		})
	}
}

export async function getMoveTargetFolderSystemsForMailsInFolder(foldersModel: MailModel, currentFolder: MailFolder): Promise<Array<FolderInfo>> {
	const mailboxDetails = await foldersModel.getMailboxDetailsForMailFolder(currentFolder)
	if (mailboxDetails == null || mailboxDetails.mailbox.folders == null) {
		return []
	}

	const folders = await foldersModel.getMailboxFoldersForId(mailboxDetails.mailbox.folders._id)
	if (folders == null) {
		return []
	}

	return folders.getIndentedList().filter((f: IndentedFolder) => {
		return !isSameId(f.folder._id, currentFolder._id)
	})
}

/**
 * Gets a system folder of the specified type and unwraps it.
 * Some system folders don't exist in some cases, e.g. spam or archive for external mailboxes!
 *
 * Use with caution.
 */
export function assertSystemFolderOfType(system: FolderSystem, type: SystemFolderType): MailFolder {
	return assertNotNull(system.getSystemFolderByType(type), "System folder of type does not exist!")
}

export function getPathToFolderString(folderSystem: FolderSystem, folder: MailFolder, omitLast = false) {
	const folderPath = folderSystem.getPathToFolder(folder._id)
	if (omitLast) {
		folderPath.pop()
	}
	return folderPath.map(getFolderName).join(" · ")
}

export function getMailHeaders(headers: Header): string {
	return headers.compressedHeaders ?? headers.headers ?? ""
}

export async function loadMailHeaders(mailDetails: MailDetails): Promise<string | null> {
	return mailDetails.headers != null ? getMailHeaders(mailDetails.headers) : null
}

export function getExistingRuleForType(props: TutanotaProperties, cleanValue: string, type: string): InboxRule | null {
	return props.inboxRules.find((rule) => type === rule.type && cleanValue === rule.value) ?? null
}

/**
 * @return {string} default mail address
 */
export function getDefaultSenderFromUser({ props, userGroupInfo }: UserController): string {
	return props.defaultSender && contains(getEnabledMailAddressesForGroupInfo(userGroupInfo), props.defaultSender)
		? props.defaultSender
		: neverNull(userGroupInfo.mailAddress)
}

export function allInSameMailbox(mails: readonly Mail[]): boolean {
	const mailGroups = mails.map((m) => m._ownerGroup)
	return mailGroups.every((mg) => mg === mailGroups[0])
	// returns true if mails is empty
}

export function mailInFolder(mail: Mail, folderId: IdTuple): boolean {
	return mail.sets.some((s) => isSameId(s, folderId))
}
