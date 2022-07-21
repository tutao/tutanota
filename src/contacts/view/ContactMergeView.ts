import m, {ChildArray, Children, Vnode} from "mithril"
import {Dialog} from "../../gui/base/Dialog"
import {windowFacade} from "../../misc/WindowFacade"
import {Icons} from "../../gui/base/icons/Icons"
import {ContactAddressType, ContactMergeAction, getContactSocialType, Keys} from "../../api/common/TutanotaConstants"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {formatBirthdayOfContact} from "../model/ContactUtils"
import {defer, DeferredObject, downcast, Thunk} from "@tutao/tutanota-utils"
import {HtmlEditor, HtmlEditorMode} from "../../gui/editor/HtmlEditor"
import {Button, ButtonType} from "../../gui/base/Button.js"
import type {Contact} from "../../api/entities/tutanota/TypeRefs.js"
import {getContactAddressTypeLabel, getContactPhoneNumberTypeLabel, getContactSocialTypeLabel} from "./ContactGuiUtils"
import {TextField} from "../../gui/base/TextField.js"
import stream from "mithril/stream"
import {TextDisplayArea} from "../../gui/base/TextDisplayArea"
import {delay} from "@tutao/tutanota-utils"
import {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar";

export class ContactMergeView {
	dialog: Dialog
	contact1: Contact
	contact2: Contact
	resolveFunction: DeferredObject<ContactMergeAction>["resolve"] | null = null // must be called after the user action

	windowCloseUnsubscribe: Thunk | null = null

	constructor(contact1: Contact, contact2: Contact) {
		this.contact1 = contact1
		this.contact2 = contact2

		const cancelAction = () => {
			this._close(ContactMergeAction.Cancel)
		}

		const headerBarAttrs = {
			left: [
				{
					label: "cancel_action",
					click: cancelAction,
					type: ButtonType.Secondary,
				},
			],
			right: [
				{
					label: "skip_action",
					click: () => this._close(ContactMergeAction.Skip),
					type: ButtonType.Primary,
				},
			],
			middle: () => lang.get("merge_action"),
		}
		this.dialog = Dialog.largeDialog(headerBarAttrs as DialogHeaderBarAttrs, this)
							.setCloseHandler(cancelAction)
							.addShortcut({
								key: Keys.ESC,
								exec: () => {
									this._close(ContactMergeAction.Cancel)
									return false
								},
								help: "close_alt",
							})
	}

	view(): Children {
		const {
			mailAddresses: mailAddresses1,
			phones: phones1,
			addresses: addresses1,
			socials: socials1
		} = this._createContactFields(this.contact1)

		const {
			mailAddresses: mailAddresses2,
			phones: phones2,
			addresses: addresses2,
			socials: socials2
		} = this._createContactFields(this.contact2)

		//empty.. placeholders are used if one contact has an attribute while the other does not have it, so an empty one is shown for comparison
		let emptyFieldPlaceholder = m(TextField, {
			label: "emptyString_msg",
			value: "",
			disabled: true,
		})
		let emptyHTMLFieldPlaceholder = m(
			new HtmlEditor("emptyString_msg")
				.showBorders()
				.setValue("")
				.setEnabled(false)
				.setMode(HtmlEditorMode.HTML)
				.setHtmlMonospace(false),
		)

		let titleFields = this._createTextFields(this.contact1.title, this.contact2.title, "title_placeholder")

		let firstNameFields = this._createTextFields(this.contact1.firstName, this.contact2.firstName, "firstName_placeholder")

		let lastNameFields = this._createTextFields(this.contact1.lastName, this.contact2.lastName, "lastName_placeholder")

		let nicknameFields = this._createTextFields(this.contact1.nickname, this.contact2.nickname, "nickname_placeholder")

		let companyFields = this._createTextFields(this.contact1.company, this.contact2.company, "company_label")

		let roleFields = this._createTextFields(this.contact1.role, this.contact2.role, "role_placeholder")

		let birthdayFields = this._createTextFields(formatBirthdayOfContact(this.contact1), formatBirthdayOfContact(this.contact2), "birthday_alt")

		let presharedPasswordFields = this._createTextFields(
			this.contact1.presharedPassword && this.contact1.presharedPassword.length > 0 ? "***" : "",
			this.contact2.presharedPassword && this.contact2.presharedPassword.length > 0 ? "***" : "",
			"presharedPassword_label",
		)

		let commentField1: Children = null
		let commentField2: Children = null

		if (this.contact1.comment || this.contact2.comment) {
			commentField1 = m(TextDisplayArea, {
				label: "comment_label",
				value: this.contact1.comment,
			})
			commentField2 = m(TextDisplayArea, {
				label: "comment_label",
				value: this.contact2.comment,
			})
		}

		return m(
			"#contact-editor",
			{
				oncreate: () => (this.windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {
				})),
				onremove: () => this.windowCloseUnsubscribe?.(),
			},
			[
				m(".flex-center.mt", [
					m(".full-width.max-width-s", [
						m(Button, {
							label: "mergeContacts_action",
							click: () => this._close(ContactMergeAction.Merge),
							type: ButtonType.Login,
						}),
					]),
				]),
				m(".non-wrapping-row", [
					m(
						"",
						/*first contact */
						[
							m(".items-center", [
								m(".items-base.flex-space-between", [
									m(".h4.mt-l", lang.get("firstMergeContact_label")),
									this._createDeleteContactButton(ContactMergeAction.DeleteFirst),
								]),
							]),
						],
					),
					m(
						"",
						/*second contact */
						[
							m(".items-center", [
								m(".items-base.flex-space-between", [
									m(".h4.mt-l", lang.get("secondMergeContact_label")),
									this._createDeleteContactButton(ContactMergeAction.DeleteSecond),
								]),
							]),
						],
					),
				]),
				titleFields ? m(".non-wrapping-row", titleFields) : null,
				firstNameFields ? m(".non-wrapping-row", firstNameFields) : null,
				lastNameFields ? m(".non-wrapping-row", lastNameFields) : null,
				nicknameFields ? m(".non-wrapping-row", nicknameFields) : null,
				companyFields ? m(".non-wrapping-row", companyFields) : null,
				birthdayFields ? m(".non-wrapping-row", birthdayFields) : null,
				roleFields ? m(".non-wrapping-row", roleFields) : null,
				mailAddresses1.length > 0 || mailAddresses2.length > 0
					? m(".non-wrapping-row", [
						m(".mail.mt-l", [m("", lang.get("email_label")), mailAddresses1.length > 0 ? mailAddresses1 : emptyFieldPlaceholder]),
						m(".mail.mt-l", [m("", lang.get("email_label")), mailAddresses2.length > 0 ? mailAddresses2 : emptyFieldPlaceholder]),
					])
					: null,
				phones1.length > 0 || phones2.length > 0
					? m(".non-wrapping-row", [
						m(".phone.mt-l", [m("", lang.get("phone_label")), m(".aggregateEditors", [phones1.length > 0 ? phones1 : emptyFieldPlaceholder])]),
						m(".phone.mt-l", [m("", lang.get("phone_label")), m(".aggregateEditors", [phones2.length > 0 ? phones2 : emptyFieldPlaceholder])]),
					])
					: null,
				addresses1.length > 0 || addresses2.length > 0
					? m(".non-wrapping-row", [
						m(".address.mt-l.flex.flex-column", [
							m("", lang.get("address_label")),
							m(".aggregateEditors.flex.flex-column.flex-grow", [addresses1.length > 0 ? addresses1 : emptyHTMLFieldPlaceholder]),
						]),
						m(".address.mt-l", [
							m("", lang.get("address_label")),
							m(".aggregateEditors.flex.flex-column.flex-grow", [addresses2.length > 0 ? addresses2 : emptyHTMLFieldPlaceholder]),
						]),
					])
					: null,
				socials1.length > 0 || socials2.length > 0
					? m(".non-wrapping-row", [
						m(".social.mt-l", [m("", lang.get("social_label")), m(".aggregateEditors", socials1.length > 0 ? socials1 : emptyFieldPlaceholder)]),
						m(".social.mt-l", [m("", lang.get("social_label")), m(".aggregateEditors", socials2.length > 0 ? socials2 : emptyFieldPlaceholder)]),
					])
					: null,
				commentField1 && commentField2
					? m(".non-wrapping-row", [m(".mt-l.flex.flex-column", [commentField1]), m(".mt-l.flex.flex-column", [commentField2])])
					: null,
				presharedPasswordFields ? m(".non-wrapping-row", presharedPasswordFields) : null,
				m(
					"",
					{
						style: {
							height: "5px",
						},
					},
					/*Used as spacer so the last gui-element is not touching the window border*/
				),
			],
		)
	}

	_createContactFields(
		contact: Contact,
	): {
		mailAddresses: ChildArray
		phones: ChildArray
		addresses: ChildArray
		socials: ChildArray
	} {
		const mailAddresses = contact.mailAddresses.map(element => {
			return m(TextField, {
				label: () => getContactAddressTypeLabel(element.type as any, element.customTypeName),
				value: element.address,
				disabled: true,
			})
		})
		const phones = contact.phoneNumbers.map(element => {
			return m(TextField, {
				label: () => getContactPhoneNumberTypeLabel(element.type as any, element.customTypeName),
				value: element.number,
				disabled: true,
			})
		})
		const addresses = contact.addresses.map(element => {
			// Manually implement text area to make it stretch vertically. TextField is unable to do that.
			return m(TextDisplayArea, {
				value: element.address,
				label: () => getContactAddressTypeLabel(downcast<ContactAddressType>(element.type), element.customTypeName),
			})
		})
		const socials = contact.socialIds.map(element => {
			return m(TextField, {
				label: () => getContactSocialTypeLabel(getContactSocialType(element), element.customTypeName),
				value: element.socialId,
				disabled: true,
			})
		})
		return {
			mailAddresses,
			phones,
			addresses,
			socials,
		}
	}

	_createTextFields(value1: string | null, value2: string | null, labelTextId: TranslationKey): Children {
		if (value1 || value2) {
			return [
				m(TextField, {
					label: labelTextId,
					value: value1 || "",
					disabled: true,
				}),
				m(TextField, {
					label: labelTextId,
					value: value2 || "",
					disabled: true,
				}),
			]
		} else {
			return null
		}
	}

	_createDeleteContactButton(action: ContactMergeAction): Children {
		return m(Button, {
			label: "delete_action",
			click: () => {
				Dialog.confirm("deleteContact_msg").then(confirmed => {
					if (confirmed) {
						this._close(action)
					}
				})
			},
			icon: () => Icons.Trash,
		})
	}

	show(): Promise<ContactMergeAction> {
		this.dialog.show()
		let d = defer<ContactMergeAction>()
		this.resolveFunction = d.resolve
		return d.promise
	}

	_close(action: ContactMergeAction): void {
		this.dialog.close()
		delay(200).then(() => {
			this.resolveFunction?.(action)
		})
	}
}