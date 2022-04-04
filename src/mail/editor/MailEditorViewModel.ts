import m, {Children} from "mithril"
import type {Attachment} from "./SendMailModel"
import {SendMailModel} from "./SendMailModel"
import type {lazy} from "@tutao/tutanota-utils"
import {cleanMatch, debounce, downcast, findAllAndRemove, ofClass, remove} from "@tutao/tutanota-utils"
import {Mode} from "../../api/common/Env"
import {PermissionError} from "../../api/common/error/PermissionError"
import {Dialog} from "../../gui/base/Dialog"
import {FileNotFoundError} from "../../api/common/error/FileNotFoundError"
import type {RecipientInfo} from "../../api/common/RecipientInfo"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"
import {TextFieldType} from "../../gui/base/TextFieldN"
import {PasswordIndicator} from "../../gui/PasswordIndicator"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonColor, ButtonType} from "../../gui/base/ButtonN"
import type {File as TutanotaFile} from "../../api/entities/tutanota/File"
import {FileOpenError} from "../../api/common/error/FileOpenError"
import type {DropdownInfoAttrs} from "../../gui/base/DropdownN"
import {attachDropdown} from "../../gui/base/DropdownN"
import {Icons} from "../../gui/base/icons/Icons"
import {formatStorageSize} from "../../misc/Formatter"
import {FeatureType} from "../../api/common/TutanotaConstants"
import {getContactDisplayName} from "../../contacts/model/ContactUtils"
import {
	createNewContact,
	getDisplayText,
	RecipientField,
	resolveRecipientInfo,
	resolveRecipientInfoContact
} from "../model/MailUtils"
import {Bubble, BubbleTextField} from "../../gui/base/BubbleTextField"
import type {RecipientInfoBubble, RecipientInfoBubbleFactory} from "../../misc/RecipientInfoBubbleHandler"
import {RecipientInfoBubbleHandler} from "../../misc/RecipientInfoBubbleHandler"
import type {Contact} from "../../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../../api/entities/tutanota/Contact"
import {ConnectionError, TooManyRequestsError} from "../../api/common/error/RestError"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import type {ContactModel} from "../../contacts/model/ContactModel"
import {locator} from "../../api/main/MainLocator"
import {FileReference} from "../../api/common/utils/FileUtils";
import {DataFile} from "../../api/common/DataFile";
import * as stream from "stream";
import Stream from "mithril/stream";

export function chooseAndAttachFile(
	model: SendMailModel,
	boundingRect: ClientRect,
	fileTypes?: Array<string>,
): Promise<ReadonlyArray<FileReference | DataFile> | void> {
	return showFileChooserForAttachments(boundingRect, fileTypes)
		.then(async files => {
			if (files) {
				model.attachFiles(files)
			}

			return files
		})
		.catch(ofClass(UserError, showUserError))
}

export function showFileChooserForAttachments(
	boundingRect: ClientRect,
	fileTypes?: Array<string>,
): Promise<ReadonlyArray<FileReference | DataFile> | void> {
	const fileSelector = env.mode === Mode.App ? locator.fileApp.openFileChooser(boundingRect) : locator.fileController.showFileChooser(true, fileTypes)
	return fileSelector
		.catch(
			ofClass(PermissionError, () => {
				Dialog.message("fileAccessDeniedMobile_msg")
			}),
		)
		.catch(
			ofClass(FileNotFoundError, () => {
				Dialog.message("couldNotAttachFile_msg")
			}),
		)
}

export function createPasswordField(model: SendMailModel, recipient: RecipientInfo): TextFieldAttrs {
	const passwordStrength = model.getPasswordStrength(recipient)
	const password = model.getPassword(recipient.mailAddress)
	const passwordIndicator = new PasswordIndicator(() => passwordStrength)
	return {
		label: () =>
			lang.get("passwordFor_label", {
				"{1}": recipient.mailAddress,
			}),
		helpLabel: () => m(passwordIndicator),
		value: Stream(password),
		type: TextFieldType.ExternalPassword,
		oninput: val => model.setPassword(recipient.mailAddress, val),
	}
}

export function createAttachmentButtonAttrs(model: SendMailModel, inlineImageElements: Array<HTMLElement>): Array<ButtonAttrs> {
	return model.getAttachments().map(file => {
		const lazyButtonAttrs: ButtonAttrs[] = [
			{
				label: "download_action",
				type: ButtonType.Secondary,
				click: () => _downloadAttachment(file),
			},
			{
				label: "remove_action",
				type: ButtonType.Secondary,
				click: () => {
					model.removeAttachment(file)

					// If an attachment has a cid it means it could be in the editor's inline images too
					if (file.cid) {
						const imageElement = inlineImageElements.find(e => e.getAttribute("cid") === file.cid)

						if (imageElement) {
							imageElement.remove()
							remove(inlineImageElements, imageElement)
						}
					}

					m.redraw()
				},
			},
		]
		return attachDropdown(
			{
                mainButtonAttrs: {
                    label: () => file.name,
                    icon: () => Icons.Attachment,
                    type: ButtonType.Bubble,
                    staticRightText: "(" + formatStorageSize(Number(file.size)) + ")",
                    colors: ButtonColor.Elevated,
                }, childAttrs: () => lazyButtonAttrs
            },
		)
	})
}

