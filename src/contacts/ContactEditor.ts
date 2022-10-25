import m, {Children, Component, Vnode} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {Dialog} from "../gui/base/Dialog"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {isMailAddress} from "../misc/FormatValidator"
import {formatBirthdayNumeric, formatBirthdayOfContact} from "./model/ContactUtils"
import {ContactAddressType, ContactPhoneNumberType, ContactSocialType, GroupType, Keys} from "../api/common/TutanotaConstants"
import type {Contact, ContactAddress, ContactMailAddress, ContactPhoneNumber, ContactSocialId} from "../api/entities/tutanota/TypeRefs.js"
import {
	createBirthday,
	createContact,
	createContactAddress,
	createContactMailAddress,
	createContactPhoneNumber,
	createContactSocialId
} from "../api/entities/tutanota/TypeRefs.js"
import {clone, downcast, findAndRemove, lastIndex, lastThrow, neverNull, noOp, ofClass, typedEntries} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../api/common/Env"
import {windowFacade} from "../misc/WindowFacade"
import {logins} from "../api/main/LoginController"
import {NotFoundError, PayloadTooLargeError} from "../api/common/error/RestError"
import type {ButtonAttrs} from "../gui/base/Button.js"
import {ButtonType} from "../gui/base/Button.js"
import {birthdayToIsoDate} from "../api/common/utils/BirthdayUtils"
import {
	ContactMailAddressTypeToLabel,
	ContactPhoneNumberTypeToLabel,
	ContactSocialTypeToLabel,
	getContactAddressTypeLabel,
	getContactPhoneNumberTypeLabel,
	getContactSocialTypeLabel,
} from "./view/ContactGuiUtils"
import {parseBirthday} from "../misc/DateParser"
import type {TextFieldAttrs} from "../gui/base/TextField.js"
import {TextField, TextFieldType} from "../gui/base/TextField.js"
import {EntityClient} from "../api/common/EntityClient"
import {timestampToGeneratedId} from "../api/common/utils/EntityUtils"
import type {AggregateEditorAttrs} from "./ContactAggregateEditor"
import {ContactAggregateEditor} from "./ContactAggregateEditor"
import {DefaultAnimationTime} from "../gui/animation/Animations"
import {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar";
import {ElementEntity} from "../api/common/EntityTypes"

assertMainOrNode()

export class ContactEditor {
	contact: Contact
	listId: Id
	entityClient: EntityClient
	firstName: Stream<string>
	lastName: Stream<string>
	dialog: Dialog
	invalidBirthday: boolean
	mailAddresses: Array<[ContactMailAddress, Id]>
	phoneNumbers: Array<[ContactPhoneNumber, Id]>
	addresses: Array<[ContactAddress, Id]>
	socialIds: Array<[ContactSocialId, Id]>
	birthday: Stream<string>
	_newContactIdReceiver: ((contactId: Id) => unknown) | null
	windowCloseUnsubscribe: () => unknown
	_isNewContact: boolean

	/**
	 * The contact that should be update or the contact list that the new contact should be written to must be provided
	 * @param entityClient
	 * @param contact An existing or new contact. If null a new contact is created.
	 * @param listId The list id of the new contact.
	 * @param newContactIdReceiver. Is called receiving the contact id as soon as the new contact was saved.
	 */
	constructor(
		entityClient: EntityClient,
		contact: Contact | null,
		listId?: Id,
		newContactIdReceiver?: ((contactId: Id) => unknown),
	) {
		this.entityClient = entityClient
		this.contact = contact ? clone(contact) : createContact()
		this._isNewContact = contact == null
		this._newContactIdReceiver = newContactIdReceiver ?? null

		if (contact == null && listId == null) {
			throw new Error("must provide contact to edit or listId for the new contact")
		} else {
			this.listId = listId ? listId : neverNull(contact)._id[0]
		}

		const id = (entity: {_id: Id}) => entity._id || this._newId()

		this.mailAddresses = this.contact.mailAddresses.map(address => [address, id(address)])
		this.mailAddresses.push(this._newMailAddress())
		this.phoneNumbers = this.contact.phoneNumbers.map(phoneNumber => [phoneNumber, id(phoneNumber)])
		this.phoneNumbers.push(this._newPhoneNumber())
		this.addresses = this.contact.addresses.map(address => [address, id(address)])
		this.addresses.push(this._newAddress())
		this.socialIds = this.contact.socialIds.map(socialId => [socialId, id(socialId)])
		this.socialIds.push(this._newSocialId())
		this.firstName = stream(this.contact.firstName)
		this.lastName = stream(this.contact.lastName)
		this.invalidBirthday = false
		this.birthday = stream(formatBirthdayOfContact(this.contact) || "")
		this.dialog = this._createDialog()
		this.windowCloseUnsubscribe = noOp
	}

	oncreate() {
		this.windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {
		})
	}

	onremove() {
		this.windowCloseUnsubscribe()
	}

	view(): Children {
		const presharedPasswordAttrs = this._createPresharedPasswordAttrs()

		return m("#contact-editor", [
			m(".wrapping-row", [m(StandaloneField, this._createFirstNameAttrs()), m(StandaloneField, this._createLastNameAttrs())]),
			m(".wrapping-row", [m(StandaloneField, this._createTitleAttrs()), m(StandaloneField, this._createBirthdayAttrs())]),
			m(".wrapping-row", [
				m(StandaloneField, this._createRoleAttrs()),
				m(StandaloneField, this._createCompanyAttrs()),
				m(StandaloneField, this._createNickNameAttrs()),
				m(StandaloneField, this._createCommentAttrs()),
			]),
			m(".wrapping-row", [
				m(".mail.mt-xl", [
					m(".h4", lang.get("email_label")),
					m(".aggregateEditors", [
						this.mailAddresses.map(([address, id], index) => {
							const lastEditor = index === lastIndex(this.mailAddresses)
							return m(ContactAggregateEditor, this._createMailAddressEditor(id, !lastEditor, address))
						}),
					]),
				]),
				m(".phone.mt-xl", [
					m(".h4", lang.get("phone_label")),
					m(".aggregateEditors", [
						this.phoneNumbers.map(([phoneNumber, id], index) => {
							const lastEditor = index === lastIndex(this.phoneNumbers)
							return m(ContactAggregateEditor, this._createPhoneEditor(id, !lastEditor, phoneNumber))
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
							return m(ContactAggregateEditor, this._createAddressEditor(id, !lastEditor, address))
						}),
					]),
				]),
				m(".social.mt-xl", [
					m(".h4", lang.get("social_label")),
					m(".aggregateEditors", [
						this.socialIds.map(([socialId, id], index) => {
							const lastEditor = index === lastIndex(this.socialIds)
							return m(ContactAggregateEditor, this._createSocialEditor(id, !lastEditor, socialId))
						}),
					]),
				]),
			]),
			presharedPasswordAttrs
				? m(".wrapping-row", [
					m(".passwords.mt-xl", [m(".h4", lang.get("presharedPassword_label")), m(TextField, presharedPasswordAttrs)]),
					m(".spacer"),
				])
				: null,
			m(".pb"),
		])
	}

	show() {
		this.dialog.show()
	}

	_close() {
		this.dialog.close()
	}

	save() {
		if (this.invalidBirthday) {
			Dialog.message("invalidBirthday_msg")
			return
		}

		this.contact.mailAddresses = this.mailAddresses.map(e => e[0]).filter(e => e.address.trim().length > 0)
		this.contact.phoneNumbers = this.phoneNumbers.map(e => e[0]).filter(e => e.number.trim().length > 0)
		this.contact.addresses = this.addresses.map(e => e[0]).filter(e => e.address.trim().length > 0)
		this.contact.socialIds = this.socialIds.map(e => e[0]).filter(e => e.socialId.trim().length > 0)
		let promise

		if (this.contact._id) {
			promise = this.entityClient.update(this.contact).catch(ofClass(NotFoundError, noOp))
		} else {
			this.contact._area = "0" // legacy

			this.contact.autoTransmitPassword = "" // legacy

			this.contact._owner = logins.getUserController().user._id
			this.contact._ownerGroup = neverNull(logins.getUserController().user.memberships.find(m => m.groupType === GroupType.Contact)).group
			promise = this.entityClient.setup(this.listId, this.contact).then(contactId => {
				if (this._newContactIdReceiver) {
					this._newContactIdReceiver(contactId)
				}
			})
		}

		promise
			.then(() => this._close())
			.catch(
				ofClass(PayloadTooLargeError, () => {
					Dialog.message("requestTooLarge_msg")
				}),
			)
	}

	_createMailAddressEditor(id: Id, allowCancel: boolean, mailAddress: ContactMailAddress): AggregateEditorAttrs<any> {
		let helpLabel: TranslationKey

		if (mailAddress.address.trim().length > 0 && !isMailAddress(mailAddress.address.trim(), false)) {
			helpLabel = "invalidInputFormat_msg"
		} else {
			helpLabel = "emptyString_msg"
		}

		const typeLabels: Array<[ContactAddressType, TranslationKey]> = typedEntries(ContactMailAddressTypeToLabel)
		return {
			value: mailAddress.address,
			fieldType: TextFieldType.Text,
			label: getContactAddressTypeLabel(downcast(mailAddress.type), mailAddress.customTypeName),
			helpLabel,
			cancelAction: () => {
				findAndRemove(this.mailAddresses, t => t[1] === id)
			},
			onUpdate: value => {
				mailAddress.address = value
				if (mailAddress === lastThrow(this.mailAddresses)[0]) this.mailAddresses.push(this._newAddress())
			},
			animateCreate: !mailAddress.address,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: type => this._onTypeSelected(type === ContactAddressType.CUSTOM, type, mailAddress),
		}
	}

	_createPhoneEditor(id: Id, allowCancel: boolean, phoneNumber: ContactPhoneNumber): AggregateEditorAttrs<any> {
		const typeLabels = typedEntries(ContactPhoneNumberTypeToLabel)
		return {
			value: phoneNumber.number,
			fieldType: TextFieldType.Text,
			label: getContactPhoneNumberTypeLabel(downcast(phoneNumber.type), phoneNumber.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.phoneNumbers, t => t[1] === id)
			},
			onUpdate: value => {
				phoneNumber.number = value
				if (phoneNumber === lastThrow(this.phoneNumbers)[0]) this.phoneNumbers.push(this._newPhoneNumber())
			},
			animateCreate: !phoneNumber.number,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: type => this._onTypeSelected(type === ContactPhoneNumberType.CUSTOM, type, phoneNumber),
		}
	}

	_createAddressEditor(id: Id, allowCancel: boolean, address: ContactAddress): AggregateEditorAttrs<any> {
		const typeLabels = typedEntries(ContactMailAddressTypeToLabel)
		return {
			value: address.address,
			fieldType: TextFieldType.Area,
			label: getContactAddressTypeLabel(downcast(address.type), address.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.addresses, t => t[1] === id)
			},
			onUpdate: value => {
				address.address = value
				if (address === lastThrow(this.addresses)[0]) this.addresses.push(this._newAddress())
			},
			animateCreate: !address.address,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: type => this._onTypeSelected(type === ContactAddressType.CUSTOM, type, address),
		}
	}

	_createSocialEditor(id: Id, allowCancel: boolean, socialId: ContactSocialId): AggregateEditorAttrs<any> {
		const typeLabels = typedEntries(ContactSocialTypeToLabel)
		return {
			value: socialId.socialId,
			fieldType: TextFieldType.Text,
			label: getContactSocialTypeLabel(downcast<ContactSocialType>(socialId.type), socialId.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.socialIds, t => t[1] === id)
			},
			onUpdate: value => {
				socialId.socialId = value
				if (socialId === lastThrow(this.socialIds)[0]) this.socialIds.push(this._newSocialId())
			},
			animateCreate: !socialId.socialId,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: type => this._onTypeSelected(type === ContactSocialType.CUSTOM, type, socialId),
		}
	}

	_createCommentAttrs(): TextFieldAttrs {
		return {
			label: "comment_label",
			value: this.contact.comment,
			oninput: value => (this.contact.comment = value),
			type: TextFieldType.Area,
		}
	}

	_createFirstNameAttrs(): TextFieldAttrs {
		return {
			label: "firstName_placeholder",
			value: this.firstName(),
			oninput: value => {
				this.firstName(value)
				this.contact.firstName = value
			},
		}
	}

	_createNickNameAttrs(): TextFieldAttrs {
		return {
			label: "nickname_placeholder",
			value: this.contact.nickname ?? "",
			oninput: (value) => this.contact.nickname = value,
		}
	}

	_createLastNameAttrs(): TextFieldAttrs {
		return {
			label: "lastName_placeholder",
			value: this.lastName(),
			oninput: (value) => {
				this.lastName(value)
				this.contact.lastName = value
			},
		}
	}

	_createBirthdayAttrs(): TextFieldAttrs {
		let birthdayHelpText = () => {
			let bday = createBirthday()
			bday.day = "22"
			bday.month = "9"
			bday.year = "2000"
			return this.invalidBirthday
				? lang.get("invalidDateFormat_msg", {
					"{1}": formatBirthdayNumeric(bday),
				})
				: ""
		}

		return {
			label: "birthday_alt",
			value: this.birthday(),
			helpLabel: birthdayHelpText,
			oninput: (value) => {
				this.birthday(value)
				if (value.trim().length === 0) {
					this.contact.birthdayIso = null
					this.invalidBirthday = false
				} else {
					let birthday = parseBirthday(value)

					if (birthday) {
						try {
							this.contact.birthdayIso = birthdayToIsoDate(birthday)
							this.invalidBirthday = false
						} catch (e) {
							this.invalidBirthday = true
						}
					} else {
						this.invalidBirthday = true
					}
				}
			},
		}
	}

	_createCompanyAttrs(): TextFieldAttrs {
		return {
			label: "company_label",
			value: this.contact.company,
			oninput: (value) => this.contact.company = value,
		}
	}

	_createRoleAttrs(): TextFieldAttrs {
		return {
			label: "role_placeholder",
			value: this.contact.role,
			oninput: (value) => this.contact.role = value,
		}
	}

	_createTitleAttrs(): TextFieldAttrs {
		return {
			label: "title_placeholder",
			value: this.contact.title || "",
			oninput: (value) => this.contact.title = value,
		}
	}

	_createPresharedPasswordAttrs(): TextFieldAttrs | null {
		if (!this._isNewContact && !this.contact.presharedPassword) {
			return null
		}

		return {
			label: "password_label",
			value: this.contact.presharedPassword ?? "",
			oninput: (value) => this.contact.presharedPassword = value,
		}
	}

	_createCloseButtonAttrs(): ButtonAttrs {
		return {
			label: "close_alt",
			click: (e, dom) => this._close(),
			type: ButtonType.Secondary,
		}
	}

	_newPhoneNumber(): [ContactPhoneNumber, Id] {
		const phoneNumber = createContactPhoneNumber({
			type: ContactPhoneNumberType.MOBILE,
			customTypeName: "",
			number: "",
		})
		return [phoneNumber, this._newId()]
	}

	_newMailAddress(): [ContactMailAddress, Id] {
		const mailAddress = createContactMailAddress({
			type: ContactAddressType.WORK,
			customTypeName: "",
			address: "",
		})
		return [mailAddress, this._newId()]
	}

	_newAddress(): [ContactAddress, Id] {
		const address = createContactAddress({
			type: ContactAddressType.WORK,
			customTypeName: "",
			address: "",
		})
		return [address, this._newId()]
	}

	_newSocialId(): [ContactSocialId, Id] {
		const socialId = createContactSocialId({
			type: ContactSocialType.TWITTER,
			customTypeName: "",
			socialId: "",
		})
		return [socialId, this._newId()]
	}

	_newId(): Id {
		return timestampToGeneratedId(Date.now())
	}

	_onTypeSelected<K,
		T extends {
			type: K
			customTypeName: string
		}>(isCustom: boolean, key: K, aggregate: T): void {
		if (isCustom) {
			setTimeout(() => {
				Dialog.showTextInputDialog(
					"customLabel_label",
					"customLabel_label",
					null,
					aggregate.customTypeName,
				).then(name => {
					aggregate.customTypeName = name
					aggregate.type = key
				})
			}, DefaultAnimationTime) // wait till the dropdown is hidden
		} else {
			aggregate.type = key
		}
	}

	_createDialog(): Dialog {
		const name: Stream<string> = stream.merge([this.firstName, this.lastName]).map(names => names.join(" "))
		const headerBarAttrs: DialogHeaderBarAttrs = {
			left: [this._createCloseButtonAttrs()],
			middle: name,
			right: [
				{
					label: "save_action",
					click: () => this.save(),
					type: ButtonType.Primary,
				},
			],
		}
		return Dialog.largeDialog(headerBarAttrs, this)
					 .addShortcut({
						 key: Keys.ESC,
						 exec: () => this._close(),
						 help: "close_alt",
					 })
					 .addShortcut({
						 key: Keys.S,
						 ctrl: true,
						 exec: () => this.save(),
						 help: "save_action",
					 })
					 .setCloseHandler(() => this._close())
	}
}

/** Renders TextField with wrapper and padding element to align them all. */
class StandaloneField implements Component<TextFieldAttrs> {
	view({attrs}: Vnode<TextFieldAttrs>): Children {
		return m(".flex.child-grow", [m(TextField, attrs), m(".icon-button")])
	}
}