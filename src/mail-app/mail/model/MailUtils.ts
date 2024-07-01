import type { Contact, EncryptedMailAddress, InboxRule, Mail, MailFolder, TutanotaProperties } from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	createContact,
	createContactMailAddress,
	createEncryptedMailAddress,
	Header,
	MailBodyTypeRef,
	MailHeaders,
	MailHeadersTypeRef,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	ContactAddressType,
	ConversationType,
	EncryptionAuthStatus,
	getMailFolderType,
	GroupType,
	MailFolderType,
	MailState,
	MAX_ATTACHMENT_SIZE,
	ReplyType,
} from "../../../common/api/common/TutanotaConstants"
import { assertNotNull, contains, first, neverNull } from "@tutao/tutanota-utils"
import { assertMainOrNode, isDesktop } from "../../../common/api/common/Env"
import type { LoginController } from "../../../common/api/main/LoginController"
import type { Language, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Icons } from "../../../common/gui/base/icons/Icons"
import type { MailboxDetail } from "./MailModel"
import { MailModel } from "./MailModel"
import type { AllIcons } from "../../../common/gui/base/Icon"
import type { GroupInfo, User } from "../../../common/api/entities/sys/TypeRefs.js"
import { CustomerPropertiesTypeRef } from "../../../common/api/entities/sys/TypeRefs.js"
import type { UserController } from "../../../common/api/main/UserController"
import type { EntityClient } from "../../../common/api/common/EntityClient"
import { getEnabledMailAddressesForGroupInfo, getGroupInfoDisplayName } from "../../../common/api/common/utils/GroupUtils"
import { fullNameToFirstAndLastName, mailAddressToFirstAndLastName } from "../../../common/misc/parsing/MailAddressParser"
import type { Attachment } from "../editor/SendMailModel"
import { getListId } from "../../../common/api/common/utils/EntityUtils"
import { isDetailsDraft, isLegacyMail, MailWrapper } from "../../../common/api/common/MailWrapper.js"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem.js"
import { ListFilter } from "../../../common/misc/ListModel.js"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { getDisplayedSender, isSystemNotification } from "../../../common/api/common/mail/CommonMailUtils.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { FontIcons } from "../../../common/gui/base/icons/FontIcons.js"

assertMainOrNode()
export const LINE_BREAK = "<br>"

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
	let contact = createContact({
		_ownerGroup: assertNotNull(
			user.memberships.find((m) => m.groupType === GroupType.Contact),
			"called createNewContact as user without contact group mship",
		).group,
		_owner: user._id,
		firstName: firstAndLastName.firstName,
		lastName: firstAndLastName.lastName,
		mailAddresses: [
			createContactMailAddress({
				address: mailAddress,
				type: ContactAddressType.OTHER,
				customTypeName: "",
			}),
		],
		autoTransmitPassword: "",
		birthdayIso: null,
		comment: "",
		company: "",
		nickname: null,
		oldBirthdayDate: null,
		presharedPassword: null,
		role: "",
		title: null,
		addresses: [],
		oldBirthdayAggregate: null,
		phoneNumbers: [],
		photo: null,
		socialIds: [],
		department: null,
		middleName: null,
		nameSuffix: null,
		phoneticFirst: null,
		phoneticLast: null,
		phoneticMiddle: null,
		customDate: [],
		messengerHandles: [],
		pronouns: [],
		relationships: [],
		websites: [],
	})
	return contact
}

export function getMailAddressDisplayText(name: string | null, mailAddress: string, preferNameOnly: boolean): string {
	if (!name) {
		return mailAddress
	} else if (preferNameOnly) {
		return name
	} else {
		return name + " <" + mailAddress + ">"
	}
}