async function _downloadAttachment(attachment: Attachment) {
	try {
		if (attachment._type === "FileReference") {
			await locator.fileApp.open(downcast(attachment))
		} else if (attachment._type === "DataFile") {
			await locator.fileController.open(downcast(attachment))
		} else {
			await locator.fileController.downloadAndOpen((attachment as any) as TutanotaFile, true)
		}
	} catch (e) {
		if (e instanceof FileOpenError) {
			return Dialog.message("canNotOpenFileOnDevice_msg")
		} else {
			const msg = e || "unknown error"
			console.error("could not open file:", msg)
			return Dialog.message("errorDuringFileOpen_msg")
		}
	}
}

export const cleanupInlineAttachments: (arg0: HTMLElement, arg1: Array<HTMLElement>, arg2: Array<Attachment>) => void = debounce(
	50,
	(domElement: HTMLElement, inlineImageElements: Array<HTMLElement>, attachments: Array<Attachment>) => {
		// Previously we replied on subtree option of MutationObserver to receive info when nested child is removed.
		// It works but it doesn't work if the parent of the nested child is removed, we would have to go over each mutation
		// and check each descendant and if it's an image with CID or not.
		// It's easier and faster to just go over each inline image that we know about. It's more bookkeeping but it's easier
		// code which touches less dome.
		//
		// Alternative would be observe the parent of each inline image but that's more complexity and we need to take care of
		// new (just inserted) inline images and also assign listener there.
		// Doing this check instead of relying on mutations also helps with the case when node is removed but inserted again
		// briefly, e.g. if some text is inserted before/after the element, Squire would put it into another diff and this
		// means removal + insertion.
		const elementsToRemove: HTMLElement[] = []
		inlineImageElements.forEach(inlineImage => {
			if (domElement && !domElement.contains(inlineImage)) {
				const cid = inlineImage.getAttribute("cid")
				const attachmentIndex = attachments.findIndex(a => a.cid === cid)

				if (attachmentIndex !== -1) {
					attachments.splice(attachmentIndex, 1)
					elementsToRemove.push(inlineImage)
					m.redraw()
				}
			}
		})
		findAllAndRemove(inlineImageElements, imageElement => elementsToRemove.includes(imageElement))
	},
)

function _getRecipientFieldLabelTranslationKey(field: RecipientField): TranslationKey {
	return {
		to: "to_label",
		cc: "cc_label",
		bcc: "bcc_label",
	}[field] as TranslationKey
}

export function getConfidentialStateMessage(isConfidential: boolean): string {
	return isConfidential ? lang.get("confidentialStatus_msg") : lang.get("nonConfidentialStatus_msg")
}

export class MailEditorRecipientField implements RecipientInfoBubbleFactory {
	model: SendMailModel
	field: RecipientField
	component: BubbleTextField<RecipientInfo>
	bubbleDeleted: (arg0: Bubble<RecipientInfo>) => void
	_contactModel: ContactModel

	constructor(
		model: SendMailModel,
		fieldType: RecipientField,
		contactModel: ContactModel,
		injectionsRight?: lazy<Children>,
		disabled?: boolean,
	) {
		this.model = model
		this.field = fieldType
		const handler = new RecipientInfoBubbleHandler(this, contactModel)
		this.component = new BubbleTextField(_getRecipientFieldLabelTranslationKey(this.field), handler, injectionsRight, disabled)
		// we want to fill in the field with existing recipients from the model
		this.component.bubbles = this._modelRecipients().map(recipient => this.createBubble(recipient.name, recipient.mailAddress, recipient.contact))
		// When a recipient is deleted via the model (from an entityEventUpdate for example),
		// we need to delete all the bubbles that reference it
		model.onRecipientDeleted.map(r => {
			if (!r) return
			const {field, recipient} = r

			if (field === fieldType) {
				findAllAndRemove(this.component.bubbles, bubble => bubble.entity === recipient)
			}
		})
		this.bubbleDeleted = this.onBubbleDeleted
		this._contactModel = contactModel
	}

