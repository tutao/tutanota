import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../gui/base/Dialog.js"
import { Card } from "../../gui/base/Card.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { createSurveyData, createSurveyDataPostIn } from "../../api/entities/sys/TypeRefs.js"
import { locator } from "../../api/main/CommonLocator.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { SurveyService } from "../../api/entities/sys/Services.js"
import { px } from "../../gui/size.js"
import { showSnackBar } from "../../gui/base/SnackBar.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { noOp } from "@tutao/tutanota-utils"
import { client } from "../../misc/ClientDetector.js"
import { SURVEY_VERSION_NUMBER } from "../../subscription/LeavingUserSurveyConstants"

interface SuggestionPageAttrs {
	dialog: Dialog
}

export class SuggestionPage implements Component<SuggestionPageAttrs> {
	private dialog: Dialog | null = null
	private textFieldInput: string = ""

	oncreate(vnode: Vnode<SuggestionPageAttrs>): void {
		this.dialog = vnode.attrs.dialog
	}

	view(): Children {
		return m(
			".flex.flex-column.pt-16.height-100p.gap-16",
			m(Card, [
				m("img.block.center-h", {
					src: `${window.tutao.appState.prefixWithoutFile}/images/rating/suggestion-${client.isCalendarApp() ? "calendar" : "mail"}.png`,
					alt: "",
					rel: "noreferrer",
					loading: "lazy",
					decoding: "async",
					style: {
						width: "30%",
						maxWidth: px(160),
					},
				}),
				m(".h3.text-center.pb-8.pt-8", lang.get("ratingSuggestionPage_title")),
			]),
			m(
				Card,
				{
					classes: ["child-text-editor", "rel", "height-100p"],
					style: {
						padding: "0",
					},
				},
				m(SimpleTextEditor, {
					oninput: (text) => {
						this.textFieldInput = text
					},
				}),
			),
			m(
				".flex.flex-column.gap-16.pb-16",
				{
					style: {
						marginTop: "auto",
					},
				},
				m(
					".align-self-center.full-width",
					m(LoginButton, {
						label: "submit_action",
						disabled: this.textFieldInput.trim() === "",
						onclick: () => void this.onSendButtonClick(),
					}),
				),
			),
		)
	}

	private async onSendButtonClick() {
		const send = async () => {
			await locator.serviceExecutor.post(
				SurveyService,
				createSurveyDataPostIn({
					surveyData: createSurveyData({
						version: SURVEY_VERSION_NUMBER,
						category: "4", // 4 == "Other"
						details: this.textFieldInput,
						reason: "33", // 33 == "Provide details"
						clientVersion: env.versionNumber,
						clientPlatform: client.getClientPlatform().valueOf().toString(),
					}),
				}),
			)
		}

		await showProgressDialog("sendingEvaluation_msg", send())

		this.dialog?.close()

		void showSnackBar({
			message: "ratingFeedbackSent_msg",
			button: {
				label: "ok_action",
				click: noOp,
			},
			waitingTime: 300,
		})
	}
}

interface SimpleTextEditorAttrs {
	oninput: (value: string) => void
}

class SimpleTextEditor implements Component<SimpleTextEditorAttrs> {
	view(vnode: Vnode<SimpleTextEditorAttrs>) {
		return m("textarea.tutaui-text-field", {
			style: { "field-sizing": "content", resize: "none", "min-height": px(250) },
			placeholder: lang.get("ratingSuggestion_placeholder"),
			oninput: (event: InputEvent) => {
				const target = event.target
				vnode.attrs.oninput(target ? (target as HTMLTextAreaElement).value : "")
			},
		})
	}
}

export enum SurveyDataType {
	DOWNGRADE = 0,
	DELETE = 1,
	TERMINATION = 2, // used when terminating from the website form.
	SATISFACTION_EVALUATION = 3,
}
