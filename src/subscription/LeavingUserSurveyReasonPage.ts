import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { LeavingUserSurveyData } from "./LeavingUserSurveyWizard.js"
import m, { Vnode, VnodeDOM } from "mithril"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { DropDownSelector, type DropDownSelectorAttrs, SelectorItemList } from "../gui/base/DropDownSelector.js"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { HtmlEditor, HtmlEditorMode } from "../gui/editor/HtmlEditor.js"

export const enum CategoryType {
	Price = "0",
	Account = "1",
	Feature = "2",
	Problem = "3",
	Other = "4",
}

export type Reason = {
	value: NumberString
	name: TranslationKey | string
}

export class LeavingUserSurveyReasonPage implements WizardPageN<LeavingUserSurveyData> {
	private _dom: HTMLElement | null = null
	private categoryToReason: Map<CategoryType, Reason[]> = new Map()
	private dropdownItemsFromCategory: SelectorItemList<NumberString> = []
	private readonly customReasonEditor: HtmlEditor

	constructor() {
		this.customReasonEditor = new HtmlEditor()
			.setMinHeight(120)
			.showBorders()
			.setPlaceholderId("invoiceAddress_label")
			.setMode(HtmlEditorMode.HTML)
			.setHtmlMonospace(false)
			.setValue("")
	}

	oncreate(vnode: VnodeDOM<WizardPageAttrs<LeavingUserSurveyData>>) {
		this._dom = vnode.dom as HTMLElement
	}

	oninit(vnode: Vnode<WizardPageAttrs<LeavingUserSurveyData>>) {
		this.categoryToReason = this.initCategoryToReason()
		this.dropdownItemsFromCategory = this.getDropdownItemsFromCategory(vnode.attrs.data.category!)
		vnode.attrs.data.reason = this.dropdownItemsFromCategory[0].value
	}

	view(vnode: Vnode<WizardPageAttrs<LeavingUserSurveyData>>) {
		return m("#leaving-user-survey-dialog.pt", [
			m(DropDownSelector, {
				label: () => lang.get("whyLeave_msg"),
				items: this.dropdownItemsFromCategory, // will never be null, as it has to be set to access this page
				selectedValue: vnode.attrs.data.reason,
				selectionChangedHandler: (reason) => {
					vnode.attrs.data.reason = reason
				},
				dropdownWidth: 350,
			} satisfies DropDownSelectorAttrs<NumberString | null>),
			m(".pt", m(this.customReasonEditor)),
			m(
				".flex-center.full-width.pt-l",
				m(
					"",
					{
						style: {
							width: "260px",
						},
					},
					m(LoginButton, {
						label: () => "Submit",
						onclick: () => {
							vnode.attrs.data.details = this.customReasonEditor.getValue()
							this.closeDialog()
						},
					}),
				),
			),
		])
	}

	closeDialog(): void {
		if (this._dom) {
			emitWizardEvent(this._dom, WizardEventType.CLOSE_DIALOG)
		}
	}

	initCategoryToReason(): Map<CategoryType, Reason[]> {
		return new Map([
			[
				CategoryType.Price,
				[
					{ value: "0", name: "I don't need the paid features" },
					{ value: "1", name: "Too expensive, but I want to support Tuta" },
					{ value: "2", name: "The new prices are too high" },
					{ value: "3", name: "I can only afford a student discount" },
					{ value: "4", name: "I can only afford a family discount" },
					{ value: "5", name: "The auto-renewal is annoying" },
					{ value: "6", name: "My payment is not working" },
					{ value: "7", name: "Other reason" },
				],
			],
			[
				CategoryType.Account,
				[
					{ value: "8", name: "The account approval takes too long" },
					{ value: "9", name: "The support couldn't solve my problem" },
					{ value: "10", name: "I forgot my password." },
					{ value: "11", name: "I forgot my recovery code" },
					{ value: "12", name: "I can't add more users" },
					{ value: "13", name: "I can't signup at another service with my Tuta address" },
					{ value: "14", name: "My account has been blocked for no reason" },
					{ value: "15", name: "Other reason" },
				],
			],
			[
				CategoryType.Feature,
				[
					{ value: "16", name: "IMAP" },
					{ value: "17", name: "Email import" },
					{ value: "18", name: "Adjustable columns" },
					{ value: "19", name: "Labels" },
					{ value: "20", name: "More formatting options" },
					{ value: "21", name: "Auto forward for emails" },
					{ value: "22", name: "Cloud storage / Drive" },
					{ value: "23", name: "Email translations" },
					{ value: "24", name: "Other missing feature" },
				],
			],
			[
				CategoryType.Problem,
				[
					{ value: "25", name: "Search" },
					{ value: "26", name: "Calendar" },
					{ value: "27", name: "Theme customization" },
					{ value: "28", name: "Spam protection" },
					{ value: "29", name: "I don't like how the app looks" },
					{ value: "30", name: "Too hard to use. (specify details below)" },
				],
			],
			[
				CategoryType.Other,
				[
					{ value: "31", name: "I picked the wrong email address" },
					{ value: "32", name: "I want to merge accounts" },
					{ value: "33", name: "Specify reason below" },
				],
			],
		])
	}

	getDropdownItemsFromCategory(category: NumberString): SelectorItemList<NumberString> {
		const categoryType: CategoryType = <CategoryType>category

		const reasonList = this.categoryToReason.get(categoryType)
		if (!reasonList) return []
		return reasonList.map((r) => ({ name: r.name, value: r.value }))
	}
}

export class LeavingUserSurveyPageAttrs implements WizardPageAttrs<LeavingUserSurveyData> {
	data: LeavingUserSurveyData

	constructor(leavingUserSurveyData: LeavingUserSurveyData) {
		this.data = leavingUserSurveyData
	}

	headerTitle(): string {
		return `Survey`
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
