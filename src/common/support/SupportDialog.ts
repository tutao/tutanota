import m from "mithril"
import { assertMainOrNode, isWebClient } from "../api/common/Env"
import { LoginController } from "../api/main/LoginController.js"
import Stream from "mithril/stream"
import { SupportCategory, SupportData, SupportDataTypeRef, SupportTopic } from "../api/entities/tutanota/TypeRefs.js"
import { MultiPageDialog } from "../gui/dialogs/MultiPageDialog.js"
import { SupportLandingPage } from "./pages/SupportLandingPage.js"
import { locator } from "../api/main/CommonLocator.js"
import { SupportCategoryPage } from "./pages/SupportCategoryPage.js"
import { SupportTopicPage } from "./pages/SupportTopicPage.js"
import { ContactSupportPage } from "./pages/ContactSupportPage.js"
import { SupportSuccessPage } from "./pages/SupportSuccessPage.js"
import { ButtonType } from "../gui/base/Button.js"
import { Keys } from "../api/common/TutanotaConstants.js"
import { DataFile } from "../api/common/DataFile.js"
import { EmailSupportUnavailablePage } from "./pages/EmailSupportUnavailablePage.js"
import { Dialog } from "../gui/base/Dialog.js"
import { client } from "../misc/ClientDetector"
import { SupportVisibilityMask } from "./SupportVisibilityMask"
import { SupportRequestSentPage } from "./pages/SupportRequestSentPage.js"
import { lang } from "../misc/LanguageViewModel.js"
import { CacheMode } from "../api/worker/rest/EntityRestClient.js"

assertMainOrNode()

export interface SupportDialogState {
	canHaveEmailSupport: boolean
	selectedCategory: Stream<SupportCategory | null>
	selectedTopic: Stream<SupportTopic | null>
	contactTemplate: Stream<string>
	helpText: Stream<string>
	categories: SupportCategory[]
	supportRequest: string
	shouldIncludeLogs: Stream<boolean>
	logs: Stream<DataFile[]>
}

export async function showSupportDialog(logins: LoginController) {
	const data: SupportDialogState = {
		canHaveEmailSupport: logins.isInternalUserLoggedIn() && logins.getUserController().isPaidAccount(),
		selectedCategory: Stream<SupportCategory | null>(null),
		selectedTopic: Stream<SupportTopic | null>(null),
		contactTemplate: Stream<string>(""),
		helpText: Stream<string>(lang.get("supportForm_msg")),
		categories: [],
		supportRequest: "",
		shouldIncludeLogs: Stream(true),
		logs: Stream([]),
	}

	const multiPageDialog: Dialog = new MultiPageDialog<SupportPages>(SupportPages.CATEGORIES)
		.buildDialog(
			(currentPage, dialog, navigateToPage, _) => {
				switch (currentPage) {
					case SupportPages.CATEGORY_DETAIL:
						return m(SupportCategoryPage, {
							data,
							goToContactSupport: () => {
								if (data.canHaveEmailSupport) {
									navigateToPage(SupportPages.CONTACT_SUPPORT)
								} else {
									navigateToPage(SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL)
								}
							},
							goToTopicDetailPage: () => {
								const selectedTopic = data.selectedTopic()

								if (selectedTopic) {
									data.contactTemplate(getTopicContactTemplate(selectedTopic, lang.languageTag))
									data.helpText(getTopicHelpText(selectedTopic, lang.languageTag))
								}

								navigateToPage(SupportPages.TOPIC_DETAIL)
							},
						})
					case SupportPages.TOPIC_DETAIL:
						return m(SupportTopicPage, {
							data,
							dialog,
							goToSolutionWasHelpfulPage: () => {
								navigateToPage(SupportPages.SOLUTION_WAS_HELPFUL)
							},
							goToContactSupportPage: () => {
								if (data.canHaveEmailSupport) {
									navigateToPage(SupportPages.CONTACT_SUPPORT)
								} else {
									navigateToPage(SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL)
								}
							},
						})
					case SupportPages.CONTACT_SUPPORT:
						return m(ContactSupportPage, { data, goToSuccessPage: () => navigateToPage(SupportPages.SUPPORT_REQUEST_SENT) })
					case SupportPages.SOLUTION_WAS_HELPFUL:
						return m(SupportSuccessPage)
					case SupportPages.SUPPORT_REQUEST_SENT: {
						return m(SupportRequestSentPage)
					}
					case SupportPages.CATEGORIES:
						return m(SupportLandingPage, {
							data,
							toCategoryDetail: () => {
								const selectedCategory = data.selectedCategory()

								if (selectedCategory) {
									data.contactTemplate(getCategoryContactTemplate(selectedCategory, lang.languageTag))
									data.helpText(getCategoryHelpText(selectedCategory, lang.languageTag))
								}

								navigateToPage(SupportPages.CATEGORY_DETAIL)
							},
						})
					case SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL:
						return m(EmailSupportUnavailablePage, {
							data,
							goToContactSupportPage: () => {
								navigateToPage(SupportPages.CONTACT_SUPPORT)
							},
						})
				}
			},
			{
				getPageTitle: (_) => {
					return { testId: "back_action", text: lang.get("supportMenu_label") }
				},
				getLeftAction: (currentPage, dialog, navigateToPage, goBack) => {
					switch (currentPage) {
						case SupportPages.CATEGORIES:
							return { type: ButtonType.Secondary, click: () => dialog.close(), label: "close_alt", title: "close_alt" }
						case SupportPages.TOPIC_DETAIL:
						case SupportPages.CATEGORY_DETAIL:
						case SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL:
							return {
								type: ButtonType.Secondary,
								click: () => {
									goBack()

									// going back from topic -> use category template
									const selectedCategory = data.selectedCategory()
									if (currentPage === SupportPages.TOPIC_DETAIL && selectedCategory != null) {
										data.contactTemplate(getCategoryContactTemplate(selectedCategory, lang.languageTag))
										data.helpText(getCategoryHelpText(selectedCategory, lang.languageTag))
									}
								},
								label: "back_action",
								title: "back_action",
							}
						case SupportPages.CONTACT_SUPPORT:
							return {
								type: ButtonType.Secondary,
								click: () => goBack(),
								label: "back_action",
								title: "back_action",
							}
						case SupportPages.SOLUTION_WAS_HELPFUL:
						case SupportPages.SUPPORT_REQUEST_SENT:
							return { type: ButtonType.Secondary, click: () => dialog.close(), label: "close_alt", title: "close_alt" }
					}
				},
				getRightAction: (currentPage, dialog, _, __) => {
					if (currentPage === SupportPages.EMAIL_SUPPORT_BEHIND_PAYWALL) {
						return {
							type: ButtonType.Secondary,
							label: "close_alt",
							title: "close_alt",
							click: () => {
								dialog.close()
							},
						}
					}
				},
			},
		)
		.addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: () => multiPageDialog.close(),
		})
		.show()

	const supportData = await locator.entityClient.load(SupportDataTypeRef, "--------1---", { cacheMode: CacheMode.WriteOnly })
	data.categories = filterCategories(supportData)
	// redraw is needed to tell the SupportLandingPage to change the progress icon to the actual data
	m.redraw()
}

