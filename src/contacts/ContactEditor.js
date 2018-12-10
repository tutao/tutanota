// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog} from "../gui/base/Dialog"
import {Button, ButtonType, createDropDownButton} from "../gui/base/Button"
import {TextField, Type} from "../gui/base/TextField"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {lang} from "../misc/LanguageViewModel"
import {isMailAddress, parseBirthday} from "../misc/Formatter"
import {
	ContactMailAddressTypeToLabel,
	ContactPhoneNumberTypeToLabel,
	ContactSocialTypeToLabel,
	formatBirthdayNumeric,
	getContactAddressTypeLabel,
	getContactPhoneNumberTypeLabel,
	getContactSocialTypeLabel,
	migrateToNewBirthday
} from "./ContactUtils"
import {ContactAddressType, ContactPhoneNumberType, ContactSocialType, GroupType} from "../api/common/TutanotaConstants"
import {animations, DefaultAnimationTime, height, opacity} from "../gui/animation/Animations"
import {setup, update} from "../api/main/Entity"
import {ContactMailAddressTypeRef, createContactMailAddress} from "../api/entities/tutanota/ContactMailAddress"
import {ContactPhoneNumberTypeRef, createContactPhoneNumber} from "../api/entities/tutanota/ContactPhoneNumber"
import {ContactAddressTypeRef, createContactAddress} from "../api/entities/tutanota/ContactAddress"
import {ContactSocialIdTypeRef, createContactSocialId} from "../api/entities/tutanota/ContactSocialId"
import {createContact} from "../api/entities/tutanota/Contact"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {clone, neverNull} from "../api/common/utils/Utils"
import {assertMainOrNode} from "../api/Env"
import {remove} from "../api/common/utils/ArrayUtils"
import {windowFacade} from "../misc/WindowFacade"
import {Keys} from "../misc/KeyManager"
import {logins} from "../api/main/LoginController"
import {Icons} from "../gui/base/icons/Icons"
import {createBirthday} from "../api/entities/tutanota/Birthday"


assertMainOrNode()

export class ContactEditor {
	contact: Contact;
	listId: Id;
	dialog: Dialog;
	birthday: TextField;
	invalidBirthday: boolean;
	mailAddressEditors: ContactAggregateEditor[];
	phoneEditors: ContactAggregateEditor[];
	addressEditors: ContactAggregateEditor[];
	socialEditors: ContactAggregateEditor[];

	view: Function;

	_newContactIdReceiver: ?Function

