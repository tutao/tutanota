// @flow
import m from "mithril"
import type {RecipientInfo} from "../api/common/RecipientInfo"
import {isTutanotaMailAddress, RecipientInfoType} from "../api/common/RecipientInfo"
import {fullNameToFirstAndLastName, mailAddressToFirstAndLastName, stringToNameAndMailAddress} from "../misc/Formatter"
import type {Contact} from "../api/entities/tutanota/Contact"
import {createContact} from "../api/entities/tutanota/Contact"
import {createContactMailAddress} from "../api/entities/tutanota/ContactMailAddress"
import type {MailFolderTypeEnum} from "../api/common/TutanotaConstants"
import {
	ContactAddressType,
	EmailSignatureType as TutanotaConstants,
	getMailFolderType,
	GroupType,
	MailFolderType,
	MailState
} from "../api/common/TutanotaConstants"
import {
	assertNotNull,
	getEnabledMailAddressesForGroupInfo,
	getGroupInfoDisplayName,
	getMailBodyText,
	neverNull,
	noOp
} from "../api/common/utils/Utils"
import {assertMainOrNode, isApp, isDesktop} from "../api/Env"
import {load, update} from "../api/main/Entity"
import {LockedError, NotFoundError} from "../api/common/error/RestError"
import {contains} from "../api/common/utils/ArrayUtils"
import type {LoginController} from "../api/main/LoginController"
import {logins} from "../api/main/LoginController"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {lang} from "../misc/LanguageViewModel"
import {Icons} from "../gui/base/icons/Icons"
import type {MailboxDetail, MailModel} from "./MailModel"
import {getContactDisplayName} from "../contacts/ContactUtils"
import {Dialog} from "../gui/base/Dialog"
import type {AllIconsEnum, lazyIcon} from "../gui/base/Icon"
import {endsWith} from "../api/common/utils/StringUtils"
import type {MailFolder} from "../api/entities/tutanota/MailFolder"
import type {File as TutanotaFile} from "../api/entities/tutanota/File"
import {MailBodyTypeRef} from "../api/entities/tutanota/MailBody"
import {mailToEmlFile} from "./Exporter"
import {sortableTimestamp} from "../api/common/utils/DateUtils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {locator} from "../api/main/MainLocator"
import type {IUserController} from "../api/main/UserController"
import type {InlineImages} from "./MailViewer"
import type {Mail} from "../api/entities/tutanota/Mail"
import type {ContactModel} from "../contacts/ContactModel"
import type {User} from "../api/entities/sys/User"
import type {EncryptedMailAddress} from "../api/entities/tutanota/EncryptedMailAddress"
import {createEncryptedMailAddress} from "../api/entities/tutanota/EncryptedMailAddress"
import {fileController} from "../file/FileController"
import type {MailAddress} from "../api/entities/tutanota/MailAddress"
import {createMailAddress} from "../api/entities/tutanota/MailAddress"

assertMainOrNode()

/**
 *
 * @param mailAddress
 * @param name Null if the name shall be taken from the contact found with the email address.
 * @param contact
 * @returns {{_type: string, type: string, mailAddress: string, name: ?string, contact: *}}
 */
export function createRecipientInfo(mailAddress: string, name: ?string, contact: ?Contact): RecipientInfo {
	let type = isTutanotaMailAddress(mailAddress) ? RecipientInfoType.INTERNAL : RecipientInfoType.UNKNOWN
	const usedName = name != null
		? name
		: contact != null ? getContactDisplayName(contact) : ""
	return {
		type,
		mailAddress,
		name: usedName,
		contact: contact,
		resolveContactPromise: null
	}
}

