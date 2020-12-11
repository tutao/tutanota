// @flow
import type {RecipientInfo} from "../api/common/RecipientInfo"
import {isTutanotaMailAddress, RecipientInfoType} from "../api/common/RecipientInfo"
import {fullNameToFirstAndLastName, mailAddressToFirstAndLastName, stringToNameAndMailAddress} from "../misc/Formatter"
import type {Contact} from "../api/entities/tutanota/Contact"
import {createContact} from "../api/entities/tutanota/Contact"
import {createContactMailAddress} from "../api/entities/tutanota/ContactMailAddress"
import type {ConversationTypeEnum, MailFolderTypeEnum} from "../api/common/TutanotaConstants"
import {
	ContactAddressType,
	ConversationType,
	EmailSignatureType as TutanotaConstants,
	getMailFolderType,
	GroupType,
	MailFolderType,
	MailState
} from "../api/common/TutanotaConstants"
import {
	assertNotNull,
	downcast,
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
import {logins as globalLogins} from "../api/main/LoginController"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import type {Language} from "../misc/LanguageViewModel"
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
import {EntityClient} from "../api/common/EntityClient"
import {CustomerPropertiesTypeRef} from "../api/entities/sys/CustomerProperties"
import {client} from "../misc/ClientDetector"
import {getTimeZone} from "../calendar/CalendarUtils"

assertMainOrNode()

const SIGNATURE_DISTANCE = "<br><br>"

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

export function prependEmailSignature(body: string): string {
	let withSignature = "<br/><br/><br/>" + body
	let signature = getEmailSignature(globalLogins)
	if (globalLogins.getUserController().isInternalUser() && signature) {
		withSignature = signature + withSignature
	}
	return withSignature
}

export function appendEmailSignature(body: string): string {
	const signature = getEmailSignature()
	if (signature) {
		return body + signature
	} else {
		return body
	}
}

/**
 * Resolves the existing contact for the recipient info if it has not contact. Creates a new contact if no contact has been found.
 * Caller can either wait until promise is resolved or read the stored promise on the recipient info.
 */
export function resolveRecipientInfoContact(recipientInfo: RecipientInfo, contactModel: ContactModel, user: User): Promise<Contact> {
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
			return recipientInfo.contact
		}).catch(e => {
			console.log("error resolving contact", e)
			recipientInfo.contact = createNewContact(user, recipientInfo.mailAddress, recipientInfo.name)
			recipientInfo.resolveContactPromise = null
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

export function getDisplayText(name: string, mailAddress: string, preferNameOnly: boolean): string {
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

export function isExcludedMailAddress(mailAddress: string): boolean {
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

export function getDefaultSignature(): string {
	return SIGNATURE_DISTANCE
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

export function getFolderName(folder: MailFolder): string {
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
	return getSenderNameForUser(mailboxDetails, globalLogins.getUserController())
}

export function getSenderNameForUser(mailboxDetails: MailboxDetail, userController: IUserController): string {
	if (isUserMailbox(mailboxDetails)) {
		// external users do not have access to the user group info
		return userController.userGroupInfo.name
	} else {
		return mailboxDetails.mailGroupInfo ? mailboxDetails.mailGroupInfo.name : ""
	}
}

export function getEmailSignature(logins: LoginController = globalLogins): string {
	// provide the user signature, even for shared mail groups
	const type = logins.getUserController().props.emailSignatureType;
	if (type === TutanotaConstants.EMAIL_SIGNATURE_TYPE_DEFAULT) {
		// default signature already contains empty lines
		return getDefaultSignature()
	} else if (TutanotaConstants.EMAIL_SIGNATURE_TYPE_CUSTOM === type) {
		return SIGNATURE_DISTANCE + logins.getUserController().props.customEmailSignature
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
                                            onContext: (TutanotaFile | DataFile, Event, HTMLElement) => mixed): Array<HTMLElement> {
	// all image tags which have cid attribute. The cid attribute has been set by the sanitizer for adding a default image.
	const imageElements: Array<HTMLElement> = Array.from(dom.querySelectorAll("img[cid]"))
	const elementsWithCid = []
	imageElements.forEach((imageElement) => {
		const cid = imageElement.getAttribute("cid")
		if (cid) {
			const inlineImage = inlineImages.get(cid)
			if (inlineImage) {
				elementsWithCid.push(imageElement)
				imageElement.setAttribute("src", inlineImage.url)
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

export function exportMails(mails: Mail[]): Promise<void> {
	const mapper = mail => load(MailBodyTypeRef, mail.body)
		.then(body => mailToEmlFile(mail, htmlSanitizer.sanitize(getMailBodyText(body), false).text))
	const exportPromise = Promise.map(mails, mapper, {concurrency: 5})
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

export type InlineImageReference = {
	cid: string;
	objectUrl: string;
}

export function createInlineImage(file: FileReference | DataFile): InlineImageReference {
	// Let'S assume it's DataFile for now... Editor bar is available for apps but image button is not
	const dataFile: DataFile = downcast(file)
	const cid = Math.random().toString(30).substring(2)
	file.cid = cid
	const blob = new Blob([dataFile.data], {type: file.mimeType})
	const objectUrl = URL.createObjectURL(blob)
	return {
		cid: cid,
		objectUrl: objectUrl
	}
}

export function getTemplateLanguages(sortedLanguages: Array<Language>, entityClient: EntityClient, loginController: LoginController): Promise<Array<Language>> {
	return loginController.getUserController().loadCustomer()
	                      .then((customer) => entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties)))
	                      .then((customerProperties) => {
		                      return sortedLanguages.filter(sL =>
			                      customerProperties.notificationMailTemplates.find((nmt) => nmt.language === sL.code))
	                      })
	                      .catch(() => [])
}

export function getSupportMailSignature(): string {
	return SIGNATURE_DISTANCE + "--"
		+ `<br>Client: ${client.getIdentifier()}`
		+ `<br>Tutanota version: ${env.versionNumber}`
		+ `<br>Time zone: ${getTimeZone()}`
		+ `<br>User agent:<br> ${navigator.userAgent}`
}

export function conversationTypeString(conversationType: ConversationTypeEnum): string {
	let key
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

export function replaceHtmlEntities(str: string): string {
	let m: Map<string, string> = new Map([
		["&quot;", "&#34;"],
		["&amp;", "&#38;"],
		["&apos;", "&#39;"],
		["&lt;", "&#60;"],
		["&gt;", "&#62;"],
		["&nbsp;", "&#160;"],
		["&iexcl;", "&#161;"],
		["&cent;", "&#162;"],
		["&pound;", "&#163;"],
		["&curren;", "&#164;"],
		["&yen;", "&#165;"],
		["&brvbar;", "&#166;"],
		["&sect;", "&#167;"],
		["&uml;", "&#168;"],
		["&copy;", "&#169;"],
		["&ordf;", "&#170;"],
		["&laquo;", "&#171;"],
		["&not;", "&#172;"],
		["&shy;", "&#173;"],
		["&reg;", "&#174;"],
		["&macr;", "&#175;"],
		["&deg;", "&#176;"],
		["&plusmn;", "&#177;"],
		["&sup2;", "&#178;"],
		["&sup3;", "&#179;"],
		["&acute;", "&#180;"],
		["&micro;", "&#181;"],
		["&para;", "&#182;"],
		["&middot;", "&#183;"],
		["&cedil;", "&#184;"],
		["&sup1;", "&#185;"],
		["&ordm;", "&#186;"],
		["&raquo;", "&#187;"],
		["&frac14;", "&#188;"],
		["&frac12;", "&#189;"],
		["&frac34;", "&#190;"],
		["&iquest;", "&#191;"],
		["&Agrave;", "&#192;"],
		["&Aacute;", "&#193;"],
		["&Acirc;", "&#194;"],
		["&Atilde;", "&#195;"],
		["&Auml;", "&#196;"],
		["&Aring;", "&#197;"],
		["&AElig;", "&#198;"],
		["&Ccedil;", "&#199;"],
		["&Egrave;", "&#200;"],
		["&Eacute;", "&#201;"],
		["&Ecirc;", "&#202;"],
		["&Euml;", "&#203;"],
		["&Igrave;", "&#204;"],
		["&Iacute;", "&#205;"],
		["&Icirc;", "&#206;"],
		["&Iuml;", "&#207;"],
		["&ETH;", "&#208;"],
		["&Ntilde;", "&#209;"],
		["&Ograve;", "&#210;"],
		["&Oacute;", "&#211;"],
		["&Ocirc;", "&#212;"],
		["&Otilde;", "&#213;"],
		["&Ouml;", "&#214;"],
		["&times;", "&#215;"],
		["&Oslash;", "&#216;"],
		["&Ugrave;", "&#217;"],
		["&Uacute;", "&#218;"],
		["&Ucirc;", "&#219;"],
		["&Uuml;", "&#220;"],
		["&Yacute;", "&#221;"],
		["&THORN;", "&#222;"],
		["&szlig;", "&#223;"],
		["&agrave;", "&#224;"],
		["&aacute;", "&#225;"],
		["&acirc;", "&#226;"],
		["&atilde;", "&#227;"],
		["&auml;", "&#228;"],
		["&aring;", "&#229;"],
		["&aelig;", "&#230;"],
		["&ccedil;", "&#231;"],
		["&egrave;", "&#232;"],
		["&eacute;", "&#233;"],
		["&ecirc;", "&#234;"],
		["&euml;", "&#235;"],
		["&igrave;", "&#236;"],
		["&iacute;", "&#237;"],
		["&icirc;", "&#238;"],
		["&iuml;", "&#239;"],
		["&eth;", "&#240;"],
		["&ntilde;", "&#241;"],
		["&ograve;", "&#242;"],
		["&oacute;", "&#243;"],
		["&ocirc;", "&#244;"],
		["&otilde;", "&#245;"],
		["&ouml;", "&#246;"],
		["&divide;", "&#247;"],
		["&oslash;", "&#248;"],
		["&ugrave;", "&#249;"],
		["&uacute;", "&#250;"],
		["&ucirc;", "&#251;"],
		["&uuml;", "&#252;"],
		["&yacute;", "&#253;"],
		["&thorn;", "&#254;"],
		["&yuml;", "&#255;"],
		["&OElig;", "&#338;"],
		["&oelig;", "&#339;"],
		["&Scaron;", "&#352;"],
		["&scaron;", "&#353;"],
		["&Yuml;", "&#376;"],
		["&fnof;", "&#402;"],
		["&circ;", "&#710;"],
		["&tilde;", "&#732;"],
		["&Alpha;", "&#913;"],
		["&Beta;", "&#914;"],
		["&Gamma;", "&#915;"],
		["&Delta;", "&#916;"],
		["&Epsilon;", "&#917;"],
		["&Zeta;", "&#918;"],
		["&Eta;", "&#919;"],
		["&Theta;", "&#920;"],
		["&Iota;", "&#921;"],
		["&Kappa;", "&#922;"],
		["&Lambda;", "&#923;"],
		["&Mu;", "&#924;"],
		["&Nu;", "&#925;"],
		["&Xi;", "&#926;"],
		["&Omicron;", "&#927;"],
		["&Pi;", "&#928;"],
		["&Rho;", "&#929;"],
		["&Sigma;", "&#931;"],
		["&Tau;", "&#932;"],
		["&Upsilon;", "&#933;"],
		["&Phi;", "&#934;"],
		["&Chi;", "&#935;"],
		["&Psi;", "&#936;"],
		["&Omega;", "&#937;"],
		["&alpha;", "&#945;"],
		["&beta;", "&#946;"],
		["&gamma;", "&#947;"],
		["&delta;", "&#948;"],
		["&epsilon;", "&#949;"],
		["&zeta;", "&#950;"],
		["&eta;", "&#951;"],
		["&theta;", "&#952;"],
		["&iota;", "&#953;"],
		["&kappa;", "&#954;"],
		["&lambda;", "&#955;"],
		["&mu;", "&#956;"],
		["&nu;", "&#957;"],
		["&xi;", "&#958;"],
		["&omicron;", "&#959;"],
		["&pi;", "&#960;"],
		["&rho;", "&#961;"],
		["&sigmaf;", "&#962;"],
		["&sigma;", "&#963;"],
		["&tau;", "&#964;"],
		["&upsilon;", "&#965;"],
		["&phi;", "&#966;"],
		["&chi;", "&#967;"],
		["&psi;", "&#968;"],
		["&omega;", "&#969;"],
		["&thetasym;", "&#977;"],
		["&upsih;", "&#978;"],
		["&piv;", "&#982;"],
		["&ensp;", "&#8194;"],
		["&emsp;", "&#8195;"],
		["&thinsp;", "&#8201;"],
		["&zwnj;", "&#8204;"],
		["&zwj;", "&#8205;"],
		["&lrm;", "&#8206;"],
		["&rlm;", "&#8207;"],
		["&ndash;", "&#8211;"],
		["&mdash;", "&#8212;"],
		["&lsquo;", "&#8216;"],
		["&rsquo;", "&#8217;"],
		["&sbquo;", "&#8218;"],
		["&ldquo;", "&#8220;"],
		["&rdquo;", "&#8221;"],
		["&bdquo;", "&#8222;"],
		["&dagger;", "&#8224;"],
		["&Dagger;", "&#8225;"],
		["&bull;", "&#8226;"],
		["&hellip;", "&#8230;"],
		["&permil;", "&#8240;"],
		["&prime;", "&#8242;"],
		["&Prime;", "&#8243;"],
		["&lsaquo;", "&#8249;"],
		["&rsaquo;", "&#8250;"],
		["&oline;", "&#8254;"],
		["&frasl;", "&#8260;"],
		["&euro;", "&#8364;"],
		["&image;", "&#8465;"],
		["&weierp;", "&#8472;"],
		["&real;", "&#8476;"],
		["&trade;", "&#8482;"],
		["&alefsym;", "&#8501;"],
		["&larr;", "&#8592;"],
		["&uarr;", "&#8593;"],
		["&rarr;", "&#8594;"],
		["&darr;", "&#8595;"],
		["&harr;", "&#8596;"],
		["&crarr;", "&#8629;"],
		["&lArr;", "&#8656;"],
		["&uArr;", "&#8657;"],
		["&rArr;", "&#8658;"],
		["&dArr;", "&#8659;"],
		["&hArr;", "&#8660;"],
		["&forall;", "&#8704;"],
		["&part;", "&#8706;"],
		["&exist;", "&#8707;"],
		["&empty;", "&#8709;"],
		["&nabla;", "&#8711;"],
		["&isin;", "&#8712;"],
		["&notin;", "&#8713;"],
		["&ni;", "&#8715;"],
		["&prod;", "&#8719;"],
		["&sum;", "&#8721;"],
		["&minus;", "&#8722;"],
		["&lowast;", "&#8727;"],
		["&radic;", "&#8730;"],
		["&prop;", "&#8733;"],
		["&infin;", "&#8734;"],
		["&ang;", "&#8736;"],
		["&and;", "&#8743;"],
		["&or;", "&#8744;"],
		["&cap;", "&#8745;"],
		["&cup;", "&#8746;"],
		["&int;", "&#8747;"],
		["&there4;", "&#8756;"],
		["&sim;", "&#8764;"],
		["&cong;", "&#8773;"],
		["&asymp;", "&#8776;"],
		["&ne;", "&#8800;"],
		["&equiv;", "&#8801;"],
		["&le;", "&#8804;"],
		["&ge;", "&#8805;"],
		["&sub;", "&#8834;"],
		["&sup;", "&#8835;"],
		["&nsub;", "&#8836;"],
		["&sube;", "&#8838;"],
		["&supe;", "&#8839;"],
		["&oplus;", "&#8853;"],
		["&otimes;", "&#8855;"],
		["&perp;", "&#8869;"],
		["&sdot;", "&#8901;"],
		["&lceil;", "&#8968;"],
		["&rceil;", "&#8969;"],
		["&lfloor;", "&#8970;"],
		["&rfloor;", "&#8971;"],
		["&lang;", "&#9001;"],
		["&rang;", "&#9002;"],
		["&loz;", "&#9674;"],
		["&spades;", "&#9824;"],
		["&clubs;", "&#9827;"],
		["&hearts;", "&#9829;"],
		["&diams;", "&#9830;"]
	])
	return str.replace(/&.*?;/, match => (m.get(match) || ""))
}