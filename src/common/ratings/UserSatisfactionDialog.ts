import { deviceConfig } from "../misc/DeviceConfig.js"
import {
	completeEvaluationStage,
	completeTriggerStage,
	createEvent,
	evaluateRatingEligibility,
	isEventHappyMoment,
	TriggerType,
} from "./UserSatisfactionUtils.js"
import { MultiPageDialog } from "../gui/dialogs/MultiPageDialog.js"
import { EvaluationPage } from "./pages/EvaluationPage.js"
import m from "mithril"
import { DateTime } from "luxon"
import { ButtonType } from "../gui/base/Button.js"
import { AndroidPlayStorePage } from "./pages/AndroidPlayStorePage.js"
import { SupportTutaPage } from "./pages/SupportTutaPage.js"
import { DissatisfactionPage } from "./pages/DissatisfactionPage.js"
import { SuggestionPage } from "./pages/SuggestionPage.js"
import { isApp, isIOSApp } from "../api/common/Env.js"
import { ContactSupportPage } from "../support/pages/ContactSupportPage.js"
import { lang } from "../misc/LanguageViewModel.js"
import Stream from "mithril/stream"
import { SupportCategory, SupportTopic } from "../api/entities/tutanota/TypeRefs.js"
import { SupportDialogState } from "../support/SupportDialog.js"
import { showSnackBar } from "../gui/base/SnackBar.js"
import { client } from "../misc/ClientDetector.js"
import { windowFacade } from "../misc/WindowFacade.js"
import { getCurrentDate, TUTA_MAIL_APP_STORE_URL, TUTA_MAIL_GOOGLE_PLAY_URL } from "../api/common/TutanotaConstants.js"
import { isEmpty, noOp } from "@tutao/tutanota-utils"
import { Dialog } from "../gui/base/Dialog.js"

export type UserSatisfactionDialogPage = "evaluation" | "dissatisfaction" | "androidPlayStore" | "supportTuta" | "suggestion" | "contactSupport"

export function showUserSatisfactionDialog(triggerType: TriggerType): void {
	completeTriggerStage(triggerType)

	deviceConfig.setNextEvaluationDate(DateTime.now().plus({ month: 4 }).toJSDate())

	const data: SupportDialogState = {
		canHaveEmailSupport: true,
		selectedCategory: Stream<SupportCategory | null>(null),
		selectedTopic: Stream<SupportTopic | null>(null),
		categories: [],
		supportRequestHtml: "",
		isSupportRequestEmpty: true,
		shouldIncludeLogs: Stream(true),
		logs: Stream([]),
		contactTemplate: Stream(""),
		helpText: Stream(lang.get("supportForm_msg")),
	}

	const dialog = new MultiPageDialog<UserSatisfactionDialogPage>("evaluation", (dialog, navigateToPage, goBack) => ({
		evaluation: {
			content: m(EvaluationPage, {
				triggerType,
				dialog,
				navigate: navigateToPage,
			}),
			rightAction: {
				label: "notNow_label",
				click: () => {
					dialog.close()
					deviceConfig.setNextEvaluationDate(DateTime.now().plus({ months: 1 }).toJSDate())
					completeEvaluationStage(triggerType, "NotNow")
				},
				title: "notNow_label",
				type: ButtonType.Secondary,
			},
			// onClose handler is here because on android, using the back gesture causes the dialog to close.
			// This interaction shall be interpreted as a "Not now" response.
			onClose: () => {
				dialog.close()
				deviceConfig.setNextEvaluationDate(DateTime.now().plus({ months: 1 }).toJSDate())
				completeEvaluationStage(triggerType, "NotNow")
			},
		},
		androidPlayStore: {
			content: m(AndroidPlayStorePage, { triggerType, dialog }),
		},
		dissatisfaction: {
			content: m(DissatisfactionPage, {
				dialog,
				navigate: navigateToPage,
			}),
			rightAction: {
				label: "notNow_label",
				click: () => dialog.close(),
				title: "notNow_label",
				type: ButtonType.Secondary,
			},
		},
		supportTuta: {
			content: m(SupportTutaPage, { dialog }),
			rightAction: {
				label: "notNow_label",
				type: ButtonType.Secondary,
				click: () => dialog.close(),
			},
		},
		suggestion: {
			content: m(SuggestionPage, { dialog }),
			leftAction: {
				label: "back_action",
				type: ButtonType.Secondary,
				click: () => goBack(),
			},
			rightAction: {
				label: "notNow_label",
				type: ButtonType.Secondary,
				click: () => dialog.close(),
			},
		},
		contactSupport: {
			content: m(ContactSupportPage, {
				data,
				isRating: true,
				onSuccess: () => onSupportRequestSend(dialog),
			}),
			title: lang.get("supportMenu_label"),
			rightAction: {
				label: "notNow_label",
				type: ButtonType.Secondary,
				click: () => dialog.close(),
			},
			leftAction: { type: ButtonType.Secondary, click: () => goBack(), label: "back_action", title: "back_action" },
		},
	})).getDialog()

	dialog.show()
}

/**
 * If the client is on any app (Tuta Mail or Tuta Calendar), we save the current date as an event to determine if we want to trigger a "rate Tuta" dialog.
 */
export async function handleRatingByEvent(triggerType: TriggerType) {
	if (isApp()) {
		createEvent(deviceConfig)
	}

	const disallowReasons = await evaluateRatingEligibility(getCurrentDate(), deviceConfig, isApp())

	if (!isEmpty(disallowReasons)) {
		return
	}

	if (isEventHappyMoment(getCurrentDate(), deviceConfig)) {
		showUserSatisfactionDialog(triggerType)
	}
}

function onSupportRequestSend(dialog: Dialog) {
	dialog.close()

	void showSnackBar({
		message: "ratingSupportContactedSnackbar_msg",
		button: client.isCalendarApp()
			? {
					label: lang.makeTranslation("", "Get Tuta Mail"),
					click: () => windowFacade.openLink(isIOSApp() ? TUTA_MAIL_APP_STORE_URL : TUTA_MAIL_GOOGLE_PLAY_URL),
				}
			: {
					label: "ok_action",
					click: noOp,
				},
		waitingTime: 300,
	})
}