	/**
	 * The contact that should be update or the contact list that the new contact should be written to must be provided
	 * @param c An existing or new contact. If null a new contact is created.
	 * @param listId The list id of the new contact.
	 * @param newContactIdReceiver. Is called receiving the contact id as soon as the new contact was saved.
	 */
	constructor(c: ?Contact, listId: ?Id, newContactIdReceiver: ?Function) {
		this.contact = c ? clone(c) : createContact()
		migrateToNewBirthday(this.contact)

		this._newContactIdReceiver = newContactIdReceiver
		if (c == null && listId == null) {
			throw new Error("must provide contact to edit or listId for the new contact")
		} else {
			this.listId = listId ? listId : neverNull(c)._id[0]
		}
		let firstName = new TextField("firstName_placeholder")
			.setValue(this.contact.firstName)
			.onUpdate(value => this.contact.firstName = value)
		let nickname = new TextField("nickname_placeholder")
			.setValue(this.contact.nickname)
			.onUpdate(value => this.contact.nickname = value)
		let lastName = new TextField("lastName_placeholder")
			.setValue(this.contact.lastName)
			.onUpdate(value => this.contact.lastName = value)
		let name = stream.merge([firstName.value, lastName.value]).map(names => names.join(' '))

		this.invalidBirthday = false
		let birthdayHelpText = () => {
			let bday = createBirthday()
			bday.day = "22"
			bday.month = "9"
			bday.year = "2000"
			return this.invalidBirthday
				? lang.get("invalidDateFormat_msg", {"{1}": formatBirthdayNumeric(bday)})
				: ""
		}
		this.birthday = new TextField('birthday_alt', birthdayHelpText)
			.setValue(this.contact.birthday ? formatBirthdayNumeric(this.contact.birthday) : "")
			.onUpdate(value => {
				if (value.trim().length === 0) {
					this.contact.birthday = null
					this.invalidBirthday = false
				} else {
					let birthday = parseBirthday(value)
					if (birthday) {
						this.contact.birthday = birthday
						this.invalidBirthday = false
					} else {
						this.invalidBirthday = true
					}
				}
			})
		let comment = new TextField('comment_label')
			.setType(Type.Area)
			.setValue(this.contact.comment)
			.onUpdate(value => this.contact.comment = value)

		let company = new TextField("company_label")
			.setValue(this.contact.company)
			.onUpdate(value => this.contact.company = value)
		let role = new TextField("role_placeholder")
			.setValue(this.contact.role)
			.onUpdate(value => this.contact.role = value)
		let title = new TextField("title_placeholder")
			.setValue(this.contact.title)
			.onUpdate(value => this.contact.title = value)

		this.mailAddressEditors = this.contact.mailAddresses.map(ma => new ContactAggregateEditor(ma, e => remove(this.mailAddressEditors, e)))
		this.createNewMailAddressEditor()

		this.phoneEditors = this.contact.phoneNumbers.map(p => new ContactAggregateEditor(p, e => remove(this.phoneEditors, e)))
		this.createNewPhoneEditor()

		this.addressEditors = this.contact.addresses.map(p => new ContactAggregateEditor(p, e => remove(this.addressEditors, e)))
		this.createNewAddressEditor()

		this.socialEditors = this.contact.socialIds.map(p => new ContactAggregateEditor(p, e => remove(this.socialEditors, e)))
		this.createNewSocialEditor()

		let presharedPassword = this.contact.presharedPassword || !c ? new TextField('password_label')
			.setValue((this.contact.presharedPassword: any))
			.onUpdate(value => this.contact.presharedPassword = value) : null

		let headerBar = new DialogHeaderBar()
			.addLeft(new Button('cancel_action', () => this._close()).setType(ButtonType.Secondary))
			.setMiddle(name)
			.addRight(new Button('save_action', () => this.save()).setType(ButtonType.Primary))
		this.view = () => m("#contact-editor", [
			m(".wrapping-row", [
				m(firstName),
				m(lastName)
			]),
			m(".wrapping-row", [
				m(title),
				m(this.birthday),

			]),
			m(".wrapping-row", [
				m(role),
				m(company),
				m(nickname),
				m(comment)
			]),
			m(".wrapping-row", [
				m(".mail.mt-xl", [
					m(".h4", lang.get('email_label')),
					m(".aggregateEditors", [
						this.mailAddressEditors.map(editor => m(editor, {key: editor.id})),
					])
				]),
				m(".phone.mt-xl", [
					m(".h4", lang.get('phone_label')),
					m(".aggregateEditors", [
						this.phoneEditors.map(editor => m(editor, {key: editor.id})),
					])
				]),
			]),

			m(".wrapping-row", [
				m(".address.mt-xl", [
					m(".h4", lang.get('address_label')),
					m(".aggregateEditors", [
						this.addressEditors.map(editor => m(editor, {key: editor.id})),
					])
				]),
				m(".social.mt-xl", [
					m(".h4", lang.get('social_label')),
					m(".aggregateEditors", [
						this.socialEditors.map(editor => m(editor, {key: editor.id})),
					])
				]),
			]),

			presharedPassword ? m(".wrapping-row", [
				m(".passwords.mt-xl", [
					m(".h4", lang.get('presharedPassword_label')),
					m(presharedPassword)
				]),
				m(".spacer")
			]) : null,
			m(".pb")
		])

		this.dialog = Dialog.largeDialog(headerBar, this)
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
			.setCloseHandler(() => this._close())
	}

	show() {
		this.dialog.show()
		windowFacade.checkWindowClosing(true)
	}

	_close() {
		windowFacade.checkWindowClosing(false)
		this.dialog.close()
	}

