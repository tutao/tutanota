//@flow
import type {NotificationMailTemplate} from "../api/entities/sys/NotificationMailTemplate"
import {createNotificationMailTemplate} from "../api/entities/sys/NotificationMailTemplate"
import {HtmlEditor} from "../gui/editor/HtmlEditor"
import {lang, languages} from "../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {Dialog, DialogType} from "../gui/base/Dialog"
import m from "mithril"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {load, loadRange, update} from "../api/main/Entity"
import {LazyLoaded} from "@tutao/tutanota-utils"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {getWhitelabelDomain} from "../api/common/utils/Utils"
import {memoized, neverNull} from "@tutao/tutanota-utils"
import {logins} from "../api/main/LoginController"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {PayloadTooLargeError} from "../api/common/error/RestError"
import {SegmentControl} from "../gui/base/SegmentControl"
import type {CustomerProperties} from "../api/entities/sys/CustomerProperties"
import {insertInlineImageB64ClickHandler} from "../mail/view/MailViewerUtils"
import type {SelectorItemList} from "../gui/base/DropDownSelectorN"
import {UserError} from "../api/main/UserError"
import type {Booking} from "../api/entities/sys/Booking"
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import {isWhitelabelActive} from "../subscription/SubscriptionUtils"
import {showWhitelabelBuyDialog} from "../subscription/BuyDialog"
import type {IUserController} from "../api/main/UserController"
import {CustomerPropertiesTypeRef} from "../api/entities/sys/CustomerProperties"
import {BookingTypeRef} from "../api/entities/sys/Booking"
import {GENERATED_MAX_ID} from "../api/common/utils/EntityUtils"
import {ofClass} from "@tutao/tutanota-utils"


export function showAddOrEditNotificationEmailDialog(userController: IUserController, selectedNotificationLanguage?: Stream<string>) {
	let existingTemplate: ?NotificationMailTemplate = null
	userController.loadCustomer().then(customer => {
		if (customer.properties) {
			const customerProperties = new LazyLoaded(() => load(CustomerPropertiesTypeRef, neverNull(customer.properties)))
			return customerProperties.getAsync().then(loadedCustomerProperties => {
				if (selectedNotificationLanguage) {
					existingTemplate = loadedCustomerProperties.notificationMailTemplates
					                                           .find(template => template.language === selectedNotificationLanguage())
				}
			}).then(() => {
				return userController.loadCustomerInfo().then(customerInfo => {
					return customerInfo.bookings
						? loadRange(BookingTypeRef, customerInfo.bookings.items, GENERATED_MAX_ID, 1, true)
							.then(bookings => bookings.length === 1 ? bookings[0] : null)
						: null
				}).then(lastBooking => {
					showBuyOrSetNotificationEmailDialog(lastBooking, customerProperties, existingTemplate)
				})
			})
		}
	})
}

export function showBuyOrSetNotificationEmailDialog(lastBooking: ?Booking, customerProperties: LazyLoaded<CustomerProperties>, existingTemplate: ?NotificationMailTemplate) {
	if (logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(false)
	} else {
		const whitelabelFailedPromise = isWhitelabelActive(lastBooking) ? Promise.resolve(false) : showWhitelabelBuyDialog(true)
		whitelabelFailedPromise.then(failed => {
			if (!failed) {
				show(existingTemplate, customerProperties)
			}
		})
	}
}

