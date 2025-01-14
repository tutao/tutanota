import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { assertMainOrNode } from "../api/common/Env"
import { LoginController } from "../api/main/LoginController.js"
import { emitWizardEvent, WizardEventType, WizardPageAttrs } from "../gui/base/WizardDialog.js"
import { SectionButton } from "../gui/base/buttons/SectionButton.js"
import Stream from "mithril/stream"
import { SupportCategory, SupportData, SupportTopic } from "../api/entities/tutanota/TypeRefs.js"
import { MultiPageDialog, TransitionTo } from "../gui/dialogs/MultiPageDialog.js"
import { Dialog } from "../gui/base/Dialog.js"
import { ButtonAttrs, ButtonType } from "../gui/base/Button.js"
import { Thunk } from "@tutao/tutanota-utils"

assertMainOrNode()

enum ExamplePages {
	ROOT,
	SECOND,
	THIRD,
}

export async function showSupportDialog(logins: LoginController) {
	const multiPageDialog = new MultiPageDialog<ExamplePages>(ExamplePages.ROOT)

	function renderContent(currentPage: Stream<ExamplePages>, transitionTo: (newPage: ExamplePages) => void) {
		// console.log("##### currentPage() in consumer ######", currentPage())
		if (currentPage() === ExamplePages.ROOT) {
			return m("h1", "aaa AAAA aaa")
		}
		if (currentPage() === ExamplePages.SECOND) {
			return m("h1", "bbb BBBB bbb")
		}

		if (currentPage() === ExamplePages.THIRD) {
			return m("h1", "ccc CCCC ccc")
		}

		throw new Error("unsupported page")
	}

	function renderLeft(currentPage: Stream<ExamplePages>, dialog: Dialog, transitionTo: TransitionTo<ExamplePages>, goBack: Thunk): ButtonAttrs[] {
		if (currentPage() === ExamplePages.ROOT) {
			return [
				{
					type: ButtonType.Secondary,
					click: () => {
						dialog.close()
					},
					label: () => "Close",
				},
			]
		}
		if (currentPage() === ExamplePages.SECOND) {
			return [
				{
					type: ButtonType.Secondary,
					click: () => {
						goBack()
					},
					label: () => "Back",
				},
			]
		}

		if (currentPage() === ExamplePages.THIRD) {
			return [
				{
					type: ButtonType.Secondary,
					click: () => {
						goBack()
					},
					label: () => "Back",
				},
			]
		}

		throw new Error("unsupported page")
	}

	function renderRight(currentPage: Stream<ExamplePages>, dialog: Dialog, transitionTo: TransitionTo<ExamplePages>) {
		if (currentPage() === ExamplePages.ROOT) {
			return [
				{
					type: ButtonType.Secondary,
					click: () => {
						transitionTo(ExamplePages.SECOND)
					},
					label: () => "Next",
				},
			]
		}
		if (currentPage() === ExamplePages.SECOND) {
			return [
				{
					type: ButtonType.Secondary,
					click: () => {
						transitionTo(ExamplePages.THIRD)
					},
					label: () => "Next to third",
				},
			]
		}

		return []
	}

	function renderHeading(currentPage: Stream<ExamplePages>) {
		const strings = Object.keys(ExamplePages)
		return strings[currentPage()]
	}

	multiPageDialog.buildDialog(renderContent, renderLeft, renderRight, renderHeading).show()
}

// export async function showSupportDialog(logins: LoginController) {
// 	const data: SupportDialogAttrs = {
// 		canHaveEmailSupport: logins.isInternalUserLoggedIn() && logins.getUserController().isPaidAccount(),
// 		shouldDisplayContact: Stream({ value: false, returnTo: null }),
// 		selectedCategory: Stream<SupportCategory | null>(null),
// 		selectedTopic: Stream<SupportTopic | null>(null),
// 		supportData: await locator.entityClient.load(SupportDataTypeRef, "--------1---"),
// 	}
// 	const wizardPages = [
// 		wizardPageWrapper(SupportLandingPage, new SupportLandingPageAttrs(data)),
// 		wizardPageWrapper(SupportCategoryPage, new SupportCategoryPageAttrs(data)),
// 		wizardPageWrapper(SupportTopicPage, new SupportTopicPageAttrs(data)),
// 		wizardPageWrapper(ContactSupportPage, new ContactSupportPageAttrs(data)),
// 	]
//
// 	const wizardBuilder = createWizardDialog(data, wizardPages, async () => {}, DialogType.EditMedium, "close_alt", theme.navigation_bg)
// 	wizardBuilder.dialog.show()
// }

export interface SupportDialogAttrs {
	canHaveEmailSupport: boolean
	shouldDisplayContact: Stream<{ value: boolean; returnTo: WizardPageAttrs<any> | null }>
	selectedCategory: Stream<SupportCategory | null>
	selectedTopic: Stream<SupportTopic | null>
	supportData: SupportData
}

export type NoSolutionSectionButtonAttrs = {
	shouldDisplayContact: Stream<{ value: boolean; returnTo: WizardPageAttrs<any> | null }>
	pageAttrs: WizardPageAttrs<any>
}

export class NoSolutionSectionButton implements Component<NoSolutionSectionButtonAttrs> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<NoSolutionSectionButtonAttrs>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<NoSolutionSectionButtonAttrs>): Children {
		return m(SectionButton, {
			text: "Other",
			onclick: () => {
				vnode.attrs.shouldDisplayContact({ value: true, returnTo: vnode.attrs.pageAttrs })
				emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
			},
		})
	}
}

// Resets `shouldDisplayContact` if the current page is the `returnTo` page
export function handleReturnTo(shouldDisplayContact: Stream<{ value: boolean; returnTo: WizardPageAttrs<any> | null }>, vnode: Vnode) {
	if (shouldDisplayContact().value && shouldDisplayContact().returnTo === vnode.attrs) {
		shouldDisplayContact({ value: false, returnTo: null })
	}
}

// Determines whether the current page should be shown when navigating to the contact page
export function shouldShowPage(shouldDisplayContact: { value: boolean; returnTo: WizardPageAttrs<any> | null }, pageAttrs: WizardPageAttrs<any>): boolean {
	const isReturningHere = shouldDisplayContact.returnTo === pageAttrs
	return (isReturningHere && shouldDisplayContact.value) || !shouldDisplayContact.value
}

export function getLocalisedCategoryName(category: SupportCategory, languageTag: string): string {
	return languageTag.includes("de") ? category.nameDE : category.nameEN
}

export function getLocalisedCategoryIntroduction(category: SupportCategory, languageTag: string): string {
	return languageTag.includes("de") ? category.introductionDE : category.introductionEN
}

export function getLocalisedTopicIssue(topic: SupportTopic, languageTag: string): string {
	return languageTag.includes("de") ? topic.issueDE : topic.issueEN
}
