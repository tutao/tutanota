// @flow
import m from "mithril"
import {isTutanotaMailAddress, recipientInfoType} from "../api/common/RecipientInfo"
import {fullNameToFirstAndLastName, mailAddressToFirstAndLastName, stringToNameAndMailAddress} from "../misc/Formatter"
import {createContact} from "../api/entities/tutanota/Contact"
import {createContactMailAddress} from "../api/entities/tutanota/ContactMailAddress"
import type {MailFolderTypeEnum} from "../api/common/TutanotaConstants"
import {
	ContactAddressType,
	GroupType,
	MailState,
	EmailSignatureType as TutanotaConstants,
	MailFolderType
} from "../api/common/TutanotaConstants"
import {neverNull, getEnabledMailAddressesForGroupInfo, getGroupInfoDisplayName} from "../api/common/utils/Utils"
import {assertMainOrNode} from "../api/Env"
import {createPublicKeyData} from "../api/entities/sys/PublicKeyData"
import {serviceRequest} from "../api/main/Entity"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {PublicKeyReturnTypeRef} from "../api/entities/sys/PublicKeyReturn"
import {NotFoundError} from "../api/common/error/RestError"
import {client} from "../misc/ClientDetector"
import {contains} from "../api/common/utils/ArrayUtils"
import {logins} from "../api/main/LoginController"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {lang} from "../misc/LanguageViewModel"
import {createMailAddress} from "../api/entities/tutanota/MailAddress"
import {Icons} from "../gui/base/icons/Icons"
import type {MailboxDetail} from "./MailModel"
import {getContactDisplayName, searchForContactByMailAddress} from "../contacts/ContactUtils"

assertMainOrNode()

/**
 *
 * @param mailAddress
 * @param name Null if the name shall be taken from the contact found with the email address.
 * @param contact
 * @param doNotResolveContact
 * @returns {{_type: string, type: string, mailAddress: string, name: ?string, contact: *}}
 */
export function createRecipientInfo(mailAddress: string, name: ?string, contact: ?Contact, doNotResolveContact: boolean): RecipientInfo {
	let type = isTutanotaMailAddress(mailAddress) ? recipientInfoType.internal : recipientInfoType.unknown
	let recipientInfo = {
		_type: 'RecipientInfo',
		type,
		mailAddress,
		name: (name) ? name : "", // "" will be replaced as soon as a contact is found
		contact: contact,
		resolveContactPromise: neverNull(null) // strangely, flow does not allow null here
	}
	if (!contact && !doNotResolveContact && logins.getUserController() && logins.getUserController().isInternalUser()) {
		recipientInfo.resolveContactPromise = searchForContactByMailAddress(mailAddress).then(contact => {
			if (contact) {
				if (!name) {
					recipientInfo.name = getContactDisplayName(contact)
				}
				recipientInfo.contact = contact
			} else {
				recipientInfo.contact = createNewContact(mailAddress, recipientInfo.name)
			}
			recipientInfo.resolveContactPromise = null
			m.redraw()
			return recipientInfo.contact
		}).catch(e => {
			console.log("error resolving contact", e)
			recipientInfo.contact = createNewContact(mailAddress, recipientInfo.name)
			recipientInfo.resolveContactPromise = null
			m.redraw()
			return recipientInfo.contact
		})
	}
	return recipientInfo
}

/**
 * Creates a contact with an email address and a name.
 * @param mailAddress The mail address of the contact. Type is OTHER.
 * @param name The name of the contact. If an empty string is provided, the name is parsed from the mail address.
 * @return The contact.
 */
export function createNewContact(mailAddress: string, name: string): Contact {
	// prepare some contact information. it is only saved if the mail is sent securely
	// use the name or mail address to extract first and last name. first part is used as first name, all other parts as last name
	let firstAndLastName = name.trim() !== "" ? fullNameToFirstAndLastName(name) : mailAddressToFirstAndLastName(mailAddress)

	let contact = createContact()
	contact._owner = logins.getUserController().user._id
	contact._ownerGroup = neverNull(logins.getUserController().user.memberships.find(m => m.groupType === GroupType.Contact)).group
	contact.firstName = firstAndLastName.firstName
	contact.lastName = firstAndLastName.lastName

	let ma = createContactMailAddress()
	ma.address = mailAddress
	ma.type = ContactAddressType.OTHER
	ma.customTypeName = ""

	contact.mailAddresses.push(ma)
	return contact
}

/**
 * @throws TooManyRequestsError if the recipient could not be resolved because of too many requests.
 */
