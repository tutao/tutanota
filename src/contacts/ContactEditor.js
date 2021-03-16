// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog} from "../gui/base/Dialog"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {isMailAddress} from "../misc/FormatValidator"
import {formatBirthdayNumeric, formatBirthdayOfContact,} from "./model/ContactUtils"
import type {ContactAddressTypeEnum, ContactSocialTypeEnum} from "../api/common/TutanotaConstants"
import {ContactAddressType, ContactPhoneNumberType, ContactSocialType, GroupType, Keys} from "../api/common/TutanotaConstants"
import type {ContactMailAddress} from "../api/entities/tutanota/ContactMailAddress"
import {createContactMailAddress} from "../api/entities/tutanota/ContactMailAddress"
import type {ContactPhoneNumber} from "../api/entities/tutanota/ContactPhoneNumber"
import {createContactPhoneNumber} from "../api/entities/tutanota/ContactPhoneNumber"
import type {ContactAddress} from "../api/entities/tutanota/ContactAddress"
import {createContactAddress} from "../api/entities/tutanota/ContactAddress"
import type {ContactSocialId} from "../api/entities/tutanota/ContactSocialId"
import {createContactSocialId} from "../api/entities/tutanota/ContactSocialId"
import type {Contact} from "../api/entities/tutanota/Contact"
import {createContact} from "../api/entities/tutanota/Contact"
import {clone, downcast, neverNull, noOp, typedEntries} from "../api/common/utils/Utils"
import {assertMainOrNode} from "../api/common/Env"
import {findAndRemove, lastIndex, lastThrow} from "../api/common/utils/ArrayUtils"
import {windowFacade} from "../misc/WindowFacade"
import {logins} from "../api/main/LoginController"
import {createBirthday} from "../api/entities/tutanota/Birthday"
import {NotFoundError, PayloadTooLargeError} from "../api/common/error/RestError"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonType} from "../gui/base/ButtonN"
import {birthdayToIsoDate} from "../api/common/utils/BirthdayUtils"
import {
	ContactMailAddressTypeToLabel,
	ContactPhoneNumberTypeToLabel,
	ContactSocialTypeToLabel,
	getContactAddressTypeLabel,
	getContactPhoneNumberTypeLabel,
	getContactSocialTypeLabel
} from "./view/ContactGuiUtils"
import {parseBirthday} from "../misc/DateParser"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN, Type} from "../gui/base/TextFieldN"
import {EntityClient} from "../api/common/EntityClient"
import {timestampToGeneratedId} from "../api/common/utils/Encoding"
import type {AggregateEditorAttrs} from "./ContactAggregateEditor"
import {ContactAggregateEditor} from "./ContactAggregateEditor"
import {DefaultAnimationTime} from "../gui/animation/Animations"


assertMainOrNode()

export class ContactEditor {
	contact: Contact
	listId: Id;
	entityClient: EntityClient
	firstName: Stream<string>;
	lastName: Stream<string>;
	dialog: Dialog
	invalidBirthday: boolean
	mailAddresses: Array<[ContactMailAddress, Id]>
	phoneNumbers: Array<[ContactPhoneNumber, Id]>
	addresses: Array<[ContactAddress, Id]>
	socialIds: Array<[ContactSocialId, Id]>
	birthday: Stream<string>

	_newContactIdReceiver: ?(contactId: Id) => mixed
	windowCloseUnsubscribe: () => mixed

	/**
	 * The contact that should be update or the contact list that the new contact should be written to must be provided
	 * @param entityClient
	 * @param contact An existing or new contact. If null a new contact is created.
	 * @param listId The list id of the new contact.
	 * @param newContactIdReceiver. Is called receiving the contact id as soon as the new contact was saved.
	 */
	constructor(entityClient: EntityClient, contact: ?Contact, listId: ?Id, newContactIdReceiver: ?(contactId: Id) => mixed) {
		this.entityClient = entityClient
		this.contact = contact ? clone(contact) : createContact()
		this._newContactIdReceiver = newContactIdReceiver
		if (contact == null && listId == null) {
			throw new Error("must provide contact to edit or listId for the new contact")
		} else {
			this.listId = listId ? listId : neverNull(contact)._id[0]
		}

		this.mailAddresses = this.contact.mailAddresses.map((address) => [address, address._id])
		this.mailAddresses.push(this._newMailAddress())

		this.phoneNumbers = this.contact.phoneNumbers.map((phoneNumber) => [phoneNumber, phoneNumber._id])
		this.phoneNumbers.push(this._newPhoneNumber())

		this.addresses = this.contact.addresses.map((address) => [address, address._id])
		this.addresses.push(this._newAddress())

		this.socialIds = this.contact.socialIds.map((socialId) => [socialId, socialId._id])
		this.socialIds.push(this._newSocialId())

		this.firstName = stream(this.contact.firstName)
		this.lastName = stream(this.contact.lastName)

		this.invalidBirthday = false
		this.birthday = stream(formatBirthdayOfContact(this.contact) || "")

		this.dialog = this._createDialog()

		this.windowCloseUnsubscribe = noOp
	}

