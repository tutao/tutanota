import { emitWizardEvent, WizardEventType } from "../../base/WizardDialog.js"
import m, { Children, Component, Vnode } from "mithril"
import { LoginButton } from "../../base/buttons/LoginButton.js"
import { TranslationKey } from "../../../misc/LanguageViewModel.js"

interface SetupPageLayoutAttrs {
	image: string
	class?: string
	buttonLabel?: TranslationKey
}

export class SetupPageLayout implements Component<SetupPageLayoutAttrs> {
	view({ attrs, children }: Vnode<SetupPageLayoutAttrs>): Children {
		return m("section.center.flex.flex-column.dialog-height-small.mt", [
			// Sanitizing the images removes the classes from the svg for unknown reasons
			// So the svg is used raw for now
			m(".onboarding-logo.center-h", { class: attrs.class }, m.trust(attrs.image)),
			children,
			m(LoginButton, {
				label: attrs.buttonLabel ?? "next_action",
				class: "wizard-next-button",
				onclick: (_, dom) => {
					emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
				},
			}),
		])
	}
}