export function resolveRecipientInfo(recipientInfo: RecipientInfo): Promise<RecipientInfo> {
	if (recipientInfo.type != recipientInfoType.unknown) {
		return Promise.resolve(recipientInfo)
	} else {
		let keyData = createPublicKeyData()
		keyData.mailAddress = recipientInfo.mailAddress
		return serviceRequest(SysService.PublicKeyService, HttpMethod.GET, keyData, PublicKeyReturnTypeRef).then(publicKeyData => {
			recipientInfo.type = recipientInfoType.internal
			return recipientInfo
		}).catch(NotFoundError, e => {
			recipientInfo.type = recipientInfoType.external
			return recipientInfo
		})
	}
}

export function getDisplayText(name: string, mailAddress: string, preferNameOnly: boolean) {
	if (name == "") {
		return mailAddress;
	} else if (client.isMobileDevice() || preferNameOnly) {
		return name
	} else {
		return name + " <" + mailAddress + ">"
	}
}

export function getSenderOrRecipientHeading(mail: Mail, preferNameOnly: boolean): string {
	if (mail.state == MailState.RECEIVED) {
		return getDisplayText(mail.sender.name, mail.sender.address, preferNameOnly)
	} else {
		let allRecipients = mail.toRecipients.concat(mail.ccRecipients).concat(mail.bccRecipients)
		if (allRecipients.length > 0) {
			return getDisplayText(allRecipients[0].name, allRecipients[0].address, preferNameOnly) + ((allRecipients.length > 1) ? ", ..." : "")
		} else {
			return ""
		}
	}
}

export function getDefaultSenderFromUser(): string {
	let props = logins.getUserController().props
	return (props.defaultSender && contains(getEnabledMailAddressesForGroupInfo(logins.getUserController().userGroupInfo), props.defaultSender)) ? props.defaultSender : neverNull(logins.getUserController().userGroupInfo.mailAddress)
}

export function getDefaultSignature() {
	return "<br><br>" + htmlSanitizer.sanitize(lang.get("defaultEmailSignature_msg", {"{1}": "https://tutanota.com"}), true).text;
}


export function parseMailtoUrl(mailtoUrl: string): {to:MailAddress[], cc:MailAddress[], bcc:MailAddress[], subject:string, body:string} {
	let url = new URL(mailtoUrl)
	let toRecipients = []
	let ccRecipients = []
	let bccRecipients = []
	let addresses = url.pathname.split(",")
	let subject = ""
	let body = ""

	let createMailAddressFromString = (address: string): ?MailAddress => {
		let nameAndMailAddress = stringToNameAndMailAddress(address)
		if (nameAndMailAddress) {
			let mailAddress = createMailAddress()
			mailAddress.name = nameAndMailAddress.name
			mailAddress.address = nameAndMailAddress.mailAddress
			return mailAddress
		} else {
			return null
		}
	}

	addresses.forEach((address) => {
		address ? toRecipients.push(neverNull(createMailAddressFromString(decodeURIComponent(address)))) : null
	})

	if (url.searchParams) { // not supported in Edge
		for (let pair of url.searchParams.entries()) {
			let paramName = pair[0].toLowerCase()
			let paramValue = pair[1]
			if (paramName == "subject") {
				subject = paramValue
			} else if (paramName == "body") {
				body = paramValue.replace(/\r\n/g, "<br>").replace(/\n/g, "<br>")
			} else if (paramName == "cc") {
				paramValue.split(",").forEach((ccAddress) => ccAddress ? ccRecipients.push(neverNull(createMailAddressFromString(ccAddress))) : null)
			} else if (paramName == "bcc") {
				paramValue.split(",").forEach((bccAddress) => bccAddress ? bccRecipients.push(neverNull(createMailAddressFromString(bccAddress))) : null)
			} else if (paramName == "to") {
				paramValue.split(",").forEach((toAddress) => toAddress ? toRecipients.push(neverNull(createMailAddressFromString(toAddress))) : null)
			}
		}
	}

	return {
		to: toRecipients,
		cc: ccRecipients,
		bcc: bccRecipients,
		subject: subject,
		body: body
	}
}

export function getFolderName(folder: MailFolder) {
	switch (folder.folderType) {
		case '0':
			return folder.name
		case '1':
			return lang.get("received_action")
		case '2':
			return lang.get("sent_action")
		case '3':
			return lang.get("trash_action")
		case '4':
			return lang.get("archive_action")
		case '5':
			return lang.get("spam_action")
		case '6':
			return lang.get("draft_action")
		default:
			// do not throw an error - new system folders may cause problems
			//throw new Error("illegal folder type: " + this.folder.getFolderType())
			return ""
	}
}

