//@flow
import {createNotificationMailTemplate} from "../api/entities/sys/NotificationMailTemplate"
import {HtmlEditor, Mode} from "../gui/base/HtmlEditor"
import {lang, languages} from "../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {Dialog, DialogType} from "../gui/base/Dialog"
import m from "mithril"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {update} from "../api/main/Entity"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {htmlSanitizer} from "../misc/HtmlSanitizer"

export function show(existingTemplate: ?NotificationMailTemplate, customerProperties: LazyLoaded<CustomerProperties>) {
	let template: NotificationMailTemplate
	if (!existingTemplate) {
		template = createNotificationMailTemplate()
		template.language = "en"
	} else {
		template = existingTemplate
	}

	const editor = new HtmlEditor(null)
	editor.setMinHeight(80)
	editor.showBorders()
	editor.setModeSwitcher("mailBody_label")
	editor.setValue(template.body)


	const sortedLanguages = languages.slice()
	                                 .sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
	                                 .map(language => {
		                                 return {name: lang.get(language.textId), value: language.code}
	                                 })
	const selectedLanguage = sortedLanguages.find(({value}) => value === template.language)
	const selectedLanguageStream = stream(selectedLanguage && selectedLanguage.value)
	const subject = stream(template.subject)

	Dialog.showActionDialog({
		type: DialogType.EditLarge,
		title: "Edit notificaiton email",
		child: () => {
			return [
				m(DropDownSelectorN, {
					label: "notificationMailLanguage_label",
					items: sortedLanguages,
					selectedValue: selectedLanguageStream,
					dropdownWidth: 250
				}),
				m(TextFieldN, {
					label: "subject_label",
					value: subject
				}),
				m(editor)
			]
		},
		okAction: (dialog) => {
			if (!editor.getValue().includes("{link}")) {
				Dialog.error(() => lang.get("templateMustContain_msg", {"{value}": "{link}"}))
				return
			}
			showProgressDialog("pleaseWait_msg", customerProperties.getAsync().then((customerProperties) => {
				template.subject = htmlSanitizer.sanitize(subject(), false).text
				template.body = htmlSanitizer.sanitize(editor.getValue(), false).text
				const index = customerProperties.notificationMailTemplates.findIndex((t) => t.language === template.language)
				if (index !== -1) {
					customerProperties.notificationMailTemplates[index] = template
				} else {
					customerProperties.notificationMailTemplates.push(template)
				}
				update(customerProperties)
			})).then(() => dialog.close())
		}
	})
}