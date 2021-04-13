// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/common/Env"
import {lang} from "../misc/LanguageViewModel"
import {erase, load, loadAll} from "../api/main/Entity"
import {BookingItemFeatureType, InputFieldType} from "../api/common/TutanotaConstants"
import {ActionBar} from "../gui/base/ActionBar"
import {Button} from "../gui/base/Button"
import * as ContactFormEditor from "./ContactFormEditor"
import type {ContactForm} from "../api/entities/tutanota/ContactForm"
import {createContactForm} from "../api/entities/tutanota/ContactForm"
import {loadGroupInfos} from "./LoadingUtils"
import {Icons} from "../gui/base/icons/Icons"
import {Dialog} from "../gui/base/Dialog"
import {neverNull} from "../api/common/utils/Utils"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {getDefaultContactFormLanguage} from "../contacts/ContactFormUtils"
import {showProgressDialog} from "../gui/ProgressDialog"
import {DatePicker} from "../gui/date/DatePicker"
import {StatisticLogEntryTypeRef} from "../api/entities/tutanota/StatisticLogEntry"
import {stringToUtf8Uint8Array, timestampToGeneratedId} from "../api/common/utils/Encoding"
import {createFile} from "../api/entities/tutanota/File"
import {convertToDataFile} from "../api/common/DataFile"
import {fileController} from "../file/FileController"
import {DAY_IN_MILLIS, formatSortableDate} from "../api/common/utils/DateUtils"
import {getStartOfTheWeekOffsetForUser} from "../calendar/CalendarUtils"
import type {EntityUpdateData} from "../api/main/EventController"
import {getGroupInfoDisplayName} from "../api/common/utils/GroupUtils";
import {showBuyDialog} from "../subscription/BuyDialog"
import stream from "mithril/stream/stream.js"
import {TextFieldN} from "../gui/base/TextFieldN"

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
			.map(groupInfo => getGroupInfoDisplayName(groupInfo))
			.then(mailGroupNames => {
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
			disables: true
		}

		const startOfTheWeekOffset = getStartOfTheWeekOffsetForUser()
		let contactFormReportFrom = new DatePicker(startOfTheWeekOffset, "dateFrom_label")
		let contactFormReportTo = new DatePicker(startOfTheWeekOffset, "dateTo_label")
		contactFormReportFrom.setDate(new Date())
		contactFormReportTo.setDate(new Date())
		let contactFormReportButton = new Button("export_action", () => this._contactFormReport(contactFormReportFrom.date(), contactFormReportTo.date()), () => Icons.Export)

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
					m(".mt-l", [
						m(".h4", lang.get("contactFormReport_label")),
						m(".small", lang.get("contactFormReportInfo_msg")),
						m(".flex.items-center.mb-s", [
							m(".flex-column.pr-l", m(contactFormReportFrom)),
							m(".flex-column.pr-l", m(contactFormReportTo)),
							m(contactFormReportButton)
						]),
					])
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

	_contactFormReport(from: ?Date, to: ?Date) {
		if ((from == null || to == null) || from.getTime() > to.getTime()) {
			Dialog.error("dateInvalidRange_msg")
		} else {
			showProgressDialog("loading_msg", loadAll(StatisticLogEntryTypeRef,
				neverNull(this.contactForm.statisticsLog).items, timestampToGeneratedId(neverNull(from).getTime()),
				timestampToGeneratedId(neverNull(to).getTime() + DAY_IN_MILLIS))
				.then(logEntries => {
					let columns = Array.from(new Set(logEntries.map(e => e.values.map(v => v.name))
					                                           .reduce((a, b) => a.concat(b), [])))
					let titleRow = `contact form,path,date,${columns.map(columnName => `"${columnName}"`).join(",")}`
					let rows = logEntries.map(entry => {
						let row = [
							`"${this._getContactFormTitle(this.contactForm)}"`, this.contactForm.path,
							formatSortableDate(entry.date)
						]
						row.length = 3 + columns.length
						for (let v of entry.values) {
							row[3 + columns.indexOf(v.name)] = `"${v.value}"`
						}
						return row.join(",")
					})
					let csv = [titleRow].concat(rows).join("\n")

					let data = stringToUtf8Uint8Array(csv)
					let tmpFile = createFile()
					tmpFile.name = "report.csv"
					tmpFile.mimeType = "text/csv"
					tmpFile.size = String(data.byteLength)
					return fileController.open(convertToDataFile(tmpFile, data))
				}))
		}
	}

	_getContactFormTitle(contactForm: ContactForm): string {
		let pageTitle = ""
		let language = contactForm.languages.find(l => l.code === lang.code)
		if (language) {
			pageTitle = language.pageTitle
		} else if (contactForm.languages.length > 0) {
			pageTitle = contactForm.languages[0].pageTitle
		}
		return pageTitle
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
