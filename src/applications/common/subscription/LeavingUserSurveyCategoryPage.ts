import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../../../ui/base/WizardDialog.js"
import { LeavingUserSurveyData } from "./LeavingUserSurveyWizard.js"
import m, { Vnode, VnodeDOM } from "mithril"
import { lang, type TranslationKey } from "../../../ui/utils/LanguageViewModel.js"
import { SetupLeavingUserSurveyPage } from "./SetupLeavingUserSurveyPage.js"
import { RadioSelector, RadioSelectorAttrs } from "../../../ui/base/RadioSelector"

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
				skipAction: () => this.closeDialog(),
				nextButtonLabel: "next_action",
				nextButtonEnabled: Boolean(vnode.attrs.data.category),
				image: "main",
				mainMessage: "surveyMainMessageDelete_label",
				secondaryMessage: vnode.attrs.data.showDowngradeMessage ? "surveySecondaryMessageDowngrade_label" : "surveySecondaryMessageDelete_label",
			},
			[
				m(RadioSelector, {
					groupName: "surveyUnhappy_label",
					options: this.getCategoryItems(vnode.attrs.data.showPriceCategory),
					selectedOption: vnode.attrs.data.category,
					onOptionSelected: (category) => {
						vnode.attrs.data.category = category
					},
					compact: true,
				} satisfies RadioSelectorAttrs<NumberString | null>),
			],
		)
	}
	private closeDialog(): void {
		if (this._dom) {
			emitWizardEvent(this._dom, WizardEventType.CLOSE_DIALOG)
		}
	}

	private getCategoryItems(showPriceCategory: boolean) {
		const items = [
			{
				name: lang.getTranslation("surveyPrice_label"),
				value: "0",
			},
			{
				name: lang.getTranslation("surveyAccountProblems_label"),
				value: "1",
			},
			{
				name: lang.getTranslation("surveyMissingFeature_label"),
				value: "2",
			},
			{
				name: lang.getTranslation("surveyFeatureDesignProblems_label"),
				value: "3",
			},
			{
				name: lang.getTranslation("surveyOtherReason_label"),
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
	hideAllPagingButtons = true

	constructor(leavingUserSurveyData: LeavingUserSurveyData) {
		this.data = leavingUserSurveyData
	}

	headerTitle(): TranslationKey {
		return "survey_label"
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