export function show(existingTemplate: ?NotificationMailTemplate, customerProperties: LazyLoaded<CustomerProperties>) {
	let template: NotificationMailTemplate
	if (!existingTemplate) {
		template = createNotificationMailTemplate()
		template.language = "en"
		template.body = getDefaultNotificationMail()
		template.subject = lang.get("externalNotificationMailSubject_msg", {"{1}": "{sender}"})
	} else {
		template = existingTemplate
	}

	const editor = new HtmlEditor(null, {enabled: true, imageButtonClickHandler: insertInlineImageB64ClickHandler})
		.setMinHeight(400)
		.showBorders()
		.setModeSwitcher("mailBody_label")
		.setValue(template.body)

	const editSegment = {name: lang.get("edit_action"), value: "edit"}
	const previewSegment = {name: lang.get("preview_label"), value: "preview"}
	const selectedTab = stream(editSegment.value)

	const sortedLanguages: SelectorItemList<string> =
		languages.slice()
		         .sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
		         .map(language => {
			         return {
				         name: lang.get(language.textId),
				         value: language.code
			         }
		         })
	const selectedLanguage = sortedLanguages.find(({value}) => value === template.language)
	const selectedLanguageStream: Stream<string> = stream(selectedLanguage && selectedLanguage.value)
	const subject = stream(template.subject)

	// Editor resets its value on re-attach so we keep it ourselves
	let savedHtml = editor.getValue()
	selectedTab.map((tab) => {
		if (tab === editSegment.value) {
			editor.setValue(savedHtml)
		} else {
			savedHtml = editor.getValue()
		}
	})

	const editTabContent = () => [
		m(".small.mt-s", lang.get("templateHelp_msg")),
		existingTemplate
			? m(TextFieldN, {
				label: "notificationMailLanguage_label",
				disabled: true,
				value: stream(neverNull(selectedLanguage).name)
			})
			: m(DropDownSelectorN, {
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

	const senderName = logins.getUserController().userGroupInfo.name
	let senderDomain = "https://mail.tutanota.com"
	loadCustomerInfo()
		.then((customerInfo) => {
			const whitelabelDomainInfo = customerInfo && getWhitelabelDomain(customerInfo)
			senderDomain = "https://" + (whitelabelDomainInfo && whitelabelDomainInfo.domain || "mail.tutanota.com")
			m.redraw()
		})
	// Even though savedHtml is always sanitized changing it might lead to mXSS
	const sanitizePreview = memoized((html) => {
		return htmlSanitizer.sanitize(html).text
	})

	const previewTabContent = () => [
		m(TextFieldN, {
			label: "subject_label",
			value: stream(subject().replace(/{sender}/g, senderName)),
			disabled: true
		}),
		m(".small.mt.mb", lang.get("mailBody_label")),
		m.trust(sanitizePreview(savedHtml.replace(/{sender}/g, senderName).replace(/{link}/g, senderDomain)))
	]

	Dialog.showActionDialog({
		type: DialogType.EditLarge,
		title: lang.get("edit_action"),
		child: () => {
			return [
				m(SegmentControl, {
					items: [editSegment, previewSegment],
					selectedValue: selectedTab,
				}),
				selectedTab() === editSegment.value
					? editTabContent()
					: previewTabContent()
			]
		},
		okAction: (dialog) => {
			if (!editor.getValue().includes("{link}")) {
				return Dialog.error(() => lang.get("templateMustContain_msg", {"{value}": "{link}"}))
			}

			let templates
			let isExistingTemplate
			const oldLanguage = template.language
			const oldSubject = template.subject
			const oldBody = template.body

			return showProgressDialog("pleaseWait_msg", customerProperties.getAsync().then((customerProperties) => {
				templates = customerProperties.notificationMailTemplates
				if (customerProperties.notificationMailTemplates.filter((t) => t !== existingTemplate && t.language
					=== selectedLanguageStream()).length > 0) {
					throw new UserError("templateLanguageExists_msg")
				}

				isExistingTemplate = templates.includes(template)
				if (!isExistingTemplate) {
					customerProperties.notificationMailTemplates.push(template)
				}

				template.subject = htmlSanitizer.sanitize(subject(), {blockExternalContent: false}).text
				template.body = htmlSanitizer.sanitize(editor.getValue(), {blockExternalContent: false}).text
				template.language = selectedLanguageStream()

				return update(customerProperties)
					.then(() => dialog.close())

			}))
				.catch(ofClass(UserError, err => {
					return Dialog.error(() => err.message)
				}))
				.catch(ofClass(PayloadTooLargeError, () => {
					template.subject = oldSubject
					template.body = oldBody
					template.language = oldLanguage
					if (!isExistingTemplate) {
						templates.pop()
					}
					return Dialog.error("notificationMailTemplateTooLarge_msg")
				}))
		}
	})
}


const HTML_PTAG_START = "<p>"
const HTML_PTAG_END = "</p>"

function getDefaultNotificationMail(): string {
	return HTML_PTAG_START + lang.get("externalNotificationMailBody1_msg") + HTML_PTAG_END
		+ HTML_PTAG_START + lang.get("externalNotificationMailBody2_msg", {"{1}": lang.getInfoLink("homePage_link")}) + HTML_PTAG_END
		+ HTML_PTAG_START + "<a href='{link}'>" + lang.get("externalNotificationMailBody3_msg") + "</a>" + HTML_PTAG_END
		+ HTML_PTAG_START + lang.get("externalNotificationMailBody4_msg") + "<br>" + "{link}" + "<br>" + HTML_PTAG_END
		+ HTML_PTAG_START + lang.get("externalNotificationMailBody5_msg") + HTML_PTAG_END
		+ HTML_PTAG_START + lang.get("externalNotificationMailBody6_msg") + "<br>" + "{sender}" + HTML_PTAG_END
}


function loadCustomerInfo(): Promise<?CustomerInfo> {
	return logins.getUserController()
	             .loadCustomer()
	             .then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
}
