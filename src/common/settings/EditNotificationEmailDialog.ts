import type { Booking, CustomerInfo, CustomerProperties, NotificationMailTemplate } from "../api/entities/sys/TypeRefs.js"
import { BookingTypeRef, createNotificationMailTemplate, CustomerInfoTypeRef, CustomerPropertiesTypeRef } from "../api/entities/sys/TypeRefs.js"
import { HtmlEditor } from "../gui/editor/HtmlEditor.js"
import { InfoLink, lang, languages } from "../misc/LanguageViewModel.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Dialog, DialogType } from "../gui/base/Dialog.js"
import m from "mithril"
import type { SelectorItemList } from "../gui/base/DropDownSelector.js"
import { DropDownSelector } from "../gui/base/DropDownSelector.js"
import { TextField } from "../gui/base/TextField.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { assertNotNull, LazyLoaded, memoized, neverNull, ofClass } from "@tutao/tutanota-utils"
import { htmlSanitizer } from "../misc/HtmlSanitizer.js"
import { PayloadTooLargeError } from "../api/common/error/RestError.js"
import { SegmentControl } from "../gui/base/SegmentControl.js"
import { UserError } from "../api/main/UserError.js"
import { showNotAvailableForFreeDialog, showPlanUpgradeRequiredDialog } from "../misc/SubscriptionDialogs.js"
import { getAvailablePlansWithWhitelabel, isWhitelabelActive } from "../subscription/SubscriptionUtils.js"
import type { UserController } from "../api/main/UserController.js"
import { GENERATED_MAX_ID } from "../api/common/utils/EntityUtils.js"
import { locator } from "../api/main/CommonLocator.js"
import { PlanType } from "../api/common/TutanotaConstants.js"
import { getWhitelabelDomainInfo } from "../api/common/utils/CustomerUtils.js"

import { insertInlineImageB64ClickHandler } from "../mailFunctionality/SharedMailUtils.js"

export function showAddOrEditNotificationEmailDialog(userController: UserController, selectedNotificationLanguage?: string) {
	let existingTemplate: NotificationMailTemplate | undefined = undefined
	userController.loadCustomer().then((customer) => {
		if (customer.properties) {
			const customerProperties = new LazyLoaded(() => locator.entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties)))
			return customerProperties
				.getAsync()
				.then((loadedCustomerProperties) => {
					if (selectedNotificationLanguage != null) {
						existingTemplate = loadedCustomerProperties.notificationMailTemplates.find(
							(template) => template.language === selectedNotificationLanguage,
						)
					}
				})
				.then(() => {
					return userController
						.loadCustomerInfo()
						.then((customerInfo) => {
							return customerInfo.bookings
								? locator.entityClient
										.loadRange(BookingTypeRef, customerInfo.bookings.items, GENERATED_MAX_ID, 1, true)
										.then((bookings) => (bookings.length === 1 ? bookings[0] : null))
								: null
						})
						.then((lastBooking) => {
							showBuyOrSetNotificationEmailDialog(lastBooking, customerProperties, existingTemplate)
						})
				})
		}
	})
}

export async function showBuyOrSetNotificationEmailDialog(
	lastBooking: Booking | null,
	customerProperties: LazyLoaded<CustomerProperties>,
	existingTemplate?: NotificationMailTemplate,
): Promise<void> {
	if (locator.logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog([PlanType.Unlimited])
	} else {
		const planConfiguration = await locator.logins.getUserController().getPlanConfig()
		let whitelabel = isWhitelabelActive(lastBooking, planConfiguration)
		if (!whitelabel) {
			const plansWithWhitelabel = await getAvailablePlansWithWhitelabel()
			whitelabel = await showPlanUpgradeRequiredDialog(plansWithWhitelabel)
		}
		if (whitelabel) {
			show(existingTemplate ?? null, customerProperties)
		}
	}
}