	save() {
		if (this.invalidBirthday) {
			Dialog.error("invalidBirthday_msg")
			return
		}
		this.contact.mailAddresses = this.mailAddressEditors.filter(e => e.isInitialized)
			.map(e => ((e.aggregate: any): ContactMailAddress))
		this.contact.phoneNumbers = this.phoneEditors.filter(e => e.isInitialized)
			.map(e => ((e.aggregate: any): ContactPhoneNumber))
		this.contact.addresses = this.addressEditors.filter(e => e.isInitialized)
			.map(e => ((e.aggregate: any): ContactAddress))
		this.contact.socialIds = this.socialEditors.filter(e => e.isInitialized)
			.map(e => ((e.aggregate: any): ContactSocialId))

		let promise
		if (this.contact._id) {
			promise = update(this.contact)  // FIXME error handling
		} else {
			this.contact._area = "0" // legacy
			this.contact.autoTransmitPassword = "" // legacy
			this.contact._owner = logins.getUserController().user._id
			this.contact._ownerGroup = neverNull(logins.getUserController()
				.user
				.memberships
				.find(m => m.groupType === GroupType.Contact)).group
			promise = setup(this.listId, this.contact).then(contactId => {
				if (this._newContactIdReceiver) {
					this._newContactIdReceiver(contactId)
				}
			})
		}

		promise.then(() => this._close())
	}

	createNewMailAddressEditor() {
		let a = createContactMailAddress()
		a.type = ContactAddressType.WORK
		a.customTypeName = ""
		a.address = ""
		let editor = new ContactAggregateEditor(a, e => remove(this.mailAddressEditors, e), true, false)
		let value = editor.textfield.value.map(address => {
			if (address.trim().length > 0) {
				editor.isInitialized = true
				editor.animateCreate = false
				this.createNewMailAddressEditor()
				value.end(true)
			}
		})
		this.mailAddressEditors.push(editor)
	}

	createNewPhoneEditor() {
		let a = createContactPhoneNumber()
		a.type = ContactPhoneNumberType.MOBILE
		a.customTypeName = ""
		a.number = ""
		let editor = new ContactAggregateEditor(a, e => remove(this.phoneEditors, e), true, false)
		let value = editor.textfield.value.map(address => {
			if (address.trim().length > 0) {
				editor.isInitialized = true
				editor.animateCreate = false
				this.createNewPhoneEditor()
				value.end(true)
			}
		})
		this.phoneEditors.push(editor)
	}

	createNewAddressEditor() {
		let a = createContactAddress()
		a.type = ContactAddressType.WORK
		a.customTypeName = ""
		a.address = ""
		let editor = new ContactAggregateEditor(a, e => remove(this.addressEditors, e), true, false)
		let value = editor.textfield.value.map(address => {
			if (address.trim().length > 0) {
				editor.isInitialized = true
				editor.animateCreate = false
				this.createNewAddressEditor()
				value.end(true)
			}
		})
		this.addressEditors.push(editor)
	}

	createNewSocialEditor() {
		let a = createContactSocialId()
		a.type = ContactSocialType.TWITTER
		a.customTypeName = ""
		a.socialId = ""
		let editor = new ContactAggregateEditor(a, e => remove(this.socialEditors, e), true, false)
		let value = editor.textfield.value.map(address => {
			if (address.trim().length > 0) {
				editor.isInitialized = true
				editor.animateCreate = false
				this.createNewSocialEditor()
				value.end(true)
			}
		})
		this.socialEditors.push(editor)
	}


}

class ContactAggregateEditor {
	aggregate: ContactMailAddress | ContactPhoneNumber | ContactAddress | ContactSocialId;
	textfield: TextField;
	isInitialized: boolean;
	animateCreate: boolean;
	oncreate: Function;
	onbeforeremove: Function;
	id: Id;
	view: Function;

