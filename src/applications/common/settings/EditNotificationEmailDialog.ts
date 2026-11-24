import {
	Booking,
	BookingTypeRef,
	createNotificationMailTemplate,
	CustomerInfo,
	CustomerInfoTypeRef,
	CustomerProperties,
	CustomerPropertiesTypeRef,
	NotificationMailTemplate,
} from "@tutao/entities/sys"
import { PlanType } from "../../../entities/sys/Utils"
import { GENERATED_MAX_ID, idToElementId } from "@tutao/meta"
import { HtmlEditor } from "../../../ui/editor/HtmlEditor.js"
import { InfoLink, lang, languages } from "../../../ui/utils/LanguageViewModel.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Dialog, DialogType } from "../../../ui/base/Dialog.js"
import m from "mithril"
import type { SelectorItemList } from "../../../ui/base/DropDownSelector.js"
import { DropDownSelectorNew } from "../../../ui/base/DropDownSelectorNew.js"
import { Card } from "../../../ui/base/Card.js"
import { Icon, IconSize } from "../../../ui/base/Icon.js"
import { theme } from "../../../ui/theme.js"
import { px, size } from "../../../ui/size.js"
import { PlaceholderChip, PlaceholderChips } from "./PlaceholderChips.js"
import { TextField } from "../../../ui/base/TextField.js"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog.js"
import { assertNotNull, LazyLoaded, memoized, neverNull, ofClass } from "@tutao/utils"
import { getHtmlSanitizer } from "../misc/HtmlSanitizer.js"
import { PayloadTooLargeError } from "@tutao/rest-client/error"
import { Icons } from "../../../ui/base/icons/Icons.js"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons.js"
import { TextSegmentControl, TextSegmentControlItem } from "../../../ui/base/TextSegmentControl.js"
import { UserError } from "../api/main/UserError.js"
import { showNotAvailableForFreeDialog, showPlanUpgradeRequiredDialog } from "../misc/SubscriptionDialogs.js"
import { getAvailablePlansWithWhitelabel, isWhitelabelActive } from "../subscription/utils/SubscriptionUtils.js"
import type { UserController } from "../api/main/UserController.js"
import { locator } from "../api/main/CommonLocator.js"
import { UpgradePromptType } from "@tutao/app-env"
import { getWhitelabelDomainInfo } from "../api/common/utils/CustomerUtils.js"

import { insertInlineImageB64ClickHandler } from "../mailFunctionality/SharedMailUtils.js"