export function resolveRecipientInfoContact(recipientInfo: RecipientInfo, contactModel: ContactModel, user: User): Promise<?Contact> {
	if (!recipientInfo.contact) {
		const p = contactModel.searchForContact(recipientInfo.mailAddress).then(contact => {
			if (contact) {
				if (!recipientInfo.name) {
					recipientInfo.name = getContactDisplayName(contact)
				}
				recipientInfo.contact = contact
			} else {
				recipientInfo.contact = createNewContact(user, recipientInfo.mailAddress, recipientInfo.name)
			}
			recipientInfo.resolveContactPromise = null
			m.redraw()
			return recipientInfo.contact
		}).catch(e => {
			console.log("error resolving contact", e)
			recipientInfo.contact = createNewContact(user, recipientInfo.mailAddress, recipientInfo.name)
			recipientInfo.resolveContactPromise = null
			m.redraw()
			return recipientInfo.contact
		})
		recipientInfo.resolveContactPromise = p
		return p
	} else {
		return Promise.resolve(recipientInfo.contact)
	}
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

/**
 * @throws TooManyRequestsError if the recipient could not be resolved because of too many requests.
 */
export function resolveRecipientInfo(mailModel: MailModel, recipientInfo: RecipientInfo): Promise<RecipientInfo> {
	if (recipientInfo.type !== RecipientInfoType.UNKNOWN) {
		return Promise.resolve(recipientInfo)
	} else {
		return mailModel.getRecipientKeyData(recipientInfo.mailAddress)
		                .then((keyData) => {
			                recipientInfo.type = keyData == null ? RecipientInfoType.EXTERNAL : RecipientInfoType.INTERNAL
			                return recipientInfo
		                })
	}
}

export function getDisplayText(name: string, mailAddress: string, preferNameOnly: boolean) {
	if (name === "") {
		return mailAddress;
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
			return getDisplayText(allRecipients[0].name, allRecipients[0].address, preferNameOnly)
				+ ((allRecipients.length > 1) ? ", ..." : "")
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
	return mail.confidential && (mail.state === MailState.RECEIVED) && endsWith(mail.sender.address, "@tutao.de")
}

export function isExcludedMailAddress(mailAddress: string) {
	return mailAddress === "no-reply@tutao.de"
}

/**
 * @return {string} default mail address
 */
export function getDefaultSenderFromUser({props, userGroupInfo}: IUserController): string {
	return (props.defaultSender
		&& contains(getEnabledMailAddressesForGroupInfo(userGroupInfo), props.defaultSender))
		? props.defaultSender
		: neverNull(userGroupInfo.mailAddress)
}

export function getDefaultSignature() {
	return "<br><br>"
		+ htmlSanitizer.sanitize(lang.get("defaultEmailSignature_msg", {"{1}": lang.getInfoLink("homePage_link")}), true).text;
}


export function parseMailtoUrl(mailtoUrl: string): {to: MailAddress[], cc: MailAddress[], bcc: MailAddress[], subject: string, body: string} {
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
		if (address) {
			const decodedAddress = decodeURIComponent(address)
			if (decodedAddress) {
				const mailAddressObject = createMailAddressFromString(decodedAddress)
				mailAddressObject && toRecipients.push(mailAddressObject)
			}
		}
	})

	if (url.searchParams && typeof url.searchParams.entries === "function") { // not supported in Edge
		for (let pair of url.searchParams.entries()) {
			let paramName = pair[0].toLowerCase()
			let paramValue = pair[1]
			if (paramName === "subject") {
				subject = paramValue
			} else if (paramName === "body") {
				body = paramValue.replace(/\r\n/g, "<br>").replace(/\n/g, "<br>")
			} else if (paramName === "cc") {
				paramValue.split(",")
				          .forEach((ccAddress) => {
					          if (ccAddress) {
						          const addressObject = createMailAddressFromString(ccAddress)
						          addressObject && ccRecipients.push(addressObject)
					          }
				          })
			} else if (paramName === "bcc") {
				paramValue.split(",")
				          .forEach((bccAddress) => {
					          if (bccAddress) {
						          const addressObject = createMailAddressFromString(bccAddress)
						          addressObject && bccRecipients.push(addressObject)
					          }
				          })
			} else if (paramName === "to") {
				paramValue.split(",")
				          .forEach((toAddress) => {
					          if (toAddress) {
						          const addressObject = createMailAddressFromString(toAddress)
						          addressObject && toRecipients.push(addressObject)
					          }
				          })
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

export function getFolderIconByType(folderType: MailFolderTypeEnum): lazyIcon {
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

export function getFolderIcon(folder: MailFolder): lazyIcon {
	return getFolderIconByType(getMailFolderType(folder))
}


export function getInboxFolder(folders: MailFolder[]): MailFolder {
	return getFolder(folders, MailFolderType.INBOX)
}

export function getArchiveFolder(folders: MailFolder[]): MailFolder {
	return getFolder(folders, MailFolderType.ARCHIVE)
}


export function getFolder(folders: MailFolder[], type: MailFolderTypeEnum): MailFolder {
	const folder = folders.find(f => f.folderType === type)
	return neverNull(folder)
}


export function getSortedSystemFolders(folders: MailFolder[]): MailFolder[] {
	return folders.filter(f => f.folderType !== MailFolderType.CUSTOM).sort((folder1, folder2) => {
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
	return folders.filter(f => f.folderType === MailFolderType.CUSTOM).sort((folder1, folder2) => {
		return folder1.name.localeCompare(folder2.name)
	})
}

/**
 * @deprecated Avoid grabbing singleton dependencies, use {@link getEnabledMailAddressesWithUser} instead to explicitly show dependencies.
 */
export function getEnabledMailAddresses(mailboxDetails: MailboxDetail): string[] {
	return getEnabledMailAddressesWithUser(mailboxDetails, logins.getUserController().userGroupInfo)
}

export function getEnabledMailAddressesWithUser(mailboxDetail: MailboxDetail, userGroupInfo: GroupInfo): Array<string> {
	if (isUserMailbox(mailboxDetail)) {
		return getEnabledMailAddressesForGroupInfo(userGroupInfo)
	} else {
		return getEnabledMailAddressesForGroupInfo(mailboxDetail.mailGroupInfo)
	}
}

export function isUserMailbox(mailboxDetails: MailboxDetail) {
	return mailboxDetails.mailGroup.user != null
}


export function getDefaultSender(logins: LoginController, mailboxDetails: MailboxDetail): string {
	if (isUserMailbox(mailboxDetails)) {
		let props = logins.getUserController().props
		return (props.defaultSender
			&& contains(getEnabledMailAddressesWithUser(mailboxDetails, logins.getUserController().userGroupInfo), props.defaultSender))
			? props.defaultSender
			: neverNull(logins.getUserController().userGroupInfo.mailAddress)
	} else {
		return neverNull(mailboxDetails.mailGroupInfo.mailAddress)
	}
}

export function showDeleteConfirmationDialog(mails: Mail[]): Promise<boolean> {
	let groupedMails = mails.reduce((all, mail) => {
		locator.mailModel.isFinalDelete(locator.mailModel.getMailFolder(mail._id[0])) ? all.trash.push(mail) : all.move.push(mail)
		return all
	}, {trash: [], move: []})

	let confirmationTextId = null
	if (groupedMails.trash.length > 0) {
		if (groupedMails.move.length > 0) {
			confirmationTextId = "finallyDeleteSelectedEmails_msg"
		} else {
			confirmationTextId = "finallyDeleteEmails_msg"
		}
	}
	if (confirmationTextId != null) {
		return Dialog.confirm(confirmationTextId)
	} else {
		return Promise.resolve(true)
	}
}


/** @deprecated use {@link getSenderNameForUser} instead */
export function getSenderName(mailboxDetails: MailboxDetail): string {
	return getSenderNameForUser(mailboxDetails, logins.getUserController())
}

export function getSenderNameForUser(mailboxDetails: MailboxDetail, userController: IUserController): string {
	if (isUserMailbox(mailboxDetails)) {
		// external users do not have access to the user group info
		return userController.userGroupInfo.name
	} else {
		return mailboxDetails.mailGroupInfo ? mailboxDetails.mailGroupInfo.name : ""
	}
}

export function getEmailSignature(): string {
	// provide the user signature, even for shared mail groups
	const type = logins.getUserController().props.emailSignatureType;
	if (type === TutanotaConstants.EMAIL_SIGNATURE_TYPE_DEFAULT) {
		return getDefaultSignature()
	} else if (TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM === type) {
		return logins.getUserController().props.customEmailSignature
	} else {
		return ""
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

export function getMailFolderIcon(mail: Mail): AllIconsEnum {
	let folder = locator.mailModel.getMailFolder(mail._id[0])
	if (folder) {
		return getFolderIcon(folder)()
	} else {
		return Icons.Folder
	}
}


export interface ImageHandler {
	insertImage(srcAttr: string, attrs?: {[string]: string}): HTMLElement
}

export function replaceCidsWithInlineImages(dom: HTMLElement, inlineImages: InlineImages,
                                            onContext: (TutanotaFile, Event, HTMLElement) => mixed): Array<HTMLElement> {
	// all image tags which have cid attribute. The cid attribute has been set by the sanitizer for adding a default image.
	const imageElements: Array<HTMLElement> = Array.from(dom.querySelectorAll("img[cid]"))
	const elementsWithCid = []
	imageElements.forEach((imageElement) => {
		const cid = imageElement.getAttribute("cid")
		if (cid) {
			const inlineImage = inlineImages[cid]
			if (inlineImage) {
				elementsWithCid.push(imageElement)
				imageElement.setAttribute("src", inlineImages[cid].url)
				imageElement.classList.remove("tutanota-placeholder")

				if (isApp()) { // Add long press action for apps
					let timeoutId: ?TimeoutID
					let startCoords: ?{x: number, y: number}
					imageElement.addEventListener("touchstart", (e: TouchEvent) => {
						const touch = e.touches[0]
						if (!touch) return
						startCoords = {x: touch.clientX, y: touch.clientY}
						timeoutId = setTimeout(() => {
							onContext(inlineImage.file, e, imageElement)
						}, 800)
					})
					imageElement.addEventListener("touchmove", (e: TouchEvent) => {
						const touch = e.touches[0]
						if (!touch || !startCoords || !timeoutId) return
						if (Math.abs(touch.clientX - startCoords.x) > 40 || Math.abs(touch.clientY - startCoords.y) > 40) {
							clearTimeout(timeoutId)
						}
					})

					imageElement.addEventListener("touchend", () => {
						timeoutId && clearTimeout(timeoutId)
					})
				}

				if (isDesktop()) { // add right click action for desktop apps
					imageElement.addEventListener("contextmenu", (e: MouseEvent) => {
						onContext(inlineImage.file, e, imageElement)
						e.preventDefault()
					})
				}
			}
		}
	})
	return elementsWithCid
}

export function replaceInlineImagesWithCids(dom: HTMLElement): HTMLElement {
	const domClone: HTMLElement = dom.cloneNode(true)
	const inlineImages: Array<HTMLElement> = Array.from(domClone.querySelectorAll("img[cid]"))
	inlineImages.forEach((inlineImage) => {
		const cid = inlineImage.getAttribute("cid")
		inlineImage.setAttribute("src", "cid:" + (cid || ""))
		inlineImage.removeAttribute("cid")
	})
	return domClone
}


export function archiveMails(mails: Mail[]): Promise<*> {
	if (mails.length > 0) {
		// assume all mails in the array belong to the same Mailbox
		return locator.mailModel.getMailboxFolders(mails[0])
		              .then((folders) => locator.mailModel.moveMails(mails, getArchiveFolder(folders)))
	} else {
		return Promise.resolve()
	}
}

export function moveToInbox(mails: Mail[]): Promise<*> {
	if (mails.length > 0) {
		// assume all mails in the array belong to the same Mailbox
		return locator.mailModel.getMailboxFolders(mails[0])
		              .then((folders) => locator.mailModel.moveMails(mails, getInboxFolder(folders)))
	} else {
		return Promise.resolve()
	}
}

/**
 * convert a set of mail to a set of dataFiles in eml format
 * @param mails array of mails to convert
 * @returns {Promise<(DataFile|any)[]>}
 */
export function mailsToEmlDataFiles(mails: Mail[]): Promise<DataFile[]> {
	const mapper = mail => load(MailBodyTypeRef, mail.body)
		.then(body => mailToEmlFile(mail, htmlSanitizer.sanitize(getMailBodyText(body), false).text))
	return Promise.map(mails, mapper, {concurrency: 5})
}

/**
 * export a set of mails into a zip file and offer to download
 * @param mails array of mails to export
 * @returns {Promise<void>} resolved after the fileController
 * was instructed to open the new zip File containing the mail eml
 */
export function exportMails(mails: Mail[]): Promise<void> {
	const exportPromise = mailsToEmlDataFiles(mails)
	const zipName = `${sortableTimestamp()}-mail-export.zip`
	return showProgressDialog("pleaseWait_msg", fileController.zipDataFiles(exportPromise, zipName))
		.then(zip => fileController.open(zip))
}

export function markMails(mails: Mail[], unread: boolean): Promise<void> {
	return Promise.all(mails.map(mail => {
		if (mail.unread !== unread) {
			mail.unread = unread
			return update(mail)
				.catch(NotFoundError, noOp)
				.catch(LockedError, noOp)
		} else {
			return Promise.resolve()
		}
	})).return()
}

export function copyMailAddress({address, name}: EncryptedMailAddress): EncryptedMailAddress {
	return createEncryptedMailAddress({address, name})
}