export function getRecipientHeading(mail: Mail, preferNameOnly: boolean) {
	if (isLegacyMail(mail)) {
		const allRecipients = mail.toRecipients.concat(mail.ccRecipients).concat(mail.bccRecipients)

		if (allRecipients.length > 0) {
			return getMailAddressDisplayText(allRecipients[0].name, allRecipients[0].address, preferNameOnly) + (allRecipients.length > 1 ? ", ..." : "")
		} else {
			return ""
		}
	} else {
		let recipientCount = parseInt(mail.recipientCount)
		if (recipientCount > 0) {
			let recipient = neverNull(mail.firstRecipient)
			return getMailAddressDisplayText(recipient.name, recipient.address, preferNameOnly) + (recipientCount > 1 ? ", ..." : "")
		} else {
			return ""
		}
	}
}

export function getSenderOrRecipientHeading(mail: Mail, preferNameOnly: boolean): string {
	if (isSystemNotification(mail)) {
		return ""
	} else if (mail.state === MailState.RECEIVED) {
		const sender = getDisplayedSender(mail)
		return getMailAddressDisplayText(sender.name, sender.address, preferNameOnly)
	} else {
		return getRecipientHeading(mail, preferNameOnly)
	}
}

/**
 * @return {string} default mail address
 */
export function getDefaultSenderFromUser({ props, userGroupInfo }: UserController): string {
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

export function getFolderIconByType(folderType: MailFolderType): AllIcons {
	switch (folderType) {
		case MailFolderType.CUSTOM:
			return Icons.Folder

		case MailFolderType.INBOX:
			return Icons.Inbox

		case MailFolderType.SENT:
			return Icons.Send

		case MailFolderType.TRASH:
			return Icons.TrashBin

		case MailFolderType.ARCHIVE:
			return Icons.Archive

		case MailFolderType.SPAM:
			return Icons.Spam

		case MailFolderType.DRAFT:
			return Icons.Draft

		default:
			return Icons.Folder
	}
}

export function getFolderIcon(folder: MailFolder): AllIcons {
	return getFolderIconByType(getMailFolderType(folder))
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
			: assertNotNull(logins.getUserController().userGroupInfo.mailAddress)
	} else {
		return assertNotNull(mailboxDetails.mailGroupInfo.mailAddress)
	}
}

export function isUserEmail(logins: LoginController, mailboxDetails: MailboxDetail, address: string): boolean {
	if (isUserMailbox(mailboxDetails)) {
		return (
			contains(getEnabledMailAddressesWithUser(mailboxDetails, logins.getUserController().userGroupInfo), address) ||
			logins.getUserController().userGroupInfo.mailAddress === address
		)
	} else {
		return mailboxDetails.mailGroupInfo.mailAddress === address
	}
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
		return getDefaultSender(logins, mailboxDetails)
	} else {
		return getGroupInfoDisplayName(assertNotNull(mailboxDetails.mailGroupInfo, "mailboxDetails without mailGroupInfo?"))
	}
}

export interface ImageHandler {
	insertImage(srcAttr: string, attrs?: Record<string, string>): HTMLElement
}

/**
 * Check if all mails in the selection are drafts. If there are mixed drafts and non-drafts or the array is empty, return true.
 * @param mails
 */
export function emptyOrContainsDraftsAndNonDrafts(mails: ReadonlyArray<Mail>): boolean {
	return mails.length === 0 || (mails.some((mail) => mail.state === MailState.DRAFT) && mails.some((mail) => mail.state !== MailState.DRAFT))
}

export function copyMailAddress({ address, name }: EncryptedMailAddress): EncryptedMailAddress {
	return createEncryptedMailAddress({
		address,
		name,
	})
}

