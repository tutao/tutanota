// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/common/Env"
import {lang} from "../misc/LanguageViewModel"
import {erase, load} from "../api/main/Entity"
import {BookingItemFeatureType, InputFieldType} from "../api/common/TutanotaConstants"
import {ActionBar} from "../gui/base/ActionBar"
import * as ContactFormEditor from "./ContactFormEditor"
import type {ContactForm} from "../api/entities/tutanota/ContactForm"
import {createContactForm} from "../api/entities/tutanota/ContactForm"
import {loadGroupInfos} from "./LoadingUtils"
import {Icons} from "../gui/base/icons/Icons"
import {Dialog} from "../gui/base/Dialog"
import {neverNull} from "../api/common/utils/Utils"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {getDefaultContactFormLanguage} from "../contacts/ContactFormUtils"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {DatePicker} from "../gui/date/DatePicker"
import {getStartOfTheWeekOffsetForUser} from "../calendar/date/CalendarUtils"
import type {EntityUpdateData} from "../api/main/EventController"
import {getGroupInfoDisplayName} from "../api/common/utils/GroupUtils";
import {showBuyDialog} from "../subscription/BuyDialog"
import {logins} from "../api/main/LoginController"
import stream from "mithril/stream/stream.js"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {UpdatableSettingsViewer} from "./SettingsView"

assertMainOrNode()

export class ContactFormViewer implements UpdatableSettingsViewer {
	view: Function;
	contactForm: ContactForm;
	_newContactFormIdReceiver: Function

	constructor(contactForm: ContactForm, brandingDomain: string, newContactFormIdReceiver: Function) {
		this.contactForm = contactForm
		this._newContactFormIdReceiver = newContactFormIdReceiver

		const actionBarButtons = [
			{
				label: 'edit_action',
				click: () => ContactFormEditor.show(this.contactForm, false, this._newContactFormIdReceiver),
				icon: () => Icons.Edit
			},
			{
				label: 'copy_action',
				click: () => this._copy(brandingDomain),
				icon: () => Icons.Copy
			},
			{
				label: 'delete_action',
				click: () => this._delete(),
				icon: () => Icons.Trash
			}
		]

		const urlFieldAttrs = {
			label: "url_label",
			value: stream(getContactFormUrl(brandingDomain, contactForm.path)),
			disabled: true
		}

		let mailGroupFieldAttrs = {
			label: "receivingMailbox_label",
			value: stream(lang.get("loading_msg")),
			disabled: true
		}
		load(GroupInfoTypeRef, neverNull(contactForm.targetGroupInfo)).then(groupInfo => {
			mailGroupFieldAttrs = {
				label: "receivingMailbox_label",
				value: stream(getGroupInfoDisplayName(groupInfo)),
				disabled: true
			}
			m.redraw()
		})

		let participantMailGroupsFieldAttrs = null
		loadGroupInfos(contactForm.participantGroupInfos)
			.then(groupInfos => {
				const mailGroupNames = groupInfos.map(groupInfo => getGroupInfoDisplayName(groupInfo))
				if (mailGroupNames.length > 0) {
					participantMailGroupsFieldAttrs = {
						label: "responsiblePersons_label",
						value: stream(mailGroupNames.join("; ")),
						disabled: true
					}
					m.redraw()
				}
			})

		const language = getDefaultContactFormLanguage(this.contactForm.languages)
		const pageTitleFieldAttrs = {
			label: "pageTitle_label",
			value: stream(language.pageTitle),
			disabled: true
		}
		const startOfTheWeekOffset = getStartOfTheWeekOffsetForUser(logins.getUserController().userSettingsGroupRoot)
		let contactFormReportFrom = new DatePicker(startOfTheWeekOffset, "dateFrom_label")
		let contactFormReportTo = new DatePicker(startOfTheWeekOffset, "dateTo_label")
		contactFormReportFrom.setDate(new Date())
		contactFormReportTo.setDate(new Date())

		this.view = () => {
			return [
				m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [
					m(".flex-space-between.pt", [
						m(".h4", lang.get("emailProcessing_label")),
						m(ActionBar, {buttons: actionBarButtons}),
					]),
					m(TextFieldN, mailGroupFieldAttrs),
					participantMailGroupsFieldAttrs ? m(".mt-l", [
						m(TextFieldN, participantMailGroupsFieldAttrs),
					]) : null,
					m(".h4.mt-l", lang.get("display_action")),
					m(TextFieldN, urlFieldAttrs),
					m(TextFieldN, pageTitleFieldAttrs),
				]),
			]
		}
	}

	_copy(brandingDomain: string) {
		let newForm = createContactForm()
		// copy the instances as deep as necessary to make sure that the instances are not used in two different entities and changes affect both entities
		newForm.targetGroupInfo = this.contactForm.targetGroupInfo
		newForm.participantGroupInfos = this.contactForm.participantGroupInfos.slice()
		newForm.path = "" // do not copy the path
		newForm.languages = this.contactForm.languages.map(l => Object.assign({}, l))
		ContactFormEditor.show(newForm, true, this._newContactFormIdReceiver)
	}

	_delete() {
		Dialog.confirm("confirmDeleteContactForm_msg").then(confirmed => {
			if (confirmed) {
				showProgressDialog("pleaseWait_msg", showBuyDialog(BookingItemFeatureType.ContactForm, -1, 0, false)
					.then(accepted => {
						if (accepted) {
							return erase(this.contactForm)
						}
					}))
			}
		})
	}

	entityEventsReceived<T>(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		// the contact form list view creates a new viewer if my contact form is updated
		return Promise.resolve()
	}
}

export function statisticsFieldTypeToString(field: Object): string {
	if (field.type === InputFieldType.TEXT) {
		return lang.get("text_label")
	} else if (field.type === InputFieldType.NUMBER) {
		return lang.get("number_label")
	} else if (field.type === InputFieldType.ENUM) {
		return "[" + field.enumValues.map(s => s.name).join(", ") + "]"
	} else {
		return ""
	}
}

export function getContactFormUrl(domain: string, path: string): string {
	let pathPrefix = ""
	if (location.pathname.indexOf("client/build") !== -1) {
		// local
		pathPrefix = ":9000/client/build"
	}
	return "https://" + domain + pathPrefix + "/contactform/" + path
}
