import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { LeavingUserSurveyData } from "./LeavingUserSurveyWizard.js"
import m, { Vnode, VnodeDOM } from "mithril"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { DropDownSelector, type DropDownSelectorAttrs, SelectorItemList } from "../gui/base/DropDownSelector.js"
import { TranslationKey } from "../misc/LanguageViewModel.js"
import { HtmlEditor, HtmlEditorMode } from "../gui/editor/HtmlEditor.js"
import { accountSurveyImage, featureSurveyImage, otherSurveyImage, priceSurveyImage, problemSurveyImage } from "../gui/base/icons/Icons.js"
import { theme } from "../gui/theme.js"

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

export const CATEGORY_TO_IMAGE: Map<CategoryType, { image: string; text: string }> = new Map([
	[CategoryType.Price, { image: priceSurveyImage, text: "Price" }],
	[CategoryType.Account, { image: accountSurveyImage, text: "Problems with account" }],
	[CategoryType.Feature, { image: featureSurveyImage, text: "Missing feature" }],
	[CategoryType.Problem, { image: problemSurveyImage, text: "Problems with feature or design" }],
	[CategoryType.Other, { image: otherSurveyImage, text: "Other reason" }],
])

export class LeavingUserSurveyReasonPage implements WizardPageN<LeavingUserSurveyData> {
	private _dom: HTMLElement | null = null
	private categoryToReason: Map<CategoryType, Reason[]> = new Map()
	private dropdownItemsFromCategory: SelectorItemList<NumberString> = []
	private readonly customReasonEditor: HtmlEditor

	constructor() {
		this.customReasonEditor = new HtmlEditor()
			.setStaticHeight(120)
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
		this.categoryToReason = this.initCategoryToReason()
		this.dropdownItemsFromCategory = this.getDropdownItemsFromCategory(vnode.attrs.data.category!)
		vnode.attrs.data.reason = this.dropdownItemsFromCategory[0].value
	}

	view(vnode: Vnode<WizardPageAttrs<LeavingUserSurveyData>>) {
		return m("#leaving-user-survey-dialog.pt.flex-center", [
			m(".flex.flex-column.max-width-m.pt.pb.plr-l", { style: { minHeight: "800px", minWidth: "450px" } }, [
				m("img.pt.bg-white.pt.pb.block", {
					src: CATEGORY_TO_IMAGE.get(this.getCategoryType(vnode.attrs.data.category!))?.image,
					style: {
						width: "300px",
						height: "250px",
						margin: "20px auto 20px auto",
					},
				}),
				m("h3.center.b", CATEGORY_TO_IMAGE.get(this.getCategoryType(vnode.attrs.data.category!))?.text),
				m(
					"p.center",
					{ style: { height: "45px" } },
					"We would like to address any issue you might have with Tuta. Could you please provide more details?",
				),
				m(DropDownSelector, {
					style: { border: `2px solid ${theme.content_border}`, borderRadius: "6px", padding: "4px 8px" },
					doShowBorder: false,
					label: () => "Choose a reason",
					items: this.dropdownItemsFromCategory, // will never be null, as it has to be set to access this page
					selectedValue: vnode.attrs.data.reason,
					selectionChangedHandler: (reason) => {
						vnode.attrs.data.reason = reason
					},
					dropdownWidth: 350,
				} satisfies DropDownSelectorAttrs<NumberString | null>),
				m(".pt", m(this.customReasonEditor)),
				m(
					".full-width",
					{ style: { margin: "auto 0 0 0" } },
					m(LoginButton, {
						label: () => "Submit",
						onclick: () => {
							vnode.attrs.data.details = this.customReasonEditor.getValue()
							this.closeDialog()
						},
					}),
				),
			]),
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
					{ value: "9", name: "Support couldn't solve my problem" },
					{ value: "10", name: "I forgot my password" },
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
					{ value: "16", name: "No IMAP" },
					{ value: "17", name: "No email import" },
					{ value: "18", name: "Adjustable columns" },
					{ value: "19", name: "No labels for emails" },
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
					{ value: "25", name: "Problems with search" },
					{ value: "26", name: "Problems with calendar" },
					{ value: "27", name: "No theme customization" },
					{ value: "28", name: "Bad spam protection" },
					{ value: "29", name: "I don't like how the app looks" },
					{ value: "30", name: "Too hard to use (specify details below)" },
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
		const categoryType = this.getCategoryType(category)

		const reasonList = this.categoryToReason.get(categoryType)
		if (!reasonList) return []
		return reasonList.map((r) => ({ name: r.name, value: r.value }))
	}

	private getCategoryType(category: NumberString) {
		return <CategoryType>category
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
