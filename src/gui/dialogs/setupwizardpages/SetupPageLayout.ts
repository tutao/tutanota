import { emitWizardEvent, WizardEventType } from "../../base/WizardDialog.js"
import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon } from "../../base/Icon.js"
import { LoginButton } from "../../base/buttons/LoginButton.js"

interface SetupPageLayoutAttrs {
	icon: AllIcons
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
				label: "next_action",
				class: "wizard-next-button",
				onclick: (_, dom) => {
					emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
				},
			}),
		])
	}
}