	createBubble(name: string | null, address: string, contact: Contact | null): Bubble<RecipientInfo> {
		// addOrGetRecipient will either create and add a new recipientInfo to itself
		// or will return an existing recipientInfo from itself
		// duplicate bubbles will not have a duplicate in the sendmailmodel
		const [recipientInfo] = this.model.addOrGetRecipient(
			this.field,
			{
				name,
				address,
				contact,
			},
			false,
		)
		let bubble: Bubble<RecipientInfo>
		const buttonAttrs = attachDropdown(
			{
                mainButtonAttrs: {
                    label: () => getDisplayText(recipientInfo.name, recipientInfo.mailAddress, false),
                    type: ButtonType.TextBubble,
                    isSelected: () => false,
                }, childAttrs: () =>
                    recipientInfo.resolveContactPromise
                        ? recipientInfo.resolveContactPromise.then(contact => this._createBubbleContextButtons(bubble))
                        : Promise.resolve(this._createBubbleContextButtons(bubble)), showDropdown: undefined, width: 250
            },
		)
		bubble = new Bubble(recipientInfo, buttonAttrs, recipientInfo.mailAddress)

		if (this.model.logins().isInternalUserLoggedIn()) {
			resolveRecipientInfoContact(recipientInfo, this.model.contacts(), this.model.logins().getUserController().user)
		} else {
			resolveRecipientInfo(this.model.mailFacade(), recipientInfo)
				.then(() => m.redraw())
				.catch(
					ofClass(ConnectionError, e => {
						// we are offline but we want to show the error dialog only when we click on send.
					}),
				)
				.catch(
					ofClass(TooManyRequestsError, e => {
						Dialog.message("tooManyAttempts_msg")
					}),
				)
		}

		return bubble
	}

	onBubbleDeleted(bubble: Bubble<RecipientInfo>) {
		const recipients = this._modelRecipients()

		// if that was the last bubble to reference a given recipient we want to remove that recipient from the model
		// we don't need to tell ourself about it so we don't notify
		if (!this.component.bubbles.some(b => b.entity === bubble.entity)) {
			this.model.removeRecipient(bubble.entity, this.field, false)
		}
	}

	_createEditContactButton(recipient: RecipientInfo): ButtonAttrs {
		return {
			label: () => lang.get("editContact_label"),
			type: ButtonType.Secondary,
			click: () => {
				import("../../contacts/ContactEditor").then(({ContactEditor}) => new ContactEditor(this.model.entity(), recipient.contact).show())
			},
		}
	}

	_createRemoveButton(bubble: RecipientInfoBubble): ButtonAttrs {
		return {
			label: "remove_action",
			type: ButtonType.Secondary,
			click: () => {
				// On removal of a bubble, we only want to remove a recipientInfo from the model if it was the last bubble to reference the given recipient
				if (remove(this.component.bubbles, bubble)) {
					this.bubbleDeleted(bubble)
				}
			},
		}
	}

	_createCreateContactButton(recipient: RecipientInfo, createdContactReceiver: (contactElementId: Id) => void): ButtonAttrs {
		return {
			label: () => lang.get("createContact_action"),
			type: ButtonType.Secondary,
			click: () => {
				// contact list
				this._contactModel.contactListId().then(contactListId => {
					const newContact = createNewContact(this.model.logins().getUserController().user, recipient.mailAddress, recipient.name)
					import("../../contacts/ContactEditor").then(({ContactEditor}) => {
						new ContactEditor(this.model.entity(), newContact, contactListId ?? undefined, createdContactReceiver).show()
					})
				})
			},
		}
	}

	_createBubbleContextButtons(bubble: RecipientInfoBubble): Array<ButtonAttrs | DropdownInfoAttrs> {
		const recipient = bubble.entity
		const canEditBubbleRecipient = this.model.user().isInternalUser() && !this.model.logins().isEnabled(FeatureType.DisableContacts)
		const previousMail = this.model.getPreviousMail()
		const canRemoveBubble =
			this.model.user().isInternalUser() && (!previousMail || !previousMail.restrictions || previousMail.restrictions.participantGroupInfos.length === 0)

		const createdContactReceiver = (contactElementId: Id) => {
			const mailAddress = recipient.mailAddress

			this._contactModel.contactListId().then(contactListId => {
				if (!contactListId) return
				const id: IdTuple = [contactListId, contactElementId]
				this.model
					.entity()
					.load(ContactTypeRef, id)
					.then(contact => {
						if (contact.mailAddresses.find(ma => cleanMatch(ma.address, mailAddress))) {
							recipient.name = getContactDisplayName(contact)
							recipient.contact = contact
							recipient.resolveContactPromise = null
						} else {
							this.model.removeRecipient(recipient, this.field, false)
							remove(this.component.bubbles, bubble)
						}
					})
			})
		}

		const contextButtons: Array<ButtonAttrs | DropdownInfoAttrs> = []
		// email address as info text
		contextButtons.push({
			info: recipient.mailAddress,
			center: true,
			bold: true,
		})

		if (canEditBubbleRecipient) {
			if (recipient.contact && recipient.contact._id) {
				contextButtons.push(this._createEditContactButton(recipient))
			} else {
				contextButtons.push(this._createCreateContactButton(recipient, createdContactReceiver))
			}
		}

		if (canRemoveBubble) {
			contextButtons.push(this._createRemoveButton(bubble))
		}

		return contextButtons
	}

	_modelRecipients(): Array<RecipientInfo> {
		return this.model.getRecipientList(this.field)
	}
}