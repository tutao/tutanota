import m, { Children, Component, Vnode } from "mithril"
import { LoginButton } from "../../gui/base/buttons/LoginButton"
import { emitWizardEvent, WizardEventType } from "../../gui/base/WizardDialog"
import { Translation } from "../../misc/LanguageViewModel"

export interface KeyVerificationWizardPageAttrs {
	nextButtonLabel?: Translation
	hideNextButton?: boolean
	disableNextButton?: boolean
	beforeNextPageHook?: () => Promise<boolean>
}

export class KeyVerificationWizardPage implements Component<KeyVerificationWizardPageAttrs> {
	view({ attrs, children }: Vnode<KeyVerificationWizardPageAttrs>): Children {
		let nodes: m.Children[] = [children]

		if (!attrs.hideNextButton)
			nodes.push(
				m(LoginButton, {
					label: attrs.nextButtonLabel ?? "next_action",
					class: "wizard-next-button",
					onclick: async (_, dom) => {
						let continueWizard = true
						if (attrs.beforeNextPageHook !== undefined) {
							continueWizard = await attrs.beforeNextPageHook()
						}

						if (continueWizard) {
							emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE)
						}
					},
					disabled: attrs.disableNextButton ?? false,
				}),
			)

		return m("section.flex.flex-column.dialog-height-small.mt", nodes)
	}
}
