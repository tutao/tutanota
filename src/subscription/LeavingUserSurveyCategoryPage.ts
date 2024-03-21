import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { LeavingUserSurveyData } from "./LeavingUserSurveyWizard.js"
import m, { Vnode, VnodeDOM } from "mithril"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { DropDownSelector, type DropDownSelectorAttrs } from "../gui/base/DropDownSelector.js"
import { lang } from "../misc/LanguageViewModel.js"
import { mainSurveyImage } from "../gui/base/icons/Icons.js"

export class LeavingUserSurveyCategoryPage implements WizardPageN<LeavingUserSurveyData> {
	private _dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<LeavingUserSurveyData>>) {
		this._dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<LeavingUserSurveyData>>) {
		return m(
			"#leaving-user-survey-dialog.pt.flex-center",
			m(".flex-grow-shrink-auto.max-width-m.pt.pb.plr-l", [
				m("img.pt.bg-white.pt.pb.block", {
					src: mainSurveyImage,
					style: {
						width: "100%",
						maxWidth: "300px",
						margin: "auto",
					},
				}),
				m("h3.center.b", "We're sad to see you go!"),
				m("p.pb-s.center", "We would greatly appreciate it, if you could let us know why you don't need the paid plan anymore."),
				m(DropDownSelector, {
					style: { border: "2px solid #bbb", borderRadius: "5px", padding: "4px 8px" },
					doShowBorder: false,
					label: () => "Where can we improve?",
					items: [
						{
							name: lang.get("experienceSamplingAnswer_label"),
							value: null,
						},
						{
							name: "Price",
							value: "0",
						},
						{
							name: "Problems with account",
							value: "1",
						},
						{
							name: "Missing feature",
							value: "2",
						},
						{
							name: "Problems with features or design",
							value: "3",
						},
						{
							name: "Other reason",
							value: "4",
						},
					],
					selectedValue: vnode.attrs.data.category,
					selectionChangedHandler: (category) => {
						vnode.attrs.data.category = category
					},
					dropdownWidth: 350,
				} satisfies DropDownSelectorAttrs<NumberString | null>),
				m(
					".flex-center.full-width.pt-l",
					m(
						".full-width",
						m(LoginButton, {
							label: "next_action",
							class: !vnode.attrs.data.category ? "no-hover button-bg" : "",
							onclick: () => this.showNextPage(),
							disabled: !vnode.attrs.data.category,
						}),
					),
				),
			]),
		)
	}

	showNextPage(): void {
		if (this._dom) {
			emitWizardEvent(this._dom, WizardEventType.SHOW_NEXT_PAGE)
		}
	}
}

export class LeavingUserSurveyPageAttrs implements WizardPageAttrs<LeavingUserSurveyData> {
	data: LeavingUserSurveyData

	constructor(leavingUserSurveyData: LeavingUserSurveyData) {
		this.data = leavingUserSurveyData
	}

	headerTitle(): string {
		return "Survey"
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		return Promise.resolve(this.data.category != null)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
