import { emitWizardEvent, WizardEventType } from "../../../../gui/base/WizardDialog.js"
import m, { Children, Component, Vnode } from "mithril"
import { PrimaryButton } from "../../../../gui/base/buttons/VariantButtons.js"
import { TranslationKey } from "../../../../misc/LanguageViewModel.js"
import { DynamicColorSvg } from "../../../../gui/base/DynamicColorSvg.js"

interface SetupPageLayoutAttrs {
	image: string
	class?: string
	buttonLabel?: TranslationKey
}

export class SetupPageLayout implements Component<SetupPageLayoutAttrs> {
	view({ attrs, children }: Vnode<SetupPageLayoutAttrs>): Children {
		const imagePath = `${window.tutao.appState.prefixWithoutFile}/${attrs.image}`

		return m("section.center.flex.flex-column.dialog-height-small.mt-16", [
			m(".onboarding-logo.center-h", { class: attrs.class }, m(DynamicColorSvg, { path: imagePath })),
			children,
			m(PrimaryButton, {
				label: attrs.buttonLabel ?? "next_action",
				class: "wizard-next-button",
				onclick: (_, dom) => {
					emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
				},
			}),
		])
	}
}
