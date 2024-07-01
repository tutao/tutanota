import m, { Children, Vnode } from "mithril"
import { assertMainOrNode } from "../api/common/Env.js"
import { windowFacade } from "../misc/WindowFacade.js"
import { AriaLandmarks, landmarkAttrs } from "../gui/AriaUtils.js"
import { lang } from "../misc/LanguageViewModel.js"
import { TerminationViewModel } from "./TerminationViewModel.js"
import { TerminationForm } from "./TerminationForm.js"
import { formatDateTime, formatDateWithMonth } from "../misc/Formatter.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { createSurveyData, CustomerAccountTerminationRequest } from "../api/entities/sys/TypeRefs.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { LoginScreenHeader } from "../gui/LoginScreenHeader.js"
import { LeavingUserSurveyData, showLeavingUserSurveyWizard } from "../subscription/LeavingUserSurveyWizard.js"
import { SURVEY_VERSION_NUMBER } from "../subscription/LeavingUserSurveyConstants.js"

assertMainOrNode()

export interface TerminationViewAttrs extends TopLevelAttrs {
	makeViewModel: () => TerminationViewModel
}

export class TerminationView extends BaseTopLevelView implements TopLevelView<TerminationViewAttrs> {
	private bottomMargin = 0
	private model: TerminationViewModel

	constructor({ attrs }: Vnode<TerminationViewAttrs>) {
		super()
		this.model = attrs.makeViewModel()
	}

	keyboardListener = (keyboardSize: number) => {
		this.bottomMargin = keyboardSize
		m.redraw()
	}

	protected onNewUrl(args: Record<string, any>, requestedPath: string): void {
		// do nothing
	}

	public view({ attrs }: Vnode<TerminationViewAttrs>) {
		return m(
			"#termination-view.main-view.flex.col.nav-bg",
			{
				oncreate: () => windowFacade.addKeyboardSizeListener(this.keyboardListener),
				onremove: () => windowFacade.removeKeyboardSizeListener(this.keyboardListener),
				style: {
					marginBottom: this.bottomMargin + "px",
				},
			},
			[
				m(LoginScreenHeader),
				m(
					".flex-grow.flex-center.scroll",
					m(
						".flex-grow-shrink-auto.max-width-m.pb",
						{
							...landmarkAttrs(AriaLandmarks.Main, lang.get("terminationForm_title")),
							oncreate: (vnode) => {
								;(vnode.dom as HTMLElement).focus()
							},
						},
						m(".flex.col.pt.plr-l.content-bg.border-radius-big", [
							this.model.acceptedTerminationRequest
								? this.renderTerminationInfo(this.model.mailAddress, this.model.acceptedTerminationRequest)
								: this.renderTerminationForm(),
						]),
					),
				),
			],
		)
	}

	private renderTerminationInfo(mailAddress: string, acceptedTerminationRequest: CustomerAccountTerminationRequest): Children {
		return m("", [
			m(".h3.mt", "Termination successful"),
			m(
				"p.mt",
				lang.get("terminationSuccessful_msg", {
					"{accountName}": mailAddress,
					"{receivedDate}": formatDateTime(acceptedTerminationRequest.terminationRequestDate),
					"{deletionDate}": formatDateWithMonth(acceptedTerminationRequest.terminationDate),
				}),
			),
		])
	}

	private async cancelWithProgressDialog(surveyResult: LeavingUserSurveyData | null) {
		if (surveyResult && surveyResult.submitted && surveyResult.category && surveyResult.reason) {
			const data = createSurveyData({
				category: surveyResult.category,
				reason: surveyResult.reason,
				details: surveyResult.details,
				version: SURVEY_VERSION_NUMBER,
			})
			await showProgressDialog("pleaseWait_msg", this.model.createAccountTerminationRequest(data))
		} else {
			await showProgressDialog("pleaseWait_msg", this.model.createAccountTerminationRequest())
		}
		m.redraw()
	}

	private renderTerminationForm(): Children {
		return m(TerminationForm, {
			onSubmit: (surveyData) => this.cancelWithProgressDialog(surveyData),
			mailAddress: this.model.mailAddress,
			onMailAddressChanged: (mailAddress) => (this.model.mailAddress = mailAddress),
			password: this.model.password,
			onPasswordChanged: (password) => (this.model.password = password),
			date: this.model.date,
			onDateChanged: (date) => (this.model.date = date),
			terminationPeriodOption: this.model.terminationPeriodOption,
			onTerminationPeriodOptionChanged: (option) => (this.model.terminationPeriodOption = option),
			helpText: lang.getMaybeLazy(this.model.helpText),
		})
	}
}