export function showAddOrEditNotificationEmailDialog(userController: UserController, selectedNotificationLanguage?: string) {
	let existingTemplate: NotificationMailTemplate | undefined = undefined
	userController.reloadCustomer().then((customer) => {
		if (customer.properties) {
			const customerProperties = new LazyLoaded(() => locator.entityClient.load(CustomerPropertiesTypeRef, idToElementId(neverNull(customer.properties))))
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
		showNotAvailableForFreeDialog(UpgradePromptType.CUSTOM_NOTIFICATION_EMAIL, [PlanType.Unlimited])
	} else {
		const planConfiguration = await locator.logins.getUserController().getPlanConfig()
		let whitelabel = isWhitelabelActive(lastBooking, planConfiguration)
		if (!whitelabel) {
			const plansWithWhitelabel = await getAvailablePlansWithWhitelabel()
			whitelabel = await showPlanUpgradeRequiredDialog(UpgradePromptType.CUSTOM_NOTIFICATION_EMAIL, plansWithWhitelabel)
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
			subject: lang.getTranslation("externalNotificationMailSubject_msg", {
				"{1}": "{sender}",
			}).text,
		})
	} else {
		template = existingTemplate
	}

	const editor = new HtmlEditor(getHtmlSanitizer())
		.setMinHeight(400)
		.showBorders()
		.setModeSwitcher("mailBody_label")
		.setValue(template.body)
		.enableToolbar()
		.setToolbarOptions({
			imageButtonClickHandler: insertInlineImageB64ClickHandler,
			isNonElevatedBackground: true,
		})
		.setBackgroundClass("nav-bg")
	const editSegment: TextSegmentControlItem<string> = {
		icon: Icons.PenOutline,
		label: "edit_action",
		value: "edit",
	}
	const previewSegment: TextSegmentControlItem<string> = {
		icon: Icons.EyeOutline,
		label: "preview_label",
		value: "preview",
	}
	const selectedTab = stream(editSegment.value)
	const sortedLanguages: SelectorItemList<string> = languages
		.slice()
		.sort((a, b) => lang.getTranslationText(a.textId).localeCompare(lang.getTranslationText(b.textId)))
		.map((language) => {
			return {
				name: lang.getTranslationText(language.textId),
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

	let subjectInput = null as HTMLInputElement | null
	let subjectFocused = false
	const insertPlaceholder = (placeholder: string) => {
		if (subjectFocused && subjectInput) {
			subjectInput.setRangeText(placeholder, subjectInput.selectionStart ?? subject().length, subjectInput.selectionEnd ?? subject().length, "end")
			subject(subjectInput.value)
		} else {
			editor.insertAtCursor(placeholder)
		}
	}
	const removePlaceholder = (placeholder: string) => {
		subject(subject().split(placeholder).join(""))
		editor.removeText(placeholder)
	}
	const placeholderChips: PlaceholderChip[] = [
		{ placeholder: "{link}", label: "notificationMailLink_label", required: true },
		{ placeholder: "{sender}", label: "sender_label" },
	]

	const editTabContent = () => [
		m(Card, { classes: ["mt-16 center"], style: { padding: px(size.spacing_16) } }, [
			m(Icon, { icon: Icons.BellFilled, size: IconSize.PX32, style: { fill: theme.on_surface_variant } }),
			m(".smaller.mt-16", lang.getTranslationText("templateHelp_msg")),
		]),
		m(".mt-16", [
			existingTemplate
				? m(TextField, {
						label: "notificationMailLanguage_label",
						isReadOnly: true,
						value: selectedLanguage.name,
					})
				: m(DropDownSelectorNew, {
						label: "notificationMailLanguage_label",
						items: sortedLanguages,
						selectedValue: selectedLanguageStream(),
						selectionChangedHandler: selectedLanguageStream,
						dropdownWidth: 250,
					}),
		]),
		m(
			".mt-16",
			m(PlaceholderChips, {
				chips: placeholderChips,
				contentWithPlaceholder: subject() + editor.getValue(),
				onInsert: insertPlaceholder,
				onRemove: removePlaceholder,
			}),
		),
		m(
			".mt-16",
			m(TextField, {
				label: "subject_label",
				value: subject(),
				oninput: subject,
				onfocus: (_, input) => {
					subjectInput = input
					subjectFocused = true
				},
				onblur: () => (subjectFocused = false),
			}),
		),
		m(".mt-16", m(editor)),
	]

	const senderName = locator.logins.getUserController().userGroupInfo.name
	let senderDomain = "https://app.tuta.com"
	loadCustomerInfo().then((customerInfo) => {
		const whitelabelDomainInfo = customerInfo && getWhitelabelDomainInfo(customerInfo)
		senderDomain = "https://" + ((whitelabelDomainInfo && whitelabelDomainInfo.domain) || "app.tuta.com")
		m.redraw()
	})
	const htmlSanitizer = getHtmlSanitizer()
	// Even though savedHtml is always sanitized changing it might lead to mXSS
	const sanitizePreview = memoized<(html: string) => string>((html) => {
		return htmlSanitizer.sanitizeHTML(html).html
	})

	const previewTabContent = () => [
		m(".mt-16", m(TextField, { label: "subject_label", value: subject().replace(/{sender}/g, senderName), isReadOnly: true })),
		m(".small.mt-16.mb-16", lang.getTranslationText("mailBody_label")),
		m.trust(sanitizePreview(savedHtml.replace(/{sender}/g, senderName).replace(/{link}/g, senderDomain))),
	]

	const save = (dialog: Dialog) => {
		if (!editor.getValue().includes("{link}")) {
			return Dialog.message(
				lang.getTranslation("templateMustContain_msg", {
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
					return Dialog.message(lang.makeTranslation("error_message", err.message))
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
	}

	const dialog = Dialog.showActionDialog({
		type: DialogType.Popup_L,
		title: "edit_action",
		child: () => {
			return [
				m(TextSegmentControl, {
					items: [editSegment, previewSegment],
					selectedValue: selectedTab(),
					onValueSelected: selectedTab,
				}),
				selectedTab() === editSegment.value ? editTabContent() : previewTabContent(),
				m(
					".flex-end.wrap.mt-24.gap-16",
					m(PrimaryButton, {
						width: "flex",
						label: "save_action",
						onclick: () => save(dialog),
						disabled: !(selectedTab() === editSegment.value ? editor.getValue() : savedHtml).includes("{link}"),
					}),
				),
			]
		},
		okAction: null,
	})
}

const HTML_PTAG_START = "<p>"
const HTML_PTAG_END = "</p>"

function getDefaultNotificationMail(): string {
	return (
		HTML_PTAG_START +
		lang.getTranslationText("externalNotificationMailBody1_msg") +
		HTML_PTAG_END +
		HTML_PTAG_START +
		lang.getTranslation("externalNotificationMailBody2_msg", {
			"{1}": InfoLink.HomePage,
		}).text +
		HTML_PTAG_END +
		HTML_PTAG_START +
		"<a href='{link}'>" +
		lang.getTranslationText("externalNotificationMailBody3_msg") +
		"</a>" +
		HTML_PTAG_END +
		HTML_PTAG_START +
		lang.getTranslationText("externalNotificationMailBody4_msg") +
		"<br>" +
		"{link}" +
		"<br>" +
		HTML_PTAG_END +
		HTML_PTAG_START +
		lang.getTranslationText("externalNotificationMailBody5_msg") +
		HTML_PTAG_END +
		HTML_PTAG_START +
		lang.getTranslationText("externalNotificationMailBody6_msg") +
		"<br>" +
		"{sender}" +
		HTML_PTAG_END
	)
}

function loadCustomerInfo(): Promise<CustomerInfo | null> {
	return locator.logins
		.getUserController()
		.reloadCustomer()
		.then((customer) => locator.entityClient.load<CustomerInfo>(CustomerInfoTypeRef, customer.customerInfo))
}
