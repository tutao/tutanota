// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {TextField} from "../gui/base/TextField"
import {Table, ColumnWidth} from "../gui/base/Table"
import {erase, load} from "../api/main/Entity"
import {InputFieldType} from "../api/common/TutanotaConstants"
import {ActionBar} from "../gui/base/ActionBar"
import {Button} from "../gui/base/Button"
import * as ContactFormEditor from "./ContactFormEditor"
import {createContactForm} from "../api/entities/tutanota/ContactForm"
import {loadGroupInfos} from "./LoadingUtils"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {Icons} from "../gui/base/icons/Icons"
import TableLine from "../gui/base/TableLine"
import {Dialog} from "../gui/base/Dialog"
import {getGroupInfoDisplayName, neverNull} from "../api/common/utils/Utils"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"

assertMainOrNode()

export class ContactFormViewer {
	view: Function;
	contactForm: ContactForm;
	_newContactFormIdReceiver: Function

	constructor(contactForm: ContactForm, brandingDomain: string, newContactFormIdReceiver: Function) {
		this.contactForm = contactForm
		this._newContactFormIdReceiver = newContactFormIdReceiver

		let actions = new ActionBar()
			.add(new Button('edit_action', () => ContactFormEditor.show(this.contactForm, false, brandingDomain, this._newContactFormIdReceiver), () => BootIcons.Edit))
			.add(new Button('copy_action', () => this._copy(brandingDomain), () => Icons.Copy))
			.add(new Button('delete_action', () => this._delete(), () => Icons.Trash))

		let urlField = new TextField("url_label").setValue(getContactFormUrl(brandingDomain, contactForm.path)).setDisabled()
		let mailGroupField = new TextField("receivingMailbox_label").setValue(lang.get("loading_msg")).setDisabled()
		load(GroupInfoTypeRef, neverNull(contactForm.targetGroupInfo)).then(groupInfo => {
			mailGroupField.setValue(getGroupInfoDisplayName(groupInfo))
			m.redraw()
		})
		let participantMailGroupsField = new TextField("participants_label").setValue(lang.get("loading_msg")).setDisabled()
		let mailGroupNames = loadGroupInfos(contactForm.participantGroupInfos).map(groupInfo => getGroupInfoDisplayName(groupInfo)).then(mailGroupNames => {
			if (mailGroupNames.length == 0) {
				participantMailGroupsField.setValue(lang.get("noEntries_msg"))
			} else {
				participantMailGroupsField.setValue(mailGroupNames.join("; "))
			}
			m.redraw()
		})

		let pageTitleField = new TextField("pageTitle_label").setValue(contactForm.pageTitle).setDisabled()

		let statisticsFieldsTable = null
		if (contactForm.statisticsFields.length > 0) {
			statisticsFieldsTable = new Table(["name_label", "type_label"], [ColumnWidth.Largest, ColumnWidth.Largest], false)
			statisticsFieldsTable.updateEntries(contactForm.statisticsFields.map(f => new TableLine([f.name, statisticsFieldTypeToString(f)])))
		}

		this.view = () => {
			return [
				m("#user-viewer.fill-absolute.scroll.plr-l", [
					m(".flex-space-between.pt", [
						m(".h4", lang.get("emailProcessing_label")),
						m(actions),
					]),
					m(".wrapping-row", [
						m(mailGroupField),
					]),
					m(".mt-l", [
						m(participantMailGroupsField),
					]),
					m(".h4.mt-l", lang.get("display_action")),
					m(urlField),
					m(pageTitleField),
					(statisticsFieldsTable) ? m(".h4.mt-l", lang.get("statisticsFields_label")) : null,
					(statisticsFieldsTable) ? m(statisticsFieldsTable) : null,
					(statisticsFieldsTable) ? m(".small", lang.get("statisticsFieldsInfo_msg")) : null
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
		newForm.pageTitle = this.contactForm.pageTitle
		newForm.headerHtml = this.contactForm.headerHtml
		newForm.footerHtml = this.contactForm.footerHtml
		newForm.helpHtml = this.contactForm.helpHtml
		newForm.statisticsFields = this.contactForm.statisticsFields.slice()
		ContactFormEditor.show(newForm, true, brandingDomain, this._newContactFormIdReceiver)
	}

	_delete() {
		Dialog.confirm("confirmDeleteContactForm_msg").then(confirmed => {
			if (confirmed) {
				erase(this.contactForm)
			}
		})
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		// the contact form list view creates a new viewer if my contact form is updated
	}
}

export function statisticsFieldTypeToString(field: Object): string {
	if (field.type == InputFieldType.TEXT) {
		return lang.get("text_label")
	} else if (field.type == InputFieldType.NUMBER) {
		return lang.get("number_label")
	} else if (field.type == InputFieldType.ENUM) {
		return "[" + field.enumValues.map(s => s.name).join(", ") + "]"
	} else {
		return ""
	}
}

export function getContactFormUrl(domain: string, path: string): string {
	let pathPrefix = ""
	if (location.pathname.indexOf("beta/client/build") != -1) {
		// local
		pathPrefix = ":9000/beta/client/build/index"
	}
	return "https://" + domain + pathPrefix + "/contactform/" + path
}