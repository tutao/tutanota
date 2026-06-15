import m, { Children, Vnode } from "mithril"
import { assertMainOrNode } from "../../../platform-kit/app-env"
import { windowFacade } from "../misc/WindowFacade.js"
import { AriaLandmarks, landmarkAttrs } from "../../../ui/AriaUtils.js"
import { lang } from "../../../ui/utils/LanguageViewModel.js"
import { RevocationViewModel } from "./RevocationViewModel.js"
import { RevocationForm } from "./RevocationForm.js"
import { formatDateTime } from "../../../ui/utils/Formatter.js"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog.js"
import { BaseTopLevelView } from "../../../ui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../../ui/base/TopLevelView.js"
import { LoginScreenHeader } from "../../../ui/LoginScreenHeader.js"
import { LeavingUserSurveyData } from "../subscription/LeavingUserSurveyWizard.js"
import { SURVEY_VERSION_NUMBER } from "../subscription/LeavingUserSurveyConstants.js"
import { client } from "../../../platform-kit/app-env/boot/ClientDetector"
import { createSurveyData } from "@tutao/entities/sys"

assertMainOrNode()

export interface RevocationViewAttrs extends TopLevelAttrs {
	makeViewModel: () => RevocationViewModel
}

export class RevocationView extends BaseTopLevelView implements TopLevelView<RevocationViewAttrs> {
	private bottomMargin = 0
	private model: RevocationViewModel

	constructor({ attrs }: Vnode<RevocationViewAttrs>) {
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

	public view({ attrs }: Vnode<RevocationViewAttrs>) {
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
						".flex-grow-shrink-auto.max-width-m.pb-16",
						{
							...landmarkAttrs(AriaLandmarks.Main, lang.get("terminationForm_title")),
							oncreate: (vnode) => {
								;(vnode.dom as HTMLElement).focus()
							},
						},
						m(".flex.col.pt-16.plr-24.content-bg.border-radius-12", [
							this.model.acceptedRevocationRequest ? this.renderRevocationInfo(this.model.mailAddress) : this.renderRevocationForm(),
						]),
					),
				),
			],
		)
	}

	private renderRevocationInfo(mailAddress: string): Children {
		return m("", [
			m(".h3.mt-16", lang.get("revocationSubmitted_label")),
			m(
				"p.mt-16",
				lang.get("revocationSubmitted_msg", {
					"{accountName}": mailAddress,
					"{receivedDate}": formatDateTime(new Date()),
				}),
			),
		])
	}

	private async revokeWithProgressDialog(surveyResult: LeavingUserSurveyData | null) {
		if (surveyResult && surveyResult.submitted && surveyResult.category && surveyResult.reason) {
			const data = createSurveyData({
				category: surveyResult.category,
				reason: surveyResult.reason,
				details: surveyResult.details,
				version: SURVEY_VERSION_NUMBER,
				clientVersion: env.versionNumber,
				clientPlatform: client.getClientPlatform().valueOf().toString(),
			})
			await showProgressDialog("pleaseWait_msg", this.model.createSubscriptionRevocationRequest(data))
		} else {
			await showProgressDialog("pleaseWait_msg", this.model.createSubscriptionRevocationRequest())
		}
		m.redraw()
	}

	private renderRevocationForm(): Children {
		return m(RevocationForm, {
			onSubmit: (surveyData) => this.revokeWithProgressDialog(surveyData),
			mailAddress: this.model.mailAddress,
			onMailAddressChanged: (mailAddress) => (this.model.mailAddress = mailAddress),
			password: this.model.password,
			onPasswordChanged: (password) => (this.model.password = password),
			helpText: lang.getTranslationText(this.model.helpText),
		})
	}
}
