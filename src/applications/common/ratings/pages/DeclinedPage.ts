import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { TriggerType } from "../UserSatisfactionUtils.js"
import { deviceConfig } from "../../misc/DeviceConfig.js"
import { px } from "../../../../ui/size.js"
import { ImageWithOptionsAndInputDialog } from "../../../../ui/dialogs/ImageWithOptionsAndInputDialog"
import { sendSurveyData, UserUpgradedDeclinedDialogState } from "../UserUpgradedDeclinedDialog"

interface DeclinedPageAttrs {
	triggerType: TriggerType
	dialog: Dialog
	data: UserUpgradedDeclinedDialogState
}

export class DeclinedPage implements Component<DeclinedPageAttrs> {
	view({ attrs: { dialog, triggerType, data } }: Vnode<DeclinedPageAttrs>): Children {
		return m(ImageWithOptionsAndInputDialog, {
			image: `/images/dynamic-color-svg/feedback.svg`,
			imageStyle: { maxWidth: px(220) },
			titleText: "declinedFeedbackDialogBeforeYouGoTitle_msg",
			messageText: "declinedFeedbackDialogInput_msg",
			mainActionText: "sendFeedback_action",
			inputTextPlaceholder: "declinedFeedbackDialogBeforeYouGoPlaceholder_msg",
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