	constructor(aggregate: ContactMailAddress | ContactPhoneNumber | ContactAddress | ContactSocialId,
				cancelAction: handler<ContactAggregateEditor>, animateCreate: boolean = false,
				allowCancel: boolean = true) {
		this.aggregate = aggregate
		this.isInitialized = allowCancel
		this.animateCreate = animateCreate
		this.id = aggregate._id

		let value = ""
		let onUpdate = () => {
		}
		let label = ""
		let isCustom = (type) => false
		let TypeToLabelMap = {}
		if (isSameTypeRef(aggregate._type, ContactMailAddressTypeRef)
			|| isSameTypeRef(aggregate._type, ContactAddressTypeRef)) {
			value = (aggregate: any).address
			onUpdate = value => (aggregate: any).address = value
			label = () => getContactAddressTypeLabel((this.aggregate.type: any), this.aggregate.customTypeName)
			isCustom = type => type === ContactAddressType.CUSTOM
			TypeToLabelMap = ContactMailAddressTypeToLabel
		} else if (isSameTypeRef(aggregate._type, ContactPhoneNumberTypeRef)) {
			value = (aggregate: any).number
			onUpdate = value => (aggregate: any).number = value
			label = () => getContactPhoneNumberTypeLabel((this.aggregate.type: any), this.aggregate.customTypeName)
			isCustom = type => type === ContactPhoneNumberType.CUSTOM
			TypeToLabelMap = ContactPhoneNumberTypeToLabel
		} else if (isSameTypeRef(aggregate._type, ContactSocialIdTypeRef)) {
			value = (aggregate: any).socialId
			onUpdate = value => (aggregate: any).socialId = value
			label = () => getContactSocialTypeLabel((this.aggregate.type: any), this.aggregate.customTypeName)
			isCustom = type => type === ContactSocialType.CUSTOM
			TypeToLabelMap = ContactSocialTypeToLabel
		}

		this.textfield = new TextField(label, () => {
			if (isSameTypeRef(aggregate._type, ContactMailAddressTypeRef) && this.textfield.value().trim().length > 0
				&& !isMailAddress(this.textfield.value().trim(), false)) {
				return lang.get("invalidInputFormat_msg")
			}
			return lang.get("emptyString_msg")
		})
			.setValue(value)
			.onUpdate(onUpdate)
		if (isSameTypeRef(aggregate._type, ContactAddressTypeRef)) {
			this.textfield.setType(Type.Area)
		}
		let typeButton = createDropDownButton("more_label",
			() => Icons.More,
			() => Object.keys(TypeToLabelMap)
				.map(key => {
					return new Button((TypeToLabelMap: any)[key], e => {
						if (isCustom(key)) {
							let tagDialogActionBar = new DialogHeaderBar()
							/* Unused Variable*/
							let tagName = new TextField("customLabel_label")
								.setValue(this.aggregate.customTypeName)

							setTimeout(() => {
								Dialog.showTextInputDialog("customLabel_label",
									"customLabel_label",
									null,
									this.aggregate.customTypeName,
									null//validator needed?
								).then((name) => {
									this.aggregate.customTypeName = name
									this.aggregate.type = key
								})
							}, DefaultAnimationTime)// wait till the dropdown is hidden
						} else {
							this.aggregate.type = key
						}
					}).setType(ButtonType.Dropdown)
				}))


		let cancelButton = new Button('cancel_action', () => cancelAction(this), () => Icons.Cancel)

		this.textfield._injectionsRight = () => {
			return [
				m(typeButton), this.isInitialized ? m(cancelButton, {
					oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false))
				}) : null
			]
		}

		this.oncreate = vnode => {
			if (this.animateCreate) this.animate(vnode.dom, true)
		}
		this.onbeforeremove = vnode => {
			return this.animate(vnode.dom, false)
		}
		this.view = () => m(".wrapper.child-grow", m(this.textfield))
	}

	animate(domElement: HTMLElement, fadein: boolean) {
		let childHeight = domElement.offsetHeight
		return Promise.all([
			animations.add(domElement, fadein ? opacity(0, 1, true) : opacity(1, 0, true)),
			animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0))
				.then(() => {
					domElement.style.height = ''
				})
		])
	}
}
