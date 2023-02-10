import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../gui/size"
import { Keys } from "../../api/common/TutanotaConstants"
import { TemplatePopupModel } from "../model/TemplatePopupModel"
import { isKeyPressed } from "../../misc/KeyManager"
import type { EmailTemplate } from "../../api/entities/tutanota/TypeRefs.js"
import { TEMPLATE_POPUP_HEIGHT } from "./TemplateConstants.js"

/**
 * TemplateExpander is the right side that is rendered within the Popup. Consists of Dropdown, Content and Button.
 * The Popup handles whether the Expander should be rendered or not, depending on available width-space.
 */
export type TemplateExpanderAttrs = {
	template: EmailTemplate
	model: TemplatePopupModel
}

export class TemplateExpander implements Component<TemplateExpanderAttrs> {
	view({ attrs }: Vnode<TemplateExpanderAttrs>): Children {
		const { model } = attrs
		const selectedContent = model.getSelectedContent()
		return m(
			".flex.flex-column.flex-grow.scroll.ml-s",
			{
				style: {
					// maxHeight has to be set, because otherwise the content would overflow outside the flexbox (-44 because of header height)
					maxHeight: px(TEMPLATE_POPUP_HEIGHT - size.button_height),
				},
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.keyCode, Keys.TAB)) {
						e.preventDefault()
					}
				},
			},
			[m(".text-break.flex-grow.pr.overflow-y-visible", selectedContent ? m.trust(selectedContent.text) : null)],
		)
	}
}
