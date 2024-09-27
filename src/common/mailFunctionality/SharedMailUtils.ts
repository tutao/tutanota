import { assertMainOrNode } from "../api/common/Env.js"
import { CustomerPropertiesTypeRef, GroupInfo, User } from "../api/entities/sys/TypeRefs.js"
import { Contact, createContact, createContactMailAddress, Mail } from "../api/entities/tutanota/TypeRefs.js"
import { fullNameToFirstAndLastName, mailAddressToFirstAndLastName } from "../misc/parsing/MailAddressParser.js"
import { assertNotNull, contains, neverNull, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import {
	ALLOWED_IMAGE_FORMATS,
	ContactAddressType,
	ConversationType,
	EncryptionAuthStatus,
	GroupType,
	MailState,
	SYSTEM_GROUP_MAIL_ADDRESS,
	MAX_BASE64_IMAGE_SIZE,
	MAX_ATTACHMENT_SIZE,
	TUTA_MAIL_ADDRESS_DOMAINS,
} from "../api/common/TutanotaConstants.js"
import { UserController } from "../api/main/UserController.js"
import { getEnabledMailAddressesForGroupInfo, getGroupInfoDisplayName } from "../api/common/utils/GroupUtils.js"
import { lang, Language, TranslationKey } from "../misc/LanguageViewModel.js"
import { MailboxDetail } from "./MailboxModel.js"
import { LoginController } from "../api/main/LoginController.js"
import { EntityClient } from "../api/common/EntityClient.js"
import { Attachment } from "./SendMailModel.js"
import { showFileChooser } from "../file/FileController.js"
import { DataFile } from "../api/common/DataFile.js"
import { Dialog } from "../gui/base/Dialog.js"

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
		firstName: firstAndLastName.firstName,
		lastName: firstAndLastName.lastName,
		mailAddresses: [
			createContactMailAddress({
				address: mailAddress,
				type: ContactAddressType.OTHER,
				customTypeName: "",
			}),
		],
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

export enum RecipientField {
	TO = "to",
	CC = "cc",
	BCC = "bcc",
}

export function isTutaMailAddress(mailAddress: string): boolean {
	return TUTA_MAIL_ADDRESS_DOMAINS.some((tutaDomain) => mailAddress.endsWith("@" + tutaDomain))
}

export function hasValidEncryptionAuthForTeamOrSystemMail({ encryptionAuthStatus }: Mail): boolean {
	switch (encryptionAuthStatus) {
		// emails before tuta-crypt had no encryptionAuthStatus
		case null:
		case undefined:
		case EncryptionAuthStatus.RSA_NO_AUTHENTICATION:
		case EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED:
		case EncryptionAuthStatus.TUTACRYPT_SENDER: // should only be set for sent NOT received mails
			return true
		case EncryptionAuthStatus.AES_NO_AUTHENTICATION:
		case EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED:
		// we have to be able to handle future cases, to be safe we say that they are not valid encryptionAuth
		default:
			return false
	}
}

/**
 * Is this a system notification?
 */
export function isSystemNotification(mail: Mail): boolean {
	const { confidential, sender, state } = mail
	return (
		state === MailState.RECEIVED &&
		confidential &&
		hasValidEncryptionAuthForTeamOrSystemMail(mail) &&
		(sender.address === SYSTEM_GROUP_MAIL_ADDRESS ||
			// New emails will have sender set to system and will only have replyTo set to no-reply
			// but we should keep displaying old emails correctly.
			isNoReplyTeamAddress(sender.address))
	)
}

export function isNoReplyTeamAddress(address: string): boolean {
	return address === "no-reply@tutao.de" || address === "no-reply@tutanota.de"
}

export function insertInlineImageB64ClickHandler(ev: Event, handler: ImageHandler) {
	showFileChooser(true, ALLOWED_IMAGE_FORMATS).then((files) => {
		const tooBig: DataFile[] = []

		for (let file of files) {
			if (file.size > MAX_BASE64_IMAGE_SIZE) {
				tooBig.push(file)
			} else {
				const b64 = uint8ArrayToBase64(file.data)
				const dataUrlString = `data:${file.mimeType};base64,${b64}`
				handler.insertImage(dataUrlString, {
					style: "max-width: 100%",
				})
			}
		}

		if (tooBig.length > 0) {
			Dialog.message(() =>
				lang.get("tooBigInlineImages_msg", {
					"{size}": MAX_BASE64_IMAGE_SIZE / 1024,
				}),
			)
		}
	})
}

// .msg export is handled in DesktopFileExport because it uses APIs that can't be loaded web side
export type MailExportMode = "msg" | "eml"
/**
 * Used to pass all downloaded mail stuff to the desktop side to be exported as a file
 * Ideally this would just be {Mail, Headers, Body, FileReference[]}
 * but we can't send Dates over to the native side, so we may as well just extract everything here
 */
export type MailBundleRecipient = {
	address: string
	name?: string
}

export type MailBundle = {
	mailId: IdTuple
	subject: string
	body: string
	sender: MailBundleRecipient
	to: MailBundleRecipient[]
	cc: MailBundleRecipient[]
	bcc: MailBundleRecipient[]
	replyTo: MailBundleRecipient[]
	isDraft: boolean
	isRead: boolean
	sentOn: number
	// UNIX timestamp
	receivedOn: number // UNIX timestamp,
	headers: string | null
	attachments: DataFile[]
}