/**
 * Gets the button text showed to direct users to the contact form based on the users' current language.
 * Some topics require contacting the support directly.
 */
export function getContactSupportText(topic: SupportTopic, languageTag: string): string | null {
	return languageTag.includes("de") ? topic.contactSupportTextDE : topic.contactSupportTextEN
}

/**
 * Gets the contact form default value for the provided category, based on the users' current language.
 * It is being used when the user cannot fully identify an issue from the list, so they click on "Other" in the list of issues within one category.
 */
export function getCategoryContactTemplate(category: SupportCategory, languageTag: string): string {
	return languageTag.includes("de") ? category.contactTemplateHtmlDE : category.contactTemplateHtmlEN
}

/**
 * Gets the contact form default value for the provided topic, based on the users' current language.
 * It is being used when the user did not find a solution helpful and being redirected to the contact form.
 */
export function getTopicContactTemplate(topic: SupportTopic, languageTag: string): string {
	return languageTag.includes("de") ? topic.contactTemplateHtmlDE : topic.contactTemplateHtmlEN
}

/**
 * Gets the help text further explaining the issue the user faced, usually displayed in the contact support form. It is based on the users' current language.
 */
export function getTopicHelpText(topic: SupportTopic, languageTag: string): string {
	return languageTag.includes("de") ? topic.helpTextDE : topic.helpTextEN
}

export function getCategoryHelpText(category: SupportCategory, languageTag: string): string {
	return languageTag.includes("de") ? category.helpTextDE : category.helpTextEN
}

/**
 * Gets the issue a user may face based on the users' current language.
 */
export function getTopicIssue(topic: SupportTopic, languageTag: string): string {
	return languageTag.includes("de") ? topic.issueDE : topic.issueEN
}

/**
 * Gets the categories' name based on the users' current language.
 */
export function getCategoryName(category: SupportCategory, languageTag: string): string {
	return languageTag.includes("de") ? category.nameDE : category.nameEN
}

/**
 * Gets the categories' introduction text based on the users' current language.
 */
export function getCategoryIntroduction(category: SupportCategory, languageTag: string): string {
	return languageTag.includes("de") ? category.introductionDE : category.introductionEN
}

function filterCategories(supportData: SupportData) {
	const categories = supportData.categories

	for (const key in supportData.categories) {
		const filteredTopics: SupportTopic[] = []
		const supportCategory = categories[key]
		for (const topic of supportCategory.topics) {
			const visibility = Number(topic.visibility)

			const meetsPlatform =
				(isEnabled(visibility, SupportVisibilityMask.TutaCalendarMobile) && client.isCalendarApp()) ||
				(isEnabled(visibility, SupportVisibilityMask.TutaMailMobile) && client.isMailApp()) ||
				(isEnabled(visibility, SupportVisibilityMask.DesktopOrWebApp) && (client.isDesktopDevice() || isWebClient()))

			const isFreeAccount = !locator.logins.getUserController().isPaidAccount()
			const meetsCustomerStatus =
				(isEnabled(visibility, SupportVisibilityMask.FreeUsers) && isFreeAccount) ||
				(isEnabled(visibility, SupportVisibilityMask.PaidUsers) && !isFreeAccount)

			if (meetsPlatform && meetsCustomerStatus) {
				filteredTopics.push(topic)
			}
		}

		supportCategory.topics = filteredTopics
	}

	return categories.filter((cat) => cat.topics.length > 0)
}

enum SupportPages {
	CATEGORIES,
	CATEGORY_DETAIL,
	TOPIC_DETAIL,
	CONTACT_SUPPORT,
	SUPPORT_REQUEST_SENT,
	EMAIL_SUPPORT_BEHIND_PAYWALL,
	SOLUTION_WAS_HELPFUL,
}

function isEnabled(visibility: number, mask: SupportVisibilityMask) {
	return !!(visibility & mask)
}