export function getTemplateLanguages(sortedLanguages: Array<Language>, entityClient: EntityClient, loginController: LoginController): Promise<Array<Language>> {
	return loginController
		.getUserController()
		.loadCustomer()
		.then((customer) => entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties)))
		.then((customerProperties) => {
			return sortedLanguages.filter((sL) => customerProperties.notificationMailTemplates.find((nmt) => nmt.language === sL.code))
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
	return props.inboxRules.find((rule) => type === rule.type && cleanValue === rule.value) ?? null
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
	for (const file of files) {
		if (totalSize + Number(file.size) > maxAttachmentSize) {
			tooBigFiles.push(file.name)
		} else {
			totalSize += Number(file.size)
			attachableFiles.push(file)
		}
	}
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

export type FolderInfo = { level: number; folder: MailFolder }

export async function getMoveTargetFolderSystems(model: MailModel, mails: readonly Mail[]): Promise<Array<FolderInfo>> {
	const firstMail = first(mails)
	if (firstMail == null) return []

	const mailboxDetails = await model.getMailboxDetailsForMail(firstMail)
	if (mailboxDetails == null) {
		return []
	}
	const folderSystem = mailboxDetails.folders
	return folderSystem.getIndentedList().filter((f) => f.folder.mails !== getListId(firstMail))
}

export const MAX_FOLDER_INDENT_LEVEL = 10

export function getIndentedFolderNameForDropdown(folderInfo: FolderInfo) {
	const indentLevel = Math.min(folderInfo.level, MAX_FOLDER_INDENT_LEVEL)
	return ". ".repeat(indentLevel) + getFolderName(folderInfo.folder)
}

export function getPathToFolderString(folderSystem: FolderSystem, folder: MailFolder, omitLast = false) {
	const folderPath = folderSystem.getPathToFolder(folder._id)
	if (omitLast) {
		folderPath.pop()
	}
	return folderPath.map(getFolderName).join(" · ")
}

export async function loadMailDetails(mailFacade: MailFacade, entityClient: EntityClient, mail: Mail): Promise<MailWrapper> {
	if (isLegacyMail(mail)) {
		return entityClient.load(MailBodyTypeRef, neverNull(mail.body)).then((b) => MailWrapper.body(mail, b))
	} else if (isDetailsDraft(mail)) {
		const detailsDraftId = assertNotNull(mail.mailDetailsDraft)
		return mailFacade.loadMailDetailsDraft(mail).then((d) => MailWrapper.details(mail, d))
	} else {
		const mailDetailsId = neverNull(mail.mailDetails)
		return mailFacade.loadMailDetailsBlob(mail).then((d) => MailWrapper.details(mail, d))
	}
}

export function getLegacyMailHeaders(headers: MailHeaders): string {
	return headers.compressedHeaders ?? headers.headers ?? ""
}

export function getMailHeaders(headers: Header): string {
	return headers.compressedHeaders ?? headers.headers ?? ""
}

export async function loadMailHeaders(entityClient: EntityClient, mailWrapper: MailWrapper): Promise<string | null> {
	if (mailWrapper.isLegacy()) {
		const headersId = mailWrapper.getMail().headers
		return headersId != null ? getLegacyMailHeaders(await entityClient.load(MailHeadersTypeRef, headersId)) : null
	} else {
		const details = mailWrapper.getDetails()
		return details.headers != null ? getMailHeaders(details.headers) : null
	}
}

export enum MailFilterType {
	Unread,
	Read,
	WithAttachments,
}

export function getMailFilterForType(filter: MailFilterType | null): ListFilter<Mail> | null {
	switch (filter) {
		case MailFilterType.Read:
			return (mail) => !mail.unread
		case MailFilterType.Unread:
			return (mail) => mail.unread
		case MailFilterType.WithAttachments:
			return (mail) => mail.attachments.length > 0
		case null:
			return null
	}
}

/**
 * Returns the confidential font icon for the given mail which indicates either RSA or PQ encryption.
 * The caller must ensure that the mail is in a confidential state.
 */
export function getConfidentialFontIcon(mail: Mail): String {
	const confidentialIcon = getConfidentialIcon(mail)
	return confidentialIcon === Icons.PQLock ? FontIcons.PQConfidential : FontIcons.Confidential
}

/**
 * Returns the confidential icon for the given mail which indicates either RSA or PQ encryption.
 * The caller must ensure that the mail is in a confidential state.
 */
export function getConfidentialIcon(mail: Mail): Icons {
	if (!mail.confidential) throw new ProgrammingError("mail is not confidential")
	if (
		mail.encryptionAuthStatus == EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED ||
		mail.encryptionAuthStatus == EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED ||
		mail.encryptionAuthStatus == EncryptionAuthStatus.TUTACRYPT_SENDER
	) {
		return Icons.PQLock
	} else {
		return Icons.Lock
	}
}
