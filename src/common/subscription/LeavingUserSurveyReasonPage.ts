import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { LeavingUserSurveyData } from "./LeavingUserSurveyWizard.js"
import m, { Vnode, VnodeDOM } from "mithril"
import { DropDownSelector, type DropDownSelectorAttrs, SelectorItem, SelectorItemList } from "../gui/base/DropDownSelector.js"
import { HtmlEditor, HtmlEditorMode } from "../gui/editor/HtmlEditor.js"
import { theme } from "../gui/theme.js"
import { CATEGORY_TO_IMAGE, CATEGORY_TO_REASON, getCategoryType } from "./LeavingUserSurveyConstants.js"
import { lang } from "../misc/LanguageViewModel.js"
import { styles } from "../gui/styles.js"
import { SetupLeavingUserSurveyPage } from "./SetupLeavingUserSurveyPage.js"

export class LeavingUserSurveyReasonPage implements WizardPageN<LeavingUserSurveyData> {
	private _dom: HTMLElement | null = null
	private dropdownItemsFromCategory: SelectorItemList<NumberString | null> = []
	private readonly customReasonEditor: HtmlEditor

	constructor() {
		let NUMBER_OF_EDITOR_LINES = styles.isDesktopLayout() ? 5 : 1
		this.customReasonEditor = new HtmlEditor()
			.setStaticNumberOfLines(NUMBER_OF_EDITOR_LINES)
			.showBorders()
			.setPlaceholderId("enterDetails_msg")
			.setMode(HtmlEditorMode.HTML)
			.setHtmlMonospace(false)
			.setValue("")
	}

	oncreate(vnode: VnodeDOM<WizardPageAttrs<LeavingUserSurveyData>>) {
		this._dom = vnode.dom as HTMLElement
	}

	oninit(vnode: Vnode<WizardPageAttrs<LeavingUserSurveyData>>) {
		this.dropdownItemsFromCategory = this.getDropdownItemsFromCategory(vnode.attrs.data.category!)
		vnode.attrs.data.reason = null
	}

	view(vnode: Vnode<WizardPageAttrs<LeavingUserSurveyData>>) {
		return m(
			SetupLeavingUserSurveyPage,
			{
				closeAction: () => {
					vnode.attrs.data.details = this.customReasonEditor.getValue()
					vnode.attrs.data.submitted = true
					this.closeDialog()
				},
				nextButtonLabel: "submit_action",
				nextButtonEnabled: !vnode.attrs.data.reason,
				image: CATEGORY_TO_IMAGE.get(getCategoryType(vnode.attrs.data.category!))?.image!,
				imageStyle: {
					paddingBottom: "60px",
				},
				mainMessage: CATEGORY_TO_IMAGE.get(getCategoryType(vnode.attrs.data.category!))?.translationKey!,
				secondaryMessage: "surveyReasonSecondaryMessage_label",
			},
			[
				m(DropDownSelector, {
					style: {
						border: `2px solid ${theme.content_border}`,
						borderRadius: "6px",
						padding: "4px 8px",
					},
					doShowBorder: false,
					label: "surveyChooseReason_label",
					items: this.dropdownItemsFromCategory, // will never be null, as it has to be set to access this page
					selectedValue: vnode.attrs.data.reason,
					selectionChangedHandler: (reason) => {
						vnode.attrs.data.reason = reason
					},
					dropdownWidth: 350,
				} satisfies DropDownSelectorAttrs<NumberString | null>),
				m(".pt", m(this.customReasonEditor)),
			],
		)
	}

	closeDialog(): void {
		if (this._dom) {
			emitWizardEvent(this._dom, WizardEventType.CLOSE_DIALOG)
		}
	}

	getDropdownItemsFromCategory(category: NumberString): SelectorItemList<NumberString | null> {
		const categoryType = getCategoryType(category)
		const reasonList = CATEGORY_TO_REASON.get(categoryType)
		const unselected: SelectorItem<string | null>[] = [{ name: lang.get("experienceSamplingAnswer_label"), value: null }]

		if (!reasonList) return []
		return unselected.concat(reasonList.map((r) => ({ name: lang.get(r.translationKey), value: r.value })))
	}
}
