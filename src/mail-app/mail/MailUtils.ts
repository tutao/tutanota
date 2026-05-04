//@bundleInto:common
import { Const, FREE_OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS, PAID_OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS } from "@tutao/app-env"
import { downcast } from "@tutao/utils"
import { getAsEnumValue } from "@tutao/meta"
import { MailSet, MailSetKind, SpamRuleFieldType, SpamRuleType, SYSTEM_FOLDERS } from "@tutao/entities/tutanota"
import { AccountType, EmailSenderListElement } from "@tutao/entities/sys"

export const getMailFolderType = (folder: MailSet): MailSetKind => downcast(folder.folderType)

export function isFolder(folder: MailSet): boolean {
	switch (folder.folderType) {
		case MailSetKind.CUSTOM:
		case MailSetKind.INBOX:
		case MailSetKind.SENT:
		case MailSetKind.TRASH:
		case MailSetKind.ARCHIVE:
		case MailSetKind.SPAM:
		case MailSetKind.DRAFT:
		case MailSetKind.SCHEDULED:
			return true
		case MailSetKind.ALL:
		case MailSetKind.LABEL:
		case MailSetKind.IMPORTED:
		default:
			return false
	}
}

/**
 * These are mail sets that are managed by the server and cannot be mutated by the client
 *
 * They have the following restrictions:
 *
 * - Mails cannot be moved in or out of these folders by the client (most other actions are still possible, such as labels and marking read/unread)
 * - Subfolders cannot be created or moved in this folder by the client
 */
export const READ_ONLY_SYSTEM_FOLDERS = Object.freeze([MailSetKind.SCHEDULED])

/**
 * @return true if {@link mailSet} is a read-only folder (see {@link READ_ONLY_SYSTEM_FOLDERS} for more info)
 */
export function isFolderReadOnly(mailSet: MailSet) {
	return READ_ONLY_SYSTEM_FOLDERS.includes(mailSet.folderType as MailSetKind)
}

export function isPermanentDeleteAllowedMailSetKind(mailsetKind: MailSetKind) {
	switch (mailsetKind) {
		case MailSetKind.TRASH:
		case MailSetKind.SPAM:
			return true
		case MailSetKind.CUSTOM:
		case MailSetKind.LABEL:
		case MailSetKind.INBOX:
		case MailSetKind.DRAFT:
		case MailSetKind.SENT:
		case MailSetKind.ARCHIVE:
		case MailSetKind.ALL:
		case MailSetKind.IMPORTED:
		case MailSetKind.SCHEDULED:
		default:
			return false
	}
}

export function isPermanentDeleteAllowedForFolder(mailSet: MailSet) {
	return isPermanentDeleteAllowedMailSetKind(mailSet.folderType as MailSetKind)
}

export function isNestableMailSet(mailSet: MailSet): boolean {
	return mailSet.folderType === MailSetKind.CUSTOM
}

export function isVisibleSystemMailSet(mailSet: MailSet): boolean {
	switch (mailSet.folderType) {
		case MailSetKind.INBOX:
		case MailSetKind.SENT:
		case MailSetKind.TRASH:
		case MailSetKind.ARCHIVE:
		case MailSetKind.SPAM:
		case MailSetKind.DRAFT:
		case MailSetKind.SCHEDULED:
			return true
		case MailSetKind.CUSTOM:
		case MailSetKind.ALL:
		case MailSetKind.LABEL:
		case MailSetKind.IMPORTED:
		default:
			return false
	}
}

export function canHaveDescendents(mailSet: MailSet): boolean {
	switch (mailSet.folderType) {
		case MailSetKind.CUSTOM:
		case MailSetKind.INBOX:
		case MailSetKind.DRAFT:
		case MailSetKind.SENT:
		case MailSetKind.ARCHIVE:
			return true
		case MailSetKind.TRASH:
		case MailSetKind.SPAM:
		case MailSetKind.ALL:
		case MailSetKind.LABEL:
		case MailSetKind.IMPORTED:
		case MailSetKind.SCHEDULED:
		default:
			return false
	}
}

export function isEditableMailSet(mailSet: MailSet): boolean {
	switch (mailSet.folderType) {
		case MailSetKind.CUSTOM:
		case MailSetKind.LABEL:
			return true
		case MailSetKind.INBOX:
		case MailSetKind.DRAFT:
		case MailSetKind.SENT:
		case MailSetKind.TRASH:
		case MailSetKind.ARCHIVE:
		case MailSetKind.SPAM:
		case MailSetKind.ALL:
		case MailSetKind.IMPORTED:
		case MailSetKind.SCHEDULED:
		default:
			return false
	}
}

export function isTopLevelMailSet(mailSet: MailSet): boolean {
	return mailSet.parentFolder == null
}

export function isLabel(folder: MailSet): boolean {
	return folder.folderType === MailSetKind.LABEL
}

export function getMailSetKind(folder: MailSet): MailSetKind {
	return folder.folderType as MailSetKind
}

export const MOVE_SYSTEM_FOLDERS = Object.freeze([
	MailSetKind.INBOX,
	MailSetKind.SENT,
	MailSetKind.TRASH,
	MailSetKind.ARCHIVE,
	MailSetKind.SPAM,
	MailSetKind.DRAFT,
] as const)

export function getSpamRuleType(spamRule: EmailSenderListElement): SpamRuleType | null {
	return getAsEnumValue(SpamRuleType, spamRule.type)
}

export function getSpamRuleField(spamRule: EmailSenderListElement): SpamRuleFieldType {
	return downcast(spamRule.field)
}

export type SimpleMoveMailTarget = (typeof SYSTEM_FOLDERS)[number]

export function getOfflineStorageDefaultTimeRangeDays(accountType: AccountType): number {
	return accountType === AccountType.PAID ? PAID_OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS : FREE_OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS
}

/**
 * Gets the current date defined in the global `Const` object for testing purposes.
 * If null, fall back to the given parameter which defaults to `new Date()`
 */
export function getCurrentDate(fallback = new Date()) {
	return Const.CURRENT_DATE ?? fallback
}
