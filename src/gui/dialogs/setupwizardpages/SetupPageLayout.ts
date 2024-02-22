import { emitWizardEvent, WizardEventType } from "../../base/WizardDialog.js"
import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon } from "../../base/Icon.js"
import { LoginButton } from "../../base/buttons/LoginButton.js"
import { TranslationKey } from "../../../misc/LanguageViewModel.js"

interface SetupPageLayoutAttrs {
	icon: AllIcons
	buttonLabel?: TranslationKey
}

export class SetupPageLayout implements Component<SetupPageLayoutAttrs> {
	view({ attrs, children }: Vnode<SetupPageLayoutAttrs>): Children {
		return m("section.full-height.center", [
			m(Icon, {
				icon: attrs.icon,
				class: "icon-xl",
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
