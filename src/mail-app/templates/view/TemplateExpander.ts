import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../../common/gui/size"
import { Keys } from "../../../common/api/common/TutanotaConstants"
import { TemplatePopupModel } from "../model/TemplatePopupModel.js"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import type { EmailTemplate } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { TEMPLATE_POPUP_HEIGHT } from "./TemplateConstants.js"
import { memoized } from "@tutao/tutanota-utils"
import { htmlSanitizer } from "../../../common/misc/HtmlSanitizer.js"
import { theme } from "../../../common/gui/theme.js"

/**
 * TemplateExpander is the right side that is rendered within the Popup. Consists of Dropdown, Content and Button.
 * The Popup handles whether the Expander should be rendered or not, depending on available width-space.
 */
export type TemplateExpanderAttrs = {
	template: EmailTemplate
	model: TemplatePopupModel
}

export class TemplateExpander implements Component<TemplateExpanderAttrs> {
	private readonly sanitizedText = memoized(
		(text: string) =>
			htmlSanitizer.sanitizeHTML(text, {
				blockExternalContent: false,
				allowRelativeLinks: true,
			}).html,
	)

	view({ attrs }: Vnode<TemplateExpanderAttrs>): Children {
		const { model, template } = attrs
		const selectedContent = model.getSelectedContent()
		return m(
			".flex.flex-column.flex-grow.scroll.ml-s",
			{
				style: {
					// maxHeight has to be set, because otherwise the content would overflow outside the flexbox (-44 because of header height)
					maxHeight: px(TEMPLATE_POPUP_HEIGHT - size.button_height),
				},
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.TAB)) {
						e.preventDefault()
					}
				},
			},
			[
				m(
					".text-break.smaller.b.text-center",
					{
						style: {
							"border-bottom": `1px solid ${theme.content_border}`,
						},
					},
					template.title,
				),
				m(".text-break.flex-grow.pr.overflow-y-visible.pt", selectedContent ? m.trust(this.sanitizedText(selectedContent.text)) : null),
			],
		)
	}
}
