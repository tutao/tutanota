import { assertMainOrNode, isWebClient } from "../api/common/Env"
import { LoginController } from "../api/main/LoginController.js"
import Stream from "mithril/stream"
import { SupportCategory, SupportData, SupportDataTypeRef, SupportTopic } from "../api/entities/tutanota/TypeRefs.js"
import { locator } from "../api/main/CommonLocator.js"
import { DataFile } from "../api/common/DataFile.js"
import { client } from "../misc/ClientDetector"
import { SupportVisibilityMask } from "./SupportVisibilityMask"
import { MultiPageDialog } from "../gui/dialogs/MultiPageDialog"
import m from "mithril"
import { SupportLandingPage } from "./pages/SupportLandingPage.js"
import { lang } from "../misc/LanguageViewModel.js"
import { CacheMode } from "../api/worker/rest/EntityRestClient.js"
import { ButtonType } from "../gui/base/Button.js"
import { SupportCategoryPage } from "./pages/SupportCategoryPage.js"
import { SupportTopicPage } from "./pages/SupportTopicPage.js"
import { ContactSupportPage } from "./pages/ContactSupportPage.js"
import { SupportSuccessPage } from "./pages/SupportSuccessPage.js"
import { SupportRequestSentPage } from "./pages/SupportRequestSentPage.js"
import { EmailSupportUnavailablePage } from "./pages/EmailSupportUnavailablePage.js"
import { Keys } from "../api/common/TutanotaConstants.js"

assertMainOrNode()

export interface SupportDialogState {
	canHaveEmailSupport: boolean
	selectedCategory: Stream<SupportCategory | null>
	selectedTopic: Stream<SupportTopic | null>
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
		categories: [],
		supportRequest: "",
		shouldIncludeLogs: Stream(true),
		logs: Stream([]),
	}

	const dialog = new MultiPageDialog<
		"home" | "categoryDetail" | "topicDetail" | "contactSupport" | "solutionWasHelpful" | "supportRequestSent" | "emailSupportBehindPaywall"
	>("home", (dialog, navigateToPage, goBack) => ({
		home: {
			title: lang.get("supportMenu_label"),
			content: m(SupportLandingPage, {
				data,
				toCategoryDetail: () => navigateToPage("categoryDetail"),
				goToContactSupport: () => {
					if (data.canHaveEmailSupport) {
						navigateToPage("contactSupport")
					} else {
						navigateToPage("emailSupportBehindPaywall")
					}
				},
			}),
			leftAction: { type: ButtonType.Secondary, click: () => dialog.onClose(), label: "close_alt", title: "close_alt" },
		},
		categoryDetail: {
			content: m(SupportCategoryPage, {
				data,
				goToContactSupport: () => {
					if (data.canHaveEmailSupport) {
						navigateToPage("contactSupport")
					} else {
						navigateToPage("emailSupportBehindPaywall")
					}
				},
				goToTopicDetailPage: () => navigateToPage("topicDetail"),
			}),
			title: lang.get("supportMenu_label"),
			leftAction: { type: ButtonType.Secondary, click: () => goBack(), label: "back_action", title: "back_action" },
		},
		topicDetail: {
			content: m(SupportTopicPage, {
				data,
				dialog,
				goToSolutionWasHelpfulPage: () => {
					navigateToPage("solutionWasHelpful")
				},
				goToContactSupportPage: () => {
					if (data.canHaveEmailSupport) {
						navigateToPage("contactSupport")
					} else {
						navigateToPage("emailSupportBehindPaywall")
					}
				},
			}),
			title: lang.get("supportMenu_label"),
			leftAction: { type: ButtonType.Secondary, click: () => goBack(), label: "back_action", title: "back_action" },
		},
		contactSupport: {
			content: m(ContactSupportPage, { data, goToSuccessPage: () => navigateToPage("supportRequestSent") }),
			title: lang.get("supportMenu_label"),
			leftAction: { type: ButtonType.Secondary, click: () => goBack(), label: "back_action", title: "back_action" },
		},
		solutionWasHelpful: {
			content: m(SupportSuccessPage),
			title: lang.get("supportMenu_label"),
			leftAction: { type: ButtonType.Secondary, click: () => dialog.onClose(), label: "close_alt", title: "close_alt" },
		},
		supportRequestSent: {
			content: m(SupportRequestSentPage),
			title: lang.get("supportMenu_label"),
			leftAction: { type: ButtonType.Secondary, click: () => dialog.onClose(), label: "close_alt", title: "close_alt" },
		},
		emailSupportBehindPaywall: {
			content: m(EmailSupportUnavailablePage, {
				data,
				goToContactSupportPage: () => {
					navigateToPage("contactSupport")
				},
			}),
			title: lang.get("supportMenu_label"),
			leftAction: { type: ButtonType.Secondary, click: () => goBack(), label: "back_action", title: "back_action" },
			rightAction: {
				type: ButtonType.Secondary,
				label: "close_alt",
				title: "close_alt",
				click: () => {
					dialog.onClose()
				},
			},
		},
	})).getDialog()

	dialog
		.addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: () => {
				console.info("Closing from ESC key")
				dialog.onClose()
			},
		})
		.show()

	const supportData = await locator.entityClient.load(SupportDataTypeRef, "--------1---", { cacheMode: CacheMode.WriteOnly })
	data.categories = filterCategories(supportData)
	// redraw is needed to tell the SupportLandingPage to change the progress icon to the actual data
	m.redraw()
}

export function getLocalisedTopicIssue(topic: SupportTopic, languageTag: string): string {
	return languageTag.includes("de") ? topic.issueDE : topic.issueEN
}

export function getLocalisedCategoryName(category: SupportCategory, languageTag: string): string {
	return languageTag.includes("de") ? category.nameDE : category.nameEN
}

export function getLocalisedCategoryIntroduction(category: SupportCategory, languageTag: string): string {
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

function isEnabled(visibility: number, mask: SupportVisibilityMask) {
	return !!(visibility & mask)
}