export function show(existingTemplate: NotificationMailTemplate | null, customerProperties: LazyLoaded<CustomerProperties>) {
	let template: NotificationMailTemplate

	if (!existingTemplate) {
		template = createNotificationMailTemplate({
			language: "en",
			body: getDefaultNotificationMail(),
			subject: lang.get("externalNotificationMailSubject_msg", {
				"{1}": "{sender}",
			}),
		})
	} else {
		template = existingTemplate
	}

	const editor = new HtmlEditor()
		.setMinHeight(400)
		.showBorders()
		.setModeSwitcher("mailBody_label")
		.setValue(template.body)
		.enableToolbar()
		.setToolbarOptions({
			imageButtonClickHandler: insertInlineImageB64ClickHandler,
		})
	const editSegment = {
		name: lang.get("edit_action"),
		value: "edit",
	}
	const previewSegment = {
		name: lang.get("preview_label"),
		value: "preview",
	}
	const selectedTab = stream(editSegment.value)
	const sortedLanguages: SelectorItemList<string> = languages
		.slice()
		.sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
		.map((language) => {
			return {
				name: lang.get(language.textId),
				value: language.code,
			}
		})
	const selectedLanguage = assertNotNull(sortedLanguages.find(({ value }) => value === template.language))
	const selectedLanguageStream: Stream<string> = stream(selectedLanguage.value)
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
			? m(TextField, {
					label: "notificationMailLanguage_label",
					isReadOnly: true,
					value: selectedLanguage.name,
			  })
			: m(DropDownSelector, {
					label: "notificationMailLanguage_label",
					items: sortedLanguages,
					selectedValue: selectedLanguageStream(),
					selectionChangedHandler: selectedLanguageStream,
					dropdownWidth: 250,
			  }),
		m(TextField, {
			label: "subject_label",
			value: subject(),
			oninput: subject,
		}),
		m(editor),
	]

	const senderName = locator.logins.getUserController().userGroupInfo.name
	let senderDomain = "https://app.tuta.com"
	loadCustomerInfo().then((customerInfo) => {
		const whitelabelDomainInfo = customerInfo && getWhitelabelDomainInfo(customerInfo)
		senderDomain = "https://" + ((whitelabelDomainInfo && whitelabelDomainInfo.domain) || "app.tuta.com")
		m.redraw()
	})
	// Even though savedHtml is always sanitized changing it might lead to mXSS
	const sanitizePreview = memoized<string, string>((html) => {
		return htmlSanitizer.sanitizeHTML(html).html
	})

	const previewTabContent = () => [
		m(TextField, {
			label: "subject_label",
			value: subject().replace(/{sender}/g, senderName),
			isReadOnly: true,
		}),
		m(".small.mt.mb", lang.get("mailBody_label")),
		m.trust(sanitizePreview(savedHtml.replace(/{sender}/g, senderName).replace(/{link}/g, senderDomain))),
	]

	Dialog.showActionDialog({
		type: DialogType.EditLarge,
		title: lang.get("edit_action"),
		child: () => {
			return [
				m(SegmentControl, {
					items: [editSegment, previewSegment],
					selectedValue: selectedTab(),
					onValueSelected: selectedTab,
				}),
				selectedTab() === editSegment.value ? editTabContent() : previewTabContent(),
			]
		},
		okAction: (dialog: Dialog) => {
			if (!editor.getValue().includes("{link}")) {
				return Dialog.message(() =>
					lang.get("templateMustContain_msg", {
						"{value}": "{link}",
					}),
				)
			}

			let templates: NotificationMailTemplate[]
			let isExistingTemplate: boolean
			const oldLanguage = template.language
			const oldSubject = template.subject
			const oldBody = template.body
			return showProgressDialog(
				"pleaseWait_msg",
				customerProperties.getAsync().then((customerProperties) => {
					templates = customerProperties.notificationMailTemplates

					if (customerProperties.notificationMailTemplates.some((t) => t !== existingTemplate && t.language === selectedLanguageStream())) {
						throw new UserError("templateLanguageExists_msg")
					}

					isExistingTemplate = templates.includes(template)

					if (!isExistingTemplate) {
						customerProperties.notificationMailTemplates.push(template)
					}

					template.subject = htmlSanitizer.sanitizeHTML(subject(), {
						blockExternalContent: false,
					}).html
					template.body = htmlSanitizer.sanitizeHTML(editor.getValue(), {
						blockExternalContent: false,
					}).html
					template.language = selectedLanguageStream()
					return locator.entityClient.update(customerProperties).then(() => dialog.close())
				}),
			)
				.catch(
					ofClass(UserError, (err) => {
						return Dialog.message(() => err.message)
					}),
				)
				.catch(
					ofClass(PayloadTooLargeError, () => {
						template.subject = oldSubject
						template.body = oldBody
						template.language = oldLanguage

						if (!isExistingTemplate) {
							templates.pop()
						}

						return Dialog.message("notificationMailTemplateTooLarge_msg")
					}),
				)
		},
	})
}

const HTML_PTAG_START = "<p>"
const HTML_PTAG_END = "</p>"

function getDefaultNotificationMail(): string {
	return (
		HTML_PTAG_START +
		lang.get("externalNotificationMailBody1_msg") +
		HTML_PTAG_END +
		HTML_PTAG_START +
		lang.get("externalNotificationMailBody2_msg", {
			"{1}": InfoLink.HomePage,
		}) +
		HTML_PTAG_END +
		HTML_PTAG_START +
		"<a href='{link}'>" +
		lang.get("externalNotificationMailBody3_msg") +
		"</a>" +
		HTML_PTAG_END +
		HTML_PTAG_START +
		lang.get("externalNotificationMailBody4_msg") +
		"<br>" +
		"{link}" +
		"<br>" +
		HTML_PTAG_END +
		HTML_PTAG_START +
		lang.get("externalNotificationMailBody5_msg") +
		HTML_PTAG_END +
		HTML_PTAG_START +
		lang.get("externalNotificationMailBody6_msg") +
		"<br>" +
		"{sender}" +
		HTML_PTAG_END
	)
}

function loadCustomerInfo(): Promise<CustomerInfo | null> {
	return locator.logins
		.getUserController()
		.loadCustomer()
		.then((customer) => locator.entityClient.load<CustomerInfo>(CustomerInfoTypeRef, customer.customerInfo))
}
