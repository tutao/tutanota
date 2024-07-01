import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { LeavingUserSurveyData } from "./LeavingUserSurveyWizard.js"
import m, { Vnode, VnodeDOM } from "mithril"
import { DropDownSelector, type DropDownSelectorAttrs } from "../gui/base/DropDownSelector.js"
import { lang } from "../misc/LanguageViewModel.js"
import { theme } from "../gui/theme.js"
import { SetupLeavingUserSurveyPage } from "./SetupLeavingUserSurveyPage.js"

export class LeavingUserSurveyCategoryPage implements WizardPageN<LeavingUserSurveyData> {
	private _dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<WizardPageAttrs<LeavingUserSurveyData>>) {
		this._dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<LeavingUserSurveyData>>) {
		return m(
			SetupLeavingUserSurveyPage,
			{
				closeAction: () => this.showNextPage(),
				nextButtonLabel: "next_action",
				nextButtonEnabled: !vnode.attrs.data.category,
				image: "main",
				mainMessage: "surveyMainMessageDelete_label",
				secondaryMessage: vnode.attrs.data.showDowngradeMessage ? "surveySecondaryMessageDowngrade_label" : "surveySecondaryMessageDelete_label",
			},
			[
				m(DropDownSelector, {
					style: { border: `2px solid ${theme.content_border}`, borderRadius: "6px", padding: "4px 8px" },
					doShowBorder: false,
					label: "surveyUnhappy_label",
					items: this.getCategoryDropdownItems(vnode.attrs.data.showPriceCategory),
					selectedValue: vnode.attrs.data.category,
					selectionChangedHandler: (category) => {
						vnode.attrs.data.category = category
					},
					dropdownWidth: 350,
				} satisfies DropDownSelectorAttrs<NumberString | null>),
				// this currently "mocks" the helplabel of the dropdown. We have to take another look once we decide on applying the dropdown styling to the entire app.
				m(".mlr-s.mt-xs", m("small", lang.get("cancellationConfirmation_msg"))),
			],
		)
	}

	private getCategoryDropdownItems(showPriceCategory: boolean) {
		const items = [
			{
				name: lang.get("experienceSamplingAnswer_label"),
				value: null,
			},
			{
				name: lang.get("surveyPrice_label"),
				value: "0",
			},
			{
				name: lang.get("surveyAccountProblems_label"),
				value: "1",
			},
			{
				name: lang.get("surveyMissingFeature_label"),
				value: "2",
			},
			{
				name: lang.get("surveyFeatureDesignProblems_label"),
				value: "3",
			},
			{
				name: lang.get("surveyOtherReason_label"),
				value: "4",
			},
		]
		if (!showPriceCategory) items.splice(1, 1) // remove price category
		return items
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
		return lang.get("survey_label")
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
