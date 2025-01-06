import { emitWizardEvent, WizardEventType, WizardPageAttrs } from "../../gui/base/WizardDialog.js"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { lang } from "../../misc/LanguageViewModel.js"
import { SupportCategory } from "../../api/entities/tutanota/TypeRefs.js"
import { SectionButton } from "../../gui/base/buttons/SectionButton.js"
import { getLocalisedCategoryName, handleReturnTo, NoSolutionSectionButton, shouldShowPage, SupportDialogAttrs } from "../SupportDialog.js"
import Stream from "mithril/stream"

export class SupportLandingPage implements Component<SupportLandingPageAttrs> {
	private dom: HTMLElement | null = null

	oncreate(vnode: VnodeDOM<SupportLandingPageAttrs>) {
		this.dom = vnode.dom as HTMLElement
		handleReturnTo(vnode.attrs.data.shouldDisplayContact, vnode)
	}

	view(vnode: Vnode<SupportLandingPageAttrs>): Children {
		const {
			data: { canHaveEmailSupport, supportData, shouldDisplayContact, selectedCategory },
		} = vnode.attrs
		return [
			m(".h1.text-center.pt", "Find your answers here"),
			m(
				"p.text-center",
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent feugiat blandit dapibus. Donec placerat hendrerit lacinia. Nullam eros lorem, convallis mattis sapien mattis, ultrices laoreet libero. Nulla facilisi. Sed ac leo eleifend felis lacinia vehicula in a felis. Fusce lorem libero, scelerisque nec convallis et, tempus euismod nunc.",
			),
			this.renderCategories(supportData.categories, selectedCategory, lang.code),
			canHaveEmailSupport
				? m(NoSolutionSectionButton, {
						pageAttrs: vnode.attrs,
						shouldDisplayContact: shouldDisplayContact,
				  })
				: null,
		]
	}

	private renderCategories(categories: SupportCategory[], selectedCategory: Stream<SupportCategory | null>, languageTag: string): Children {
		return m(
			".pb.pt.flex.col.gap-vpad.fit-height.box-content",
			categories.map((category) =>
				m(SectionButton, {
					text: getLocalisedCategoryName(category, languageTag),
					onclick: () => {
						selectedCategory(category)
						emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
					},
				}),
			),
		)
	}
}

export class SupportLandingPageAttrs implements WizardPageAttrs<SupportDialogAttrs> {
	readonly hideAllPagingButtons = true

	constructor(readonly data: SupportDialogAttrs) {}

	headerTitle(): string {
		return lang.get("supportMenu_label")
	}

	isEnabled(): boolean {
		return shouldShowPage(this.data.shouldDisplayContact(), this)
	}

	isSkipAvailable(): boolean {
		return false
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		return Promise.resolve(true)
	}
}