	oncreate() {
		this.windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {})
	}

	onremove() {
		this.windowCloseUnsubscribe()
	}

	view(): Children {
		const presharedPasswordAttrs = this._createPresharedPasswordAttrs()
		return m("#contact-editor", [
			m(".wrapping-row", [
				m(TextFieldN, this._createFirstNameAttrs()),
				m(TextFieldN, this._createLastNameAttrs())
			]),
			m(".wrapping-row", [
				m(TextFieldN, this._createTitleAttrs()),
				m(TextFieldN, this._createBirthdayAttrs()),

			]),
			m(".wrapping-row", [
				m(TextFieldN, this._createRoleAttrs()),
				m(TextFieldN, this._createCompanyAttrs()),
				m(TextFieldN, this._createNickNameAttrs()),
				m(TextFieldN, this._createCommentAttrs())
			]),
			m(".wrapping-row", [
				m(".mail.mt-xl", [
					m(".h4", lang.get('email_label')),
					m(".aggregateEditors", [
						this.mailAddresses.map(([address, id], index) => {
							const lastEditor = index === lastIndex(this.mailAddresses)
							return m(ContactAggregateEditor, this._createMailAddressEditor(id, !lastEditor, address))
						}),
					])
				]),
				m(".phone.mt-xl", [
					m(".h4", lang.get('phone_label')),
					m(".aggregateEditors", [
						this.phoneNumbers.map(([phoneNumber, id], index) => {
							const lastEditor = index === lastIndex(this.phoneNumbers)
							return m(ContactAggregateEditor, this._createPhoneEditor(id, !lastEditor, phoneNumber))
						}),
					])
				]),
			]),

			m(".wrapping-row", [
				m(".address.mt-xl", [
					m(".h4", lang.get('address_label')),
					m(".aggregateEditors", [
						this.addresses.map(([address, id], index) => {
							const lastEditor = index === lastIndex(this.addresses)
							return m(ContactAggregateEditor, this._createAddressEditor(id, !lastEditor, address))
						})
					])
				]),
				m(".social.mt-xl", [
					m(".h4", lang.get('social_label')),
					m(".aggregateEditors", [
						this.socialIds.map(([socialId, id], index) => {
							const lastEditor = index === lastIndex(this.socialIds)
							return m(ContactAggregateEditor, this._createSocialEditor(id, !lastEditor, socialId))
						})
					])
				]),
			]),
			presharedPasswordAttrs
				? m(".wrapping-row", [
					m(".passwords.mt-xl", [
						m(".h4", lang.get('presharedPassword_label')),
						m(TextFieldN, presharedPasswordAttrs)
					]),
					m(".spacer")
				])
				: null,
			m(".pb")
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
			Dialog.error("invalidBirthday_msg")
			return
		}

		this.contact.mailAddresses = this.mailAddresses.map((e) => e[0]).filter(e => e.address.trim().length > 0)
		this.contact.phoneNumbers = this.phoneNumbers.map((e) => e[0]).filter(e => e.number.trim().length > 0)
		this.contact.addresses = this.addresses.map((e) => e[0]).filter(e => e.address.trim().length > 0)
		this.contact.socialIds = this.socialIds.map((e) => e[0]).filter(e => e.socialId.trim().length > 0)

		let promise
		if (this.contact._id) {
			promise = this.entityClient.update(this.contact).catch(NotFoundError, noOp)
		} else {
			this.contact._area = "0" // legacy
			this.contact.autoTransmitPassword = "" // legacy
			this.contact._owner = logins.getUserController().user._id
			this.contact._ownerGroup = neverNull(logins.getUserController()
			                                           .user
			                                           .memberships
			                                           .find(m => m.groupType === GroupType.Contact)).group
			promise = this.entityClient.setup(this.listId, this.contact).then(contactId => {
				if (this._newContactIdReceiver) {
					this._newContactIdReceiver(contactId)
				}
			})
		}

		promise.then(() => this._close())
		       .catch(PayloadTooLargeError, () => {
			       Dialog.error("requestTooLarge_msg")
		       })
	}

	_createMailAddressEditor(id: Id, allowCancel: boolean, mailAddress: ContactMailAddress,): AggregateEditorAttrs<*> {
		let helpLabel
		if (mailAddress.address.trim().length > 0 && !isMailAddress(mailAddress.address.trim(), false)) {
			helpLabel = "invalidInputFormat_msg"
		} else {
			helpLabel = "emptyString_msg"
		}

		const typeLabels: Array<[ContactAddressTypeEnum, TranslationKey]> = typedEntries(ContactMailAddressTypeToLabel)
		return {
			value: stream(mailAddress.address),
			fieldType: Type.Text,
			label: getContactAddressTypeLabel(downcast(mailAddress.type), mailAddress.customTypeName),
			helpLabel,
			cancelAction: () => {
				findAndRemove(this.mailAddresses, (t) => t[1] === id)
			},
			onUpdate: (value) => {
				mailAddress.address = value
				if (mailAddress === lastThrow(this.mailAddresses)[0]) this.mailAddresses.push(this._newAddress())
			},
			animateCreate: !mailAddress.address,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this._onTypeSelected(type === ContactAddressType.CUSTOM, type, mailAddress),
		}
	}

	_createPhoneEditor(id: Id, allowCancel: boolean, phoneNumber: ContactPhoneNumber): AggregateEditorAttrs<*> {
		const typeLabels = typedEntries(ContactPhoneNumberTypeToLabel)
		return {
			value: stream(phoneNumber.number),
			fieldType: Type.Text,
			label: getContactPhoneNumberTypeLabel(downcast(phoneNumber.type), phoneNumber.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.phoneNumbers, (t) => t[1] === id)
			},
			onUpdate: (value) => {
				phoneNumber.number = value
				if (phoneNumber === lastThrow(this.phoneNumbers)[0]) this.phoneNumbers.push(this._newPhoneNumber())
			},
			animateCreate: !phoneNumber.number,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this._onTypeSelected(type === ContactPhoneNumberType.CUSTOM, type, phoneNumber),
		}
	}

	_createAddressEditor(id: Id, allowCancel: boolean, address: ContactAddress): AggregateEditorAttrs<*> {
		const typeLabels = typedEntries(ContactMailAddressTypeToLabel)

		return {
			value: stream(address.address),
			fieldType: Type.Area,
			label: getContactAddressTypeLabel(downcast(address.type), address.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.addresses, (t) => t[1] === id)
			},
			onUpdate: (value) => {
				address.address = value
				if (address === lastThrow(this.addresses)[0]) this.addresses.push(this._newAddress())
			},
			animateCreate: !address.address,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this._onTypeSelected(type === ContactAddressType.CUSTOM, type, address),
		}
	}

	_createSocialEditor(id: Id, allowCancel: boolean, socialId: ContactSocialId): AggregateEditorAttrs<*> {
		const typeLabels = typedEntries(ContactSocialTypeToLabel)
		return {
			value: stream(socialId.socialId),
			fieldType: Type.Text,
			label: getContactSocialTypeLabel(downcast<ContactSocialTypeEnum>(socialId.type), socialId.customTypeName),
			helpLabel: "emptyString_msg",
			cancelAction: () => {
				findAndRemove(this.socialIds, (t) => t[1] === id)
			},
			onUpdate: (value) => {
				socialId.socialId = value
				if (socialId === lastThrow(this.socialIds)[0]) this.socialIds.push(this._newSocialId())
			},
			animateCreate: !socialId.socialId,
			allowCancel,
			key: id,
			typeLabels,
			onTypeSelected: (type) => this._onTypeSelected(type === ContactSocialType.CUSTOM, type, socialId)
		}
	}

	_createCommentAttrs(): TextFieldAttrs {
		return {
			label: 'comment_label',
			value: stream(this.contact.comment),
			oninput: value => this.contact.comment = value,
			type: Type.Area
		}
	}

	_createFirstNameAttrs(): TextFieldAttrs {
		return {
			label: "firstName_placeholder",
			value: this.firstName,
			oninput: value => this.contact.firstName = value,
		}
	}

	_createNickNameAttrs(): TextFieldAttrs {
		return {
			label: "nickname_placeholder",
			value: stream(this.contact.nickname || ""),
			oninput: value => this.contact.nickname = value
		}
	}

	_createLastNameAttrs(): TextFieldAttrs {
		return {
			label: "lastName_placeholder",
			value: this.lastName,
			oninput: value => this.contact.lastName = value,
		}
	}

	_createBirthdayAttrs(): TextFieldAttrs {
		let birthdayHelpText = () => {
			let bday = createBirthday()
			bday.day = "22"
			bday.month = "9"
			bday.year = "2000"
			return this.invalidBirthday
				? lang.get("invalidDateFormat_msg", {"{1}": formatBirthdayNumeric(bday)})
				: ""
		}

		return {
			label: 'birthday_alt',
			value: this.birthday,
			helpLabel: birthdayHelpText,
			oninput: value => {
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
			}
		}
	}

	_createCompanyAttrs(): TextFieldAttrs {
		return {
			label: "company_label",
			value: stream(this.contact.company),
			oninput: value => this.contact.company = value
		}
	}

	_createRoleAttrs(): TextFieldAttrs {
		return {
			label: "role_placeholder",
			value: stream(this.contact.role),
			oninput: value => this.contact.role = value
		}
	}

	_createTitleAttrs(): TextFieldAttrs {
		return {
			label: "title_placeholder",
			value: stream(this.contact.title || ""),
			oninput: value => this.contact.title = value
		}
	}

	_createPresharedPasswordAttrs(): TextFieldAttrs | null {
		if (!this.contact.presharedPassword) {
			return null
		}
		return {
			label: 'password_label',
			value: stream(this.contact.presharedPassword || ""),
			oninput: value => this.contact.presharedPassword = value
		}
	}

	_createCloseButtonAttrs(): ButtonAttrs {
		return {
			label: "close_alt",
			click: (e, dom) => this._close(),
			type: ButtonType.Secondary
		}
	}

	_newPhoneNumber(): [ContactPhoneNumber, Id] {
		const phoneNumber = createContactPhoneNumber({
			type: ContactPhoneNumberType.MOBILE,
			customTypeName: "",
			number: ""
		})
		return [phoneNumber, this._newId()]
	}

	_newMailAddress(): [ContactMailAddress, Id] {
		const mailAddress = createContactMailAddress({
			type: ContactAddressType.WORK,
			customTypeName: "",
			address: ""
		})
		return [mailAddress, this._newId()]
	}

	_newAddress(): [ContactAddress, Id] {
		const address = createContactAddress({
			type: ContactAddressType.WORK,
			customTypeName: "",
			address: ""
		})
		return [address, this._newId()]
	}

	_newSocialId(): [ContactSocialId, Id] {
		const socialId = createContactSocialId({
			type: ContactSocialType.TWITTER,
			customTypeName: "",
			socialId: ""
		})
		return [socialId, this._newId()]
	}

	_newId(): Id {
		return timestampToGeneratedId(Date.now())
	}

	_onTypeSelected<K, T: {type: K, customTypeName: string}>(isCustom: boolean, key: K, aggregate: T): void {
		if (isCustom) {
			setTimeout(() => {
				Dialog.showTextInputDialog("customLabel_label",
					"customLabel_label",
					null,
					aggregate.customTypeName,
					null//validator needed?
				).then((name) => {
					aggregate.customTypeName = name
					aggregate.type = key
				})
			}, DefaultAnimationTime)// wait till the dropdown is hidden
		} else {
			aggregate.type = key
		}
	}

	_createDialog(): Dialog {
		const name: Stream<string> = stream.merge([
			this.firstName, this.lastName
		]).map(names => names.join(' '))
		const headerBarAttrs = {
			left: [this._createCloseButtonAttrs()],
			middle: name,
			right: [{label: 'save_action', click: () => this.save(), type: ButtonType.Primary}]
		}

		return Dialog.largeDialog(headerBarAttrs, this)
		             .addShortcut({
			             key: Keys.ESC,
			             exec: () => this._close(),
			             help: "close_alt"
		             })
		             .addShortcut({
			             key: Keys.S,
			             ctrl: true,
			             exec: () => this.save(),
			             help: "save_action"
		             })
		             .setCloseHandler(() => this._close());
	}
}