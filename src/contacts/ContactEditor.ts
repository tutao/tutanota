import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../gui/base/Dialog"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { isMailAddress } from "../misc/FormatValidator"
import { formatBirthdayNumeric, formatBirthdayOfContact } from "./model/ContactUtils"
import { ContactAddressType, ContactPhoneNumberType, ContactSocialType, GroupType, Keys } from "../api/common/TutanotaConstants"
import type { Contact, ContactAddress, ContactMailAddress, ContactPhoneNumber, ContactSocialId } from "../api/entities/tutanota/TypeRefs.js"
import {
	createBirthday,
	createContact,
	createContactAddress,
	createContactMailAddress,
	createContactPhoneNumber,
	createContactSocialId,
} from "../api/entities/tutanota/TypeRefs.js"
import { assertNotNull, clone, downcast, findAndRemove, lastIndex, lastThrow, noOp, typedEntries } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../api/common/Env"
import { windowFacade } from "../misc/WindowFacade"
import { LockedError, NotFoundError, PayloadTooLargeError } from "../api/common/error/RestError"
import type { ButtonAttrs } from "../gui/base/Button.js"
import { ButtonType } from "../gui/base/Button.js"
import { birthdayToIsoDate } from "../api/common/utils/BirthdayUtils"
import {
	ContactMailAddressTypeToLabel,
	ContactPhoneNumberTypeToLabel,
	ContactSocialTypeToLabel,
	getContactAddressTypeLabel,
	getContactPhoneNumberTypeLabel,
	getContactSocialTypeLabel,
} from "./view/ContactGuiUtils"
import { parseBirthday } from "../misc/DateParser"
import type { TextFieldAttrs } from "../gui/base/TextField.js"
import { Autocomplete, TextField, TextFieldType } from "../gui/base/TextField.js"
import { EntityClient } from "../api/common/EntityClient"
import { timestampToGeneratedId } from "../api/common/utils/EntityUtils"
import { ContactAggregateEditor } from "./ContactAggregateEditor"
import { DefaultAnimationTime } from "../gui/animation/Animations"
import { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"
import { ToggleButton } from "../gui/base/buttons/ToggleButton.js"
import { Icons } from "../gui/base/icons/Icons.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { locator } from "../api/main/MainLocator.js"
import { formatDate } from "../misc/Formatter.js"

assertMainOrNode()

const TAG = "[ContactEditor]"

export class ContactEditor {
	private readonly dialog: Dialog
	private hasInvalidBirthday: boolean
	private readonly mailAddresses: Array<[ContactMailAddress, Id]>
	private readonly phoneNumbers: Array<[ContactPhoneNumber, Id]>
	private readonly addresses: Array<[ContactAddress, Id]>
	private readonly socialIds: Array<[ContactSocialId, Id]>
	private birthday: string
	private isPasswordRevealed: boolean = false
	windowCloseUnsubscribe: () => unknown
	private readonly isNewContact: boolean
	private readonly contact: Contact
	private readonly listId: Id

	private saving: boolean = false

	/*
	 * The contact that should be update or the contact list that the new contact should be written to must be provided
	 * @param entityClient
	 * @param contact An existing or new contact. If null a new contact is created.
	 * @param listId The list id of the new contact.
	 * @param newContactIdReceiver. Is called receiving the contact id as soon as the new contact was saved.
	 */
	constructor(
		private readonly entityClient: EntityClient,
		contact: Contact | null,
		listId?: Id,
		private readonly newContactIdReceiver: ((contactId: Id) => unknown) | null = null,
	) {
		this.contact = contact
			? clone(contact)
			: createContact({
					mailAddresses: [],
					title: null,
					socialIds: [],
					role: "",
					presharedPassword: null,
					photo: null,
					phoneNumbers: [],
					oldBirthdayDate: null,
					nickname: null,
					lastName: "",
					firstName: "",
					company: "",
					comment: "",
					birthdayIso: null,
					addresses: [],
					autoTransmitPassword: "",
					oldBirthdayAggregate: null,
			  })
		this.isNewContact = contact?._id == null

		if (this.isNewContact && listId == null) {
			throw new ProgrammingError("must provide contact with Id to edit or listId for the new contact")
		} else {
			this.listId = listId ? listId : assertNotNull(contact, "got an existing contact without id")._id[0]
		}

		const id = (entity: { _id: Id }) => entity._id || this.newId()

		this.mailAddresses = this.contact.mailAddresses.map((address) => [address, id(address)])
		this.mailAddresses.push(this.newMailAddress())
		this.phoneNumbers = this.contact.phoneNumbers.map((phoneNumber) => [phoneNumber, id(phoneNumber)])
		this.phoneNumbers.push(this.newPhoneNumber())
		this.addresses = this.contact.addresses.map((address) => [address, id(address)])
		this.addresses.push(this.newAddress())
		this.socialIds = this.contact.socialIds.map((socialId) => [socialId, id(socialId)])
		this.socialIds.push(this.newSocialId())
		this.hasInvalidBirthday = false
		this.birthday = formatBirthdayOfContact(this.contact) || ""
		this.dialog = this.createDialog()
		this.windowCloseUnsubscribe = noOp
	}

	oncreate() {
		this.windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {})
	}

	onremove() {
		this.windowCloseUnsubscribe()
	}

	view(): Children {
		return m("#contact-editor", [
			m(".wrapping-row", [this.renderFirstNameField(), this.renderLastNameField()]),
			m(".wrapping-row", [this.renderTitleField(), this.renderBirthdayField()]),
			m(".wrapping-row", [this.renderRoleField(), this.renderCompanyField(), this.renderNickNameField(), this.renderCommentField()]),
			m(".wrapping-row", [
				m(".mail.mt-xl", [
					m(".h4", lang.get("email_label")),
					m(".aggregateEditors", [
						this.mailAddresses.map(([address, id], index) => {
							const lastEditor = index === lastIndex(this.mailAddresses)
							return this.renderMailAddressesEditor(id, !lastEditor, address)
						}),
					]),
				]),
				m(".phone.mt-xl", [
					m(".h4", lang.get("phone_label")),
					m(".aggregateEditors", [
						this.phoneNumbers.map(([phoneNumber, id], index) => {
							const lastEditor = index === lastIndex(this.phoneNumbers)
							return this.renderPhonesEditor(id, !lastEditor, phoneNumber)
						}),
					]),
				]),
			]),
			m(".wrapping-row", [
				m(".address.mt-xl", [
					m(".h4", lang.get("address_label")),
					m(".aggregateEditors", [
						this.addresses.map(([address, id], index) => {
							const lastEditor = index === lastIndex(this.addresses)
							return this.renderAddressesEditor(id, !lastEditor, address)
						}),
					]),
				]),
				m(".social.mt-xl", [
					m(".h4", lang.get("social_label")),
					m(".aggregateEditors", [
						this.socialIds.map(([socialId, id], index) => {
							const lastEditor = index === lastIndex(this.socialIds)
							return this.renderSocialsEditor(id, !lastEditor, socialId)
						}),
					]),
				]),
			]),
			this.renderPresharedPasswordField(),
			m(".pb"),
		])
	}

	show() {
		this.dialog.show()
	}

	private close() {
		this.dialog.close()
	}

	/**
	 * * validate the input data
	 * * create or update the contact, depending on status
	 * * if successful, close the dialog.
	 *
	 * will not call the save function again if the operation is already running
	 * @private
	 */
	private async validateAndSave(): Promise<void> {
		if (this.hasInvalidBirthday) {
			return Dialog.message("invalidBirthday_msg")
		}

		if (this.saving) {
			// not showing a message. if the resource is locked, we'll show one when appropriate.
			return
		}
		this.saving = true

		this.contact.mailAddresses = this.mailAddresses.map((e) => e[0]).filter((e) => e.address.trim().length > 0)
		this.contact.phoneNumbers = this.phoneNumbers.map((e) => e[0]).filter((e) => e.number.trim().length > 0)
		this.contact.addresses = this.addresses.map((e) => e[0]).filter((e) => e.address.trim().length > 0)
		this.contact.socialIds = this.socialIds.map((e) => e[0]).filter((e) => e.socialId.trim().length > 0)
		try {
			if (this.isNewContact) {
				await this.saveNewContact()
			} else {
				await this.updateExistingContact()
			}
			this.close()
		} catch (e) {
			this.saving = false
			if (e instanceof PayloadTooLargeError) {
				return Dialog.message("requestTooLarge_msg")
			}
			if (e instanceof LockedError) {
				return Dialog.message("operationStillActive_msg")
			}
		}
		// if we got here, we're closing the dialog and don't have to reset this.saving
	}

	private async updateExistingContact(): Promise<void> {
		try {
			await this.entityClient.update(this.contact)
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log(TAG, `could not update contact ${this.contact._id}: not found`)
			}
		}
	}

	private async saveNewContact(): Promise<void> {
		this.contact._area = "0" // legacy
		this.contact.autoTransmitPassword = "" // legacy
		this.contact._owner = locator.logins.getUserController().user._id
		this.contact._ownerGroup = assertNotNull(
			locator.logins.getUserController().user.memberships.find((m) => m.groupType === GroupType.Contact),
			"did not find contact group membership",
		).group
		const contactId = await this.entityClient.setup(this.listId, this.contact)
		if (this.newContactIdReceiver) {
			this.newContactIdReceiver(contactId)
		}
	}

	private renderMailAddressesEditor(id: Id, allowCancel: boolean, mailAddress: ContactMailAddress): Children {
		let helpLabel: TranslationKey

		if (mailAddress.address.trim().length > 0 && !isMailAddress(mailAddress.address.trim(), false)) {
			helpLabel = "invalidInputFormat_msg"
		} else {
			helpLabel = "emptyString_msg"
		}

		const typeLabels: Array<[ContactAddressType, TranslationKey]> = typedEntries(ContactMailAddressTypeToLabel)
		return m(ContactAggregateEditor, {
			value: mailAddress.address,
			fieldType: TextFieldType.Email,
			label: getContactAddressTypeLabel(downcast(mailAddress.type), mailAddress.customTypeName),
			helpLabel,
			cancelAction: () => {
				findAndRemove(this.mailAddresses, (t) => t[1] === id)
			},
			onUpdate: (value) => {
				mailAddress.address = value
				if (mailAddress === lastThrow(this.mailAddresses)[0]) this.mailAddresses.push(this.newAddress())
			},
			animateCreate: !mailAddress.address,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactAddressType.CUSTOM, type, mailAddress),
		})
	}

	private renderPhonesEditor(id: Id, allowCancel: boolean, phoneNumber: ContactPhoneNumber): Children {
		const typeLabels = typedEntries(ContactPhoneNumberTypeToLabel)
		return m(ContactAggregateEditor, {
			value: phoneNumber.number,
			fieldType: TextFieldType.Text,
			label: getContactPhoneNumberTypeLabel(downcast(phoneNumber.type), phoneNumber.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.phoneNumbers, (t) => t[1] === id)
			},
			onUpdate: (value) => {
				phoneNumber.number = value
				if (phoneNumber === lastThrow(this.phoneNumbers)[0]) this.phoneNumbers.push(this.newPhoneNumber())
			},
			animateCreate: !phoneNumber.number,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactPhoneNumberType.CUSTOM, type, phoneNumber),
		})
	}

	private renderAddressesEditor(id: Id, allowCancel: boolean, address: ContactAddress): Children {
		const typeLabels = typedEntries(ContactMailAddressTypeToLabel)
		return m(ContactAggregateEditor, {
			value: address.address,
			fieldType: TextFieldType.Area,
			label: getContactAddressTypeLabel(downcast(address.type), address.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.addresses, (t) => t[1] === id)
			},
			onUpdate: (value) => {
				address.address = value
				if (address === lastThrow(this.addresses)[0]) this.addresses.push(this.newAddress())
			},
			animateCreate: !address.address,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactAddressType.CUSTOM, type, address),
		})
	}

	private renderSocialsEditor(id: Id, allowCancel: boolean, socialId: ContactSocialId): Children {
		const typeLabels = typedEntries(ContactSocialTypeToLabel)
		return m(ContactAggregateEditor, {
			value: socialId.socialId,
			fieldType: TextFieldType.Text,
			label: getContactSocialTypeLabel(downcast<ContactSocialType>(socialId.type), socialId.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.socialIds, (t) => t[1] === id)
			},
			onUpdate: (value) => {
				socialId.socialId = value
				if (socialId === lastThrow(this.socialIds)[0]) this.socialIds.push(this.newSocialId())
			},
			animateCreate: !socialId.socialId,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this.onTypeSelected(type === ContactSocialType.CUSTOM, type, socialId),
		})
	}

	private renderCommentField(): Children {
		return m(StandaloneField, {
			label: "comment_label",
			value: this.contact.comment,
			oninput: (value) => (this.contact.comment = value),
			type: TextFieldType.Area,
		})
	}

	private renderFirstNameField(): Children {
		return m(StandaloneField, {
			label: "firstName_placeholder",
			value: this.contact.firstName,
			oninput: (value) => (this.contact.firstName = value),
		})
	}

	private renderNickNameField(): Children {
		return m(StandaloneField, {
			label: "nickname_placeholder",
			value: this.contact.nickname ?? "",
			oninput: (value) => (this.contact.nickname = value),
		})
	}

	private renderLastNameField(): Children {
		return m(StandaloneField, {
			label: "lastName_placeholder",
			value: this.contact.lastName,
			oninput: (value) => (this.contact.lastName = value),
		})
	}

	private renderBirthdayField(): Children {
		let birthdayHelpText = () => {
			let bday = createBirthday({
				day: "22",
				month: "9",
				year: "2000",
			})
			return this.hasInvalidBirthday
				? lang.get("invalidDateFormat_msg", {
						"{1}": formatBirthdayNumeric(bday),
				  })
				: ""
		}

		return m(StandaloneField, {
			label: "birthday_alt",
			value: this.birthday,
			helpLabel: birthdayHelpText,
			oninput: (value) => {
				this.birthday = value
				if (value.trim().length === 0) {
					this.contact.birthdayIso = null
					this.hasInvalidBirthday = false
				} else {
					let birthday = parseBirthday(value, (referenceDate) => formatDate(referenceDate))

					if (birthday) {
						try {
							this.contact.birthdayIso = birthdayToIsoDate(birthday)
							this.hasInvalidBirthday = false
						} catch (e) {
							this.hasInvalidBirthday = true
						}
					} else {
						this.hasInvalidBirthday = true
					}
				}
			},
		})
	}

	private renderCompanyField(): Children {
		return m(StandaloneField, {
			label: "company_label",
			value: this.contact.company,
			oninput: (value) => (this.contact.company = value),
		})
	}

	private renderRoleField(): Children {
		return m(StandaloneField, {
			label: "role_placeholder",
			value: this.contact.role,
			oninput: (value) => (this.contact.role = value),
		})
	}

	private renderTitleField(): Children {
		return m(StandaloneField, {
			label: "title_placeholder",
			value: this.contact.title || "",
			oninput: (value) => (this.contact.title = value),
		})
	}

	private renderPresharedPasswordField(): Children {
		if (!this.isNewContact && !this.contact.presharedPassword) {
			return null
		}

		return m(".wrapping-row", [
			m(".passwords.mt-xl", [
				m(".h4", lang.get("presharedPassword_label")),
				m(TextField, {
					type: this.isPasswordRevealed ? TextFieldType.Text : TextFieldType.Password,
					label: "password_label",
					value: this.contact.presharedPassword ?? "",
					autocompleteAs: Autocomplete.newPassword,
					oninput: (value) => (this.contact.presharedPassword = value),
					injectionsRight: () => this.renderRevealIcon(),
				}),
			]),
			m(".spacer"),
		])
	}

	private createCloseButtonAttrs(): ButtonAttrs {
		return {
			label: "close_alt",
			click: (e, dom) => this.close(),
			type: ButtonType.Secondary,
		}
	}

	private newPhoneNumber(): [ContactPhoneNumber, Id] {
		const phoneNumber = createContactPhoneNumber({
			type: ContactPhoneNumberType.MOBILE,
			customTypeName: "",
			number: "",
		})
		return [phoneNumber, this.newId()]
	}

	private newMailAddress(): [ContactMailAddress, Id] {
		const mailAddress = createContactMailAddress({
			type: ContactAddressType.WORK,
			customTypeName: "",
			address: "",
		})
		return [mailAddress, this.newId()]
	}

	private newAddress(): [ContactAddress, Id] {
		const address = createContactAddress({
			type: ContactAddressType.WORK,
			customTypeName: "",
			address: "",
		})
		return [address, this.newId()]
	}

	private newSocialId(): [ContactSocialId, Id] {
		const socialId = createContactSocialId({
			type: ContactSocialType.TWITTER,
			customTypeName: "",
			socialId: "",
		})
		return [socialId, this.newId()]
	}

	private newId(): Id {
		return timestampToGeneratedId(Date.now())
	}

	private onTypeSelected<K, T extends { type: K; customTypeName: string }>(isCustom: boolean, key: K, aggregate: T): void {
		if (isCustom) {
			setTimeout(() => {
				Dialog.showTextInputDialog("customLabel_label", "customLabel_label", null, aggregate.customTypeName).then((name) => {
					aggregate.customTypeName = name
					aggregate.type = key
				})
			}, DefaultAnimationTime) // wait till the dropdown is hidden
		} else {
			aggregate.type = key
		}
	}

	private renderRevealIcon(): Children {
		return m(ToggleButton, {
			title: "revealPassword_action",
			toggled: this.isPasswordRevealed,
			onToggled: (_, e) => {
				this.isPasswordRevealed = !this.isPasswordRevealed
				e.stopPropagation()
			},
			icon: this.isPasswordRevealed ? Icons.NoEye : Icons.Eye,
			size: ButtonSize.Compact,
		})
	}

	private createDialog(): Dialog {
		const headerBarAttrs: DialogHeaderBarAttrs = {
			left: [this.createCloseButtonAttrs()],
			middle: () => this.contact.firstName + " " + this.contact.lastName,
			right: [
				{
					label: "save_action",
					click: () => this.validateAndSave(),
					type: ButtonType.Primary,
				},
			],
		}
		return Dialog.largeDialog(headerBarAttrs, this)
			.addShortcut({
				key: Keys.ESC,
				exec: () => this.close(),
				help: "close_alt",
			})
			.addShortcut({
				key: Keys.S,
				ctrl: true,
				exec: () => {
					// noinspection JSIgnoredPromiseFromCall
					this.validateAndSave()
				},
				help: "save_action",
			})
			.setCloseHandler(() => this.close())
	}
}

/** Renders TextField with wrapper and padding element to align them all. */
class StandaloneField implements Component<TextFieldAttrs> {
	view({ attrs }: Vnode<TextFieldAttrs>): Children {
		return m(".flex.child-grow", [m(TextField, attrs), m(".icon-button")])
	}
}
