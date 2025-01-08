import { DialogType } from "../gui/base/Dialog"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { assertMainOrNode } from "../api/common/Env"
import { LoginController } from "../api/main/LoginController.js"
import { createWizardDialog, emitWizardEvent, WizardEventType, WizardPageAttrs, wizardPageWrapper } from "../gui/base/WizardDialog.js"
import { SupportLandingPage, SupportLandingPageAttrs } from "./supportWizardPages/SupportLandingPage.js"
import { SupportCategoryPage, SupportCategoryPageAttrs } from "./supportWizardPages/SupportCategoryPage.js"
import { SupportTopicPage, SupportTopicPageAttrs } from "./supportWizardPages/SupportTopicPage.js"
import { SectionButton } from "../gui/base/buttons/SectionButton.js"
import Stream from "mithril/stream"
import { ContactSupportPage, ContactSupportPageAttrs } from "./supportWizardPages/ContactSupportPage.js"
import { SupportCategory, SupportData, SupportDataTypeRef, SupportTopic } from "../api/entities/tutanota/TypeRefs.js"
import { theme } from "../gui/theme.js"
import { locator } from "../api/main/CommonLocator.js"

assertMainOrNode()

export async function showSupportDialog(logins: LoginController) {
	const data: SupportDialogAttrs = {
		canHaveEmailSupport: logins.isInternalUserLoggedIn() && logins.getUserController().isPaidAccount(),
		shouldDisplayContact: Stream({ value: false, returnTo: null }),
		selectedCategory: Stream<SupportCategory | null>(null),
		selectedTopic: Stream<SupportTopic | null>(null),
		supportData: await locator.entityClient.load(SupportDataTypeRef, "--------1---"),
	}
	const wizardPages = [
		wizardPageWrapper(SupportLandingPage, new SupportLandingPageAttrs(data)),
		wizardPageWrapper(SupportCategoryPage, new SupportCategoryPageAttrs(data)),
		wizardPageWrapper(SupportTopicPage, new SupportTopicPageAttrs(data)),
		wizardPageWrapper(ContactSupportPage, new ContactSupportPageAttrs(data)),
	]

	const wizardBuilder = createWizardDialog(data, wizardPages, async () => {}, DialogType.EditLarge, "close_alt", theme.navigation_bg)
	wizardBuilder.dialog.show()
}

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
