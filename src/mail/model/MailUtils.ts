import type {Contact, EncryptedMailAddress, InboxRule, Mail, MailFolder, TutanotaProperties} from "../../api/entities/tutanota/TypeRefs.js"
import {createContact, createContactMailAddress, createEncryptedMailAddress} from "../../api/entities/tutanota/TypeRefs.js"
import {
	ContactAddressType,
	ConversationType,
	getMailFolderType,
	GroupType,
	MailFolderType,
	MailState,
	MAX_ATTACHMENT_SIZE,
	ReplyType,
	TUTANOTA_MAIL_ADDRESS_DOMAINS,
} from "../../api/common/TutanotaConstants"
import {assertNotNull, contains, endsWith, neverNull, noOp, ofClass} from "@tutao/tutanota-utils"
import {assertMainOrNode, isDesktop} from "../../api/common/Env"
import {LockedError, NotFoundError} from "../../api/common/error/RestError"
import type {LoginController} from "../../api/main/LoginController"
import {logins as globalLogins} from "../../api/main/LoginController"
import type {Language, TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {Icons} from "../../gui/base/icons/Icons"
import type {MailboxDetail} from "./MailModel"
import type {lazyIcon} from "../../gui/base/Icon"
import type {GroupInfo, User} from "../../api/entities/sys/TypeRefs.js"
import {CustomerPropertiesTypeRef} from "../../api/entities/sys/TypeRefs.js"
import type {UserController} from "../../api/main/UserController"
import type {EntityClient} from "../../api/common/EntityClient"
import {getEnabledMailAddressesForGroupInfo, getGroupInfoDisplayName} from "../../api/common/utils/GroupUtils"
import {fullNameToFirstAndLastName, mailAddressToFirstAndLastName} from "../../misc/parsing/MailAddressParser"
import type {Attachment} from "../editor/SendMailModel"

assertMainOrNode()
export const LINE_BREAK = "<br>"

export function isTutanotaMailAddress(mailAddress: string): boolean {
	var tutanotaDomains = TUTANOTA_MAIL_ADDRESS_DOMAINS

	for (var i = 0; i < tutanotaDomains.length; i++) {
		if (mailAddress.endsWith("@" + tutanotaDomains[i])) {
			return true
		}
	}

	return false
}

/**
 * Creates a contact with an email address and a name.
 * @param mailAddress The mail address of the contact. Type is OTHER.
 * @param name The name of the contact. If an empty string is provided, the name is parsed from the mail address.
 * @return The contact.
 */
export function createNewContact(user: User, mailAddress: string, name: string): Contact {
	// prepare some contact information. it is only saved if the mail is sent securely
	// use the name or mail address to extract first and last name. first part is used as first name, all other parts as last name
	let firstAndLastName = name.trim() !== "" ? fullNameToFirstAndLastName(name) : mailAddressToFirstAndLastName(mailAddress)
	let contact = createContact()
	contact._owner = user._id
	contact._ownerGroup = assertNotNull(user.memberships.find(m => m.groupType === GroupType.Contact)).group
	contact.firstName = firstAndLastName.firstName
	contact.lastName = firstAndLastName.lastName
	let ma = createContactMailAddress()
	ma.address = mailAddress
	ma.type = ContactAddressType.OTHER
	ma.customTypeName = ""
	contact.mailAddresses.push(ma)
	return contact
}

export function getDisplayText(name: string | null, mailAddress: string, preferNameOnly: boolean): string {
	if (!name) {
		return mailAddress
	} else if (preferNameOnly) {
		return name
	} else {
		return name + " <" + mailAddress + ">"
	}
}

export function getSenderOrRecipientHeading(mail: Mail, preferNameOnly: boolean): string {
	if (mail.state === MailState.RECEIVED) {
		if (isExcludedMailAddress(mail.sender.address)) {
			return ""
		} else {
			return getDisplayText(mail.sender.name, mail.sender.address, preferNameOnly)
		}
	} else {
		let allRecipients = mail.toRecipients.concat(mail.ccRecipients).concat(mail.bccRecipients)

		if (allRecipients.length > 0) {
			return getDisplayText(allRecipients[0].name, allRecipients[0].address, preferNameOnly) + (allRecipients.length > 1 ? ", ..." : "")
		} else {
			return ""
		}
	}
}

export function getSenderOrRecipientHeadingTooltip(mail: Mail): string {
	if (isTutanotaTeamMail(mail) && !isExcludedMailAddress(mail.sender.address)) {
		return lang.get("tutaoInfo_msg")
	} else {
		return ""
	}
}

export function isTutanotaTeamMail(mail: Mail): boolean {
	return mail.confidential && mail.state === MailState.RECEIVED && endsWith(mail.sender.address, "@tutao.de")
}

export function isExcludedMailAddress(mailAddress: string): boolean {
	return mailAddress === "no-reply@tutao.de"
}

/**
 * @return {string} default mail address
 */
export function getDefaultSenderFromUser({props, userGroupInfo}: UserController): string {
	return props.defaultSender && contains(getEnabledMailAddressesForGroupInfo(userGroupInfo), props.defaultSender)
		? props.defaultSender
		: neverNull(userGroupInfo.mailAddress)
}

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
			return lang.get("archive_action")

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

export function getFolderIconByType(folderType: MailFolderType): lazyIcon {
	switch (folderType) {
		case "0":
			return () => Icons.Folder

		case "1":
			return () => Icons.Inbox

		case "2":
			return () => Icons.Send

		case "3":
			return () => Icons.Trash

		case "4":
			return () => Icons.Archive

		case "5":
			return () => Icons.Spam

		case "6":
			return () => Icons.Edit

		default:
			return () => Icons.Folder
	}
}

export function getFolderIcon(folder: MailFolder): lazyIcon {
	return getFolderIconByType(getMailFolderType(folder))
}

export function getFolder(folders: MailFolder[], type: MailFolderType): MailFolder {
	const folder = folders.find(f => f.folderType === type)
	return neverNull(folder)
}

export function getInboxFolder(folders: MailFolder[]): MailFolder {
	return getFolder(folders, MailFolderType.INBOX)
}

export function getArchiveFolder(folders: MailFolder[]): MailFolder {
	return getFolder(folders, MailFolderType.ARCHIVE)
}

export function getDraftFolder(folders: MailFolder[]): MailFolder {
	return getFolder(folders, MailFolderType.DRAFT)
}

export function getSortedSystemFolders(folders: MailFolder[]): MailFolder[] {
	return folders
		.filter(f => f.folderType !== MailFolderType.CUSTOM)
		.sort((folder1, folder2) => {
			// insert the draft folder after inbox (use type number 1.5 which is after inbox)
			if (folder1.folderType === MailFolderType.DRAFT) {
				return 1.5 - Number(folder2.folderType)
			} else if (folder2.folderType === MailFolderType.DRAFT) {
				return Number(folder1.folderType) - 1.5
			}

			return Number(folder1.folderType) - Number(folder2.folderType)
		})
}

export function getSortedCustomFolders(folders: MailFolder[]): MailFolder[] {
	return folders
		.filter(f => f.folderType === MailFolderType.CUSTOM)
		.sort((folder1, folder2) => {
			return folder1.name.localeCompare(folder2.name)
		})
}

/**
 * @deprecated Avoid grabbing singleton dependencies, use {@link getEnabledMailAddressesWithUser} instead to explicitly show dependencies.
 */
export function getEnabledMailAddresses(mailboxDetails: MailboxDetail): string[] {
	return getEnabledMailAddressesWithUser(mailboxDetails, globalLogins.getUserController().userGroupInfo)
}

export function getEnabledMailAddressesWithUser(mailboxDetail: MailboxDetail, userGroupInfo: GroupInfo): Array<string> {
	if (isUserMailbox(mailboxDetail)) {
		return getEnabledMailAddressesForGroupInfo(userGroupInfo)
	} else {
		return getEnabledMailAddressesForGroupInfo(mailboxDetail.mailGroupInfo)
	}
}

export function isUserMailbox(mailboxDetails: MailboxDetail): boolean {
	return mailboxDetails.mailGroup != null && mailboxDetails.mailGroup.user != null
}

export function getDefaultSender(logins: LoginController, mailboxDetails: MailboxDetail): string {
	if (isUserMailbox(mailboxDetails)) {
		let props = logins.getUserController().props
		return props.defaultSender && contains(getEnabledMailAddressesWithUser(mailboxDetails, logins.getUserController().userGroupInfo), props.defaultSender)
			? props.defaultSender
			: neverNull(logins.getUserController().userGroupInfo.mailAddress)
	} else {
		return neverNull(mailboxDetails.mailGroupInfo.mailAddress)
	}
}

/** @deprecated use {@link getSenderNameForUser} instead */
export function getSenderName(mailboxDetails: MailboxDetail): string {
	return getSenderNameForUser(mailboxDetails, globalLogins.getUserController())
}

export function getSenderNameForUser(mailboxDetails: MailboxDetail, userController: UserController): string {
	if (isUserMailbox(mailboxDetails)) {
		// external users do not have access to the user group info
		return userController.userGroupInfo.name
	} else {
		return mailboxDetails.mailGroupInfo ? mailboxDetails.mailGroupInfo.name : ""
	}
}

export function getMailboxName(logins: LoginController, mailboxDetails: MailboxDetail): string {
	if (!logins.isInternalUserLoggedIn()) {
		return lang.get("mailbox_label")
	} else if (isUserMailbox(mailboxDetails)) {
		return getGroupInfoDisplayName(logins.getUserController().userGroupInfo)
	} else {
		return getGroupInfoDisplayName(neverNull(mailboxDetails.mailGroupInfo))
	}
}

export interface ImageHandler {
	insertImage(srcAttr: string, attrs?: Record<string, string>): HTMLElement
}

export function markMails(entityClient: EntityClient, mails: Mail[], unread: boolean): Promise<void> {
	return Promise.all(
		mails.map(mail => {
			if (mail.unread !== unread) {
				mail.unread = unread
				return entityClient.update(mail).catch(ofClass(NotFoundError, noOp)).catch(ofClass(LockedError, noOp))
			} else {
				return Promise.resolve()
			}
		}),
	).then(noOp)
}

/**
 * Check if all mails in the selection are drafts. If there are mixed drafts and non-drafts or the array is empty, return true.
 * @param mails
 */
export function emptyOrContainsDraftsAndNonDrafts(mails: ReadonlyArray<Mail>): boolean {
	return mails.length === 0
		|| (
			mails.some(mail => mail.state === MailState.DRAFT)
			&& mails.some(mail => mail.state !== MailState.DRAFT)
		)
}

/**
 * Return true if all mails in the array are allowed to go inside the folder (e.g. drafts can go in drafts but not inbox)
 * @param mails
 * @param folder
 */
export function allMailsAllowedInsideFolder(mails: ReadonlyArray<Mail>, folder: MailFolder): boolean {
	for(const mail of mails) {
		if(!mailStateAllowedInsideFolderType(mail.state, folder.folderType)) {
			return false
		}
	}
	return true
}

/**
 * Return true if mail of a given type are allowed to be in a folder of a given type (e.g. drafts can go in drafts but not inbox)
 * @param mailState
 * @param folderType
 */
export function mailStateAllowedInsideFolderType(mailState: string, folderType: string) {
	if(mailState === MailState.DRAFT) {
		return folderType === MailFolderType.DRAFT || folderType === MailFolderType.TRASH
	}
	else {
		return folderType !== MailFolderType.DRAFT
	}
}

export function copyMailAddress({address, name}: EncryptedMailAddress): EncryptedMailAddress {
	return createEncryptedMailAddress({
		address,
		name,
	})
}

export function getTemplateLanguages(sortedLanguages: Array<Language>, entityClient: EntityClient, loginController: LoginController): Promise<Array<Language>> {
	return loginController
		.getUserController()
		.loadCustomer()
		.then(customer => entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties)))
		.then(customerProperties => {
			return sortedLanguages.filter(sL => customerProperties.notificationMailTemplates.find(nmt => nmt.language === sL.code))
		})
		.catch(() => [])
}

