import { deviceConfig } from "../misc/DeviceConfig.js"
import { completeEvaluationStage, completeTriggerStage, TriggerType } from "./UserSatisfactionUtils.js"
import { MultiPageDialog } from "../../../ui/dialogs/MultiPageDialog.js"
import m from "mithril"
import { DateTime } from "luxon"
import { ButtonType } from "../../../ui/base/Button.js"
import { windowFacade } from "../misc/WindowFacade.js"
import { noOp } from "@tutao/utils"
import { DeclinedPage } from "./pages/DeclinedPage"
import { UpgradedPage } from "./pages/UpgradedPage"
import { locator } from "../api/main/CommonLocator"
import { createSurveyData, createSurveyDataPostIn, SurveyService_POST } from "@tutao/entities/sys"
import { SURVEY_VERSION_NUMBER } from "../subscription/LeavingUserSurveyConstants"
import { ClientDetector } from "../../../platform-kit/app-env/boot/ClientDetector"
import { SurveyDataType } from "./pages/SuggestionPage"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { showSnackBar } from "../../../ui/base/SnackBar"

export type UserUpgradedDeclinedDialogPages = "upgraded" | "declined"

export interface UserUpgradedDeclinedDialogState {
	feedbackInputText: string
}

export async function showUserUpgradedDeclinedDialog(triggerType: TriggerType): Promise<void> {
	completeTriggerStage(triggerType)

	deviceConfig.setNextEvaluationDate(DateTime.now().plus({ month: 4 }).toJSDate())

	const data: UserUpgradedDeclinedDialogState = {
		feedbackInputText: "",
	}

	const dialog = new MultiPageDialog<UserUpgradedDeclinedDialogPages>(
		triggerType === "DidUpgrade" ? "upgraded" : "declined",
		(dialog) => ({
			upgraded: {
				content: m(UpgradedPage, {
					triggerType,
					dialog,
					data,
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
			declined: {
				content: m(DeclinedPage, {
					triggerType,
					dialog,
					data,
				}),
				rightAction: {
					label: "notNow_label",
					click: () => dialog.close(),
					title: "notNow_label",
					type: ButtonType.Secondary,
				},
			},
		}),
		windowFacade,
	).getDialog()

	dialog.show()
}

export async function sendSurveyData(attrs: UserUpgradedDeclinedDialogState, triggerType: TriggerType) {
	const send = async () => {
		await locator.serviceExecutor.execute(
			SurveyService_POST,
			createSurveyDataPostIn({
				surveyData: createSurveyData({
					version: SURVEY_VERSION_NUMBER,
					category: "4", // 4 == "Other"
					details: attrs.feedbackInputText,
					reason: "33", // 33 == "Provide details"
					clientVersion: env.versionNumber,
					clientPlatform: ClientDetector.get().getClientPlatform().valueOf().toString(),
				}),
				surveyType: triggerType === "DidUpgrade" ? SurveyDataType.UPGRADED.toString() : SurveyDataType.DECLINED.toString(),
			}),
			null,
		)
	}

	await showProgressDialog("sendingEvaluation_msg", send())

	void showSnackBar({
		message: "ratingFeedbackSent_msg",
		button: {
			label: "ok_action",
			click: noOp,
		},
		waitingTime: 300,
	})
}
