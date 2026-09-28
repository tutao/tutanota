import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../ui/base/WizardDialog.js"
import { LeavingUserSurveyData } from "./LeavingUserSurveyWizard.js"
import m, { Vnode, VnodeDOM } from "mithril"
import { CATEGORY_TO_IMAGE, getCategoryType } from "./LeavingUserSurveyConstants.js"
import { SetupLeavingUserSurveyPage } from "./SetupLeavingUserSurveyPage.js"
import { TextField } from "../../../ui/base/TextField"
import { LegacyTextFieldType } from "../../../ui/base/LegacyTextField"

export class LeavingUserSurveyFeedbackPage implements WizardPageN<LeavingUserSurveyData> {
	private _dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<LeavingUserSurveyData>>) {
		this._dom = vnode.dom as HTMLElement
	}

	oninit(vnode: Vnode<WizardPageAttrs<LeavingUserSurveyData>>) {
		//Other reason, only set to avoid error thrown
		vnode.attrs.data.reason = "33"
	}

	view(vnode: Vnode<WizardPageAttrs<LeavingUserSurveyData>>) {
		return m(
			SetupLeavingUserSurveyPage,
			{
				closeAction: () => {
					vnode.attrs.data.submitted = true
					this.closeDialog()
				},
				skipAction: () => this.closeDialog(),
				nextButtonLabel: "submit_action",
				nextButtonEnabled: true,
				image: CATEGORY_TO_IMAGE.get(getCategoryType(vnode.attrs.data.category!))?.image!,
				mainMessage: CATEGORY_TO_IMAGE.get(getCategoryType(vnode.attrs.data.category!))?.translationKey!,
				secondaryMessage: "surveyReasonSecondaryMessage_label",
			},
			m(
				".full-width",
				m(TextField, {
					label: "enterDetails_msg",
					value: vnode.attrs.data.details ?? "",
					oninput: (value) => {
						vnode.attrs.data.details = value
					},
					type: LegacyTextFieldType.Area,
					minLineCount: 8,
					class: "",
				}),
			),
		)
	}

	closeDialog(): void {
		if (this._dom) {
			emitWizardEvent(this._dom, WizardEventType.CLOSE_DIALOG)
		}
	}
}
