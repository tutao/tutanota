import { FolderSystem, IndentedFolder } from "../../../common/api/common/mail/FolderSystem.js"
import { Header, InboxRule, Mail, MailDetails, MailFolder, TutanotaProperties } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { assertNotNull, first } from "@tutao/tutanota-utils"
import { MailModel } from "./MailModel.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { MailSetKind, ReplyType, SYSTEM_FOLDERS, SystemFolderType } from "../../../common/api/common/TutanotaConstants.js"
import { isSameId, sortCompareByReverseId } from "../../../common/api/common/utils/EntityUtils"

export type FolderInfo = { level: number; folder: MailFolder }

export const enum MoveService {
	RegularMove = "RegularMove",
	SimpleMove = "SimpleMove",
}

export interface RegularMoveTargets {
	moveService: MoveService.RegularMove
	folders: readonly FolderInfo[]
}

export interface SimpleMoveTargets {
	moveService: MoveService.SimpleMove
	folders: readonly SystemFolderType[]
}

export type MoveTargets = RegularMoveTargets | SimpleMoveTargets

export const MAX_FOLDER_INDENT_LEVEL = 10

export function getFolderName(folder: MailFolder): string {
	switch (folder.folderType) {
		case MailSetKind.CUSTOM:
			return folder.name
		default:
			return getSystemFolderName(folder.folderType as MailSetKind)
	}
}

export function getSystemFolderName(folderType: MailSetKind): string {
	switch (folderType) {
		case MailSetKind.INBOX:
			return lang.get("received_action")

		case MailSetKind.SENT:
			return lang.get("sent_action")

		case MailSetKind.TRASH:
			return lang.get("trash_action")

		case MailSetKind.ARCHIVE:
			return lang.get("archive_label")

		case MailSetKind.SPAM:
			return lang.get("spam_action")

		case MailSetKind.DRAFT:
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

export async function getMoveTargetFolderSystems(foldersModel: MailModel, mails: readonly Mail[]): Promise<MoveTargets> {
	const regularMoveTargets = (folders: readonly FolderInfo[]): RegularMoveTargets => ({
		moveService: MoveService.RegularMove,
		folders,
	})

	const firstMail = first(mails)
	if (firstMail == null) return regularMoveTargets([])

	const mailboxDetails = await foldersModel.getMailboxDetailsForMail(firstMail)
	if (mailboxDetails == null || mailboxDetails.mailbox.folders == null) {
		return regularMoveTargets([])
	}

	const folders = await foldersModel.getMailboxFoldersForId(mailboxDetails.mailbox.folders._id)
	if (folders == null) {
		return regularMoveTargets([])
	}
	const folderOfFirstMail = foldersModel.getMailFolderForMail(firstMail)
	if (folderOfFirstMail == null) {
		return regularMoveTargets([])
	}

	const areMailsInDifferentMailboxes = mails.length > 1 && mails.some((mail) => !isSameId(firstMail._ownerGroup, mail._ownerGroup))
	if (areMailsInDifferentMailboxes) {
		const areMailsInDifferentFolderTypes = mails.some((mail) => {
			return folderOfFirstMail.folderType !== foldersModel.getMailFolderForMail(mail)?.folderType
		})

		return {
			moveService: MoveService.SimpleMove,
			folders: areMailsInDifferentFolderTypes ? SYSTEM_FOLDERS : SYSTEM_FOLDERS.filter((f) => f !== folderOfFirstMail.folderType),
		}
	}

	const areMailsInDifferentFolders =
		mails.length > 1 &&
		mails.some((mail) => {
			return !isSameId(folderOfFirstMail._id, assertNotNull(foldersModel.getMailFolderForMail(mail))._id)
		})

	if (areMailsInDifferentFolders) {
		return regularMoveTargets(folders.getIndentedList())
	} else {
		return regularMoveTargets(folders.getIndentedList().filter((f: IndentedFolder) => !isSameId(f.folder._id, folderOfFirstMail._id)))
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

export function loadMailHeaders(mailDetails: MailDetails): string | null {
	return mailDetails.headers != null ? getMailHeaders(mailDetails.headers) : null
}

export function getExistingRuleForType(props: TutanotaProperties, cleanValue: string, type: string): InboxRule | null {
	return props.inboxRules.find((rule) => type === rule.type && cleanValue === rule.value) ?? null
}

export function allInSameMailbox(mails: readonly Mail[]): boolean {
	const mailGroups = mails.map((m) => m._ownerGroup)
	return mailGroups.every((mg) => mg === mailGroups[0])
	// returns true if mails is empty
}

export function mailInFolder(mail: Mail, folderId: IdTuple): boolean {
	return mail.sets.some((s) => isSameId(s, folderId))
}

/**
 * Compare the mails by receive date for sorting.
 * @param mail1
 * @param mail2
 * @return 0 if same received date and ID, >0 if mail2 is newer, <0 if mail2 is older
 */
export function compareMails(mail1: Mail, mail2: Mail): number {
	const dateDifference = mail2.receivedDate.getTime() - mail1.receivedDate.getTime()
	if (dateDifference === 0) {
		return sortCompareByReverseId(mail1, mail2)
	} else {
		return dateDifference
	}
}

/**
 * @returns {boolean} true if the given mail was already replied to. Otherwise false.
 * Note that it also returns true if the mail was replied to AND forwarded.
 */
export function isRepliedTo(mail: Mail): boolean {
	return mail.replyType === ReplyType.REPLY || mail.replyType === ReplyType.REPLY_FORWARD
}
