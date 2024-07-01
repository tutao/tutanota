import { emitWizardEvent, WizardEventType } from "../../../../gui/base/WizardDialog.js"
import m, { Children, Component, Vnode } from "mithril"
import { LoginButton } from "../../../../gui/base/buttons/LoginButton.js"
import { TranslationKey } from "../../../../misc/LanguageViewModel.js"

interface SetupPageLayoutAttrs {
	image: string
	class?: string
	buttonLabel?: TranslationKey
}

export class SetupPageLayout implements Component<SetupPageLayoutAttrs> {
	view({ attrs, children }: Vnode<SetupPageLayoutAttrs>): Children {
		return m("section.center.flex.flex-column.dialog-height-small.mt", [
			m("img.onboarding-logo.center-h", {
				src: `${window.tutao.appState.prefixWithoutFile}/images/onboarding-wizard/${attrs.image}.svg`,
				alt: "",
				rel: "noreferrer",
				loading: "lazy",
				decoding: "async",
				class: attrs.class,
			}),
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
