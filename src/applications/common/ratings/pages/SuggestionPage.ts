import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { Card } from "../../../../ui/base/Card.js"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons.js"
import { locator } from "../../api/main/CommonLocator.js"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog.js"
import { px } from "../../../../ui/size.js"
import { showSnackBar } from "../../../../ui/base/SnackBar.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { noOp } from "@tutao/utils"
import { ClientDetector } from "../../../../platform-kit/app-env/boot/ClientDetector.js"
import { SURVEY_VERSION_NUMBER } from "../../subscription/LeavingUserSurveyConstants"
import { DynamicColorSvg } from "../../../../ui/base/DynamicColorSvg.js"
import { createSurveyData, createSurveyDataPostIn, SurveyService } from "@tutao/entities/sys"

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
				m(
					".block.center-h",
					{
						style: {
							width: "30%",
							maxWidth: px(160),
						},
					},
					m(DynamicColorSvg, {
						path: `/images/dynamic-color-svg/on-your-mind.svg`,
					}),
				),
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
					m(PrimaryButton, {
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
						clientPlatform: ClientDetector.get().getClientPlatform().valueOf().toString(),
					}),
				}),
				null,
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