export function getFolderIconByType(folderType: MailFolderTypeEnum) {
	switch (folderType) {
		case '0':
			return () => Icons.Folder
		case '1':
			return () => Icons.Inbox
		case '2':
			return () => Icons.Send
		case '3':
			return () => Icons.Trash
		case '4':
			return () => Icons.Archive
		case '5':
			return () => Icons.Spam
		case '6':
			return () => Icons.Edit
		default:
			return () => Icons.Folder
	}
}

export function getFolderIcon(folder: MailFolder): () => string {
	return getFolderIconByType(folder.folderType)
}


export function getTrashFolder(folders: MailFolder[]): MailFolder {
	return (folders.find(f => f.folderType === MailFolderType.TRASH):any)
}


export function getInboxFolder(folders: MailFolder[]): MailFolder {
	return getFolder(folders, MailFolderType.INBOX)
}

export function getArchiveFolder(folders: MailFolder[]): MailFolder {
	return getFolder(folders, MailFolderType.ARCHIVE)
}


export function getFolder(folders: MailFolder[], type: MailFolderTypeEnum): MailFolder {
	return (folders.find(f => f.folderType === type):any)
}


export function getSortedSystemFolders(folders: MailFolder[]): MailFolder[] {
	return folders.filter(f => f.folderType !== MailFolderType.CUSTOM).sort((folder1, folder2) => {
		// insert the draft folder after inbox (use type number 1.5 which is after inbox)
		if (folder1.folderType == MailFolderType.DRAFT) {
			return 1.5 - Number(folder2.folderType)
		} else if (folder2.folderType == MailFolderType.DRAFT) {
			return Number(folder1.folderType) - 1.5
		}
		return Number(folder1.folderType) - Number(folder2.folderType)
	})
}

export function getSortedCustomFolders(folders: MailFolder[]): MailFolder[] {
	return folders.filter(f => f.folderType == MailFolderType.CUSTOM).sort((folder1, folder2) => {
		return folder1.name.localeCompare(folder2.name)
	})
}


export function getEnabledMailAddresses(mailboxDetails: MailboxDetail): string[] {
	if (isUserMailbox(mailboxDetails)) {
		return getEnabledMailAddressesForGroupInfo(logins.getUserController().userGroupInfo)
	} else {
		return getEnabledMailAddressesForGroupInfo(mailboxDetails.mailGroupInfo)
	}
}

export function isUserMailbox(mailboxDetails: MailboxDetail) {
	return mailboxDetails.mailGroup.user != null
}


export function getDefaultSender(mailboxDetails: MailboxDetail): string {
	if (isUserMailbox(mailboxDetails)) {
		let props = logins.getUserController().props
		return (props.defaultSender && contains(getEnabledMailAddresses(mailboxDetails), props.defaultSender)) ? props.defaultSender : neverNull(logins.getUserController().userGroupInfo.mailAddress)
	} else {
		return neverNull(mailboxDetails.mailGroupInfo.mailAddress)
	}
}

export function isFinalDelete(folder: ?MailFolder): boolean {
	return folder != null && (folder.folderType === MailFolderType.TRASH || folder.folderType === MailFolderType.SPAM)
}

export function getSenderName(mailboxDetails: MailboxDetail): string {
	let senderName = ""
	if (isUserMailbox(mailboxDetails)) {
		// external users do not have access to the user group info
		return logins.getUserController().userGroupInfo.name
	} else {
		return mailboxDetails.mailGroupInfo ? mailboxDetails.mailGroupInfo.name : ""
	}
}

export function getEmailSignature(): string {
	// provide the user signature, even for shared mail groups
	var type = logins.getUserController().props.emailSignatureType
	if (type == TutanotaConstants.EMAIL_SIGNATURE_TYPE_DEFAULT) {
		return getDefaultSignature()
	} else if (type == TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM) {
		return logins.getUserController().props.customEmailSignature
	} else {
		return ""
	}
}


export function getMailboxName(mailboxDetails: MailboxDetail): string {
	if (!logins.isInternalUserLoggedIn()) {
		return lang.get("mailbox_label")
	} else if (isUserMailbox(mailboxDetails)) {
		return getGroupInfoDisplayName(logins.getUserController().userGroupInfo)
	} else {
		return getGroupInfoDisplayName(neverNull(mailboxDetails.mailGroupInfo))
	}
}