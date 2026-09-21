import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { TriggerType } from "../UserSatisfactionUtils.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { px } from "../../../../ui/size.js"
import { sendSurveyData, UserUpgradedDeclinedDialogState } from "../UserUpgradedDeclinedDialog"
import { ImageWithOptionsAndInputDialog } from "../../../../ui/dialogs/ImageWithOptionsAndInputDialog"

interface UpgradedPageAttrs {
	triggerType: TriggerType
	dialog: Dialog
	data: UserUpgradedDeclinedDialogState
}

export class UpgradedPage implements Component<UpgradedPageAttrs> {
	view({ attrs: { dialog, triggerType, data } }: Vnode<UpgradedPageAttrs>): Children {
		return m(ImageWithOptionsAndInputDialog, {
			image: `/images/dynamic-color-svg/welcome.svg`,
			imageStyle: { maxWidth: px(220) },
			titleText: "upgradingFeedbackDialogThankYouTitle_msg",
			messageText: "upgradingFeedbackDialogInput_msg",
			inputTextPlaceholder: "upgradingFeedbackDialogThankYouPlaceholder_msg",
			mainActionText: "sendFeedback_action",
			mainActionClick: async () => {
				await sendSurveyData(data, triggerType)
				dialog.close()
				deviceConfig.setLastRatingPromptedDate(new Date())
			},
			subActionText: "skip_action",
			subActionClick: () => {
				dialog.close()
			},
			onFeedbackTextInput: (text: string) => {
				data.feedbackInputText = text
			},
		})
	}
}