export function conversationTypeString(conversationType: ConversationType): string {
	let key: TranslationKey

	switch (conversationType) {
		case ConversationType.NEW:
			key = "newMail_action"
			break

		case ConversationType.REPLY:
			key = "reply_action"
			break

		case ConversationType.FORWARD:
			key = "forward_action"
			break

		default:
			key = "emptyString_msg"
	}

	return lang.get(key)
}

export function getExistingRuleForType(props: TutanotaProperties, cleanValue: string, type: string): InboxRule | null {
	return props.inboxRules.find(rule => type === rule.type && cleanValue === rule.value) ?? null
}

export function canDoDragAndDropExport(): boolean {
	return isDesktop()
}

type AttachmentSizeCheckResult = {
	attachableFiles: Array<Attachment>
	tooBigFiles: Array<string>
}

/**
 * @param files the files that shall be attached.
 * @param maxAttachmentSize the maximum size the new files may have in total to be attached successfully.
 */
export function checkAttachmentSize(files: ReadonlyArray<Attachment>, maxAttachmentSize: number = MAX_ATTACHMENT_SIZE): AttachmentSizeCheckResult {
	let totalSize = 0
	const attachableFiles: Array<Attachment> = []
	const tooBigFiles: Array<string> = []
	files.forEach(file => {
		if (totalSize + Number(file.size) > maxAttachmentSize) {
			tooBigFiles.push(file.name)
		} else {
			totalSize += Number(file.size)
			attachableFiles.push(file)
		}
	})
	return {
		attachableFiles,
		tooBigFiles,
	}
}

/**
 * @returns {boolean} true if the given mail was already replied to. Otherwise false.
 * Note that it also returns true if the mail was replied to AND forwarded.
 */
export function isRepliedTo(mail: Mail): boolean {
	return mail.replyType === ReplyType.REPLY || mail.replyType === ReplyType.REPLY_FORWARD
}

export enum RecipientField {
	TO = "to",
	CC = "cc",
	BCC = "bcc",
}