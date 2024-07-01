import m, { Children, Component, Vnode } from "mithril"
import { px } from "../../../common/gui/size"
import type { EmailTemplate } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { TEMPLATE_SHORTCUT_PREFIX } from "../model/TemplatePopupModel.js"
import { TEMPLATE_LIST_ENTRY_HEIGHT } from "./TemplateConstants.js"

export type TemplateResultRowAttrs = {
	template: EmailTemplate
}

/**
 *   renders one entry of the list in the template popup
 */
export class TemplatePopupResultRow implements Component<TemplateResultRowAttrs> {
	view(vnode: Vnode<TemplateResultRowAttrs>): Children {
		const { title, tag } = vnode.attrs.template
		return m(
			".flex.flex-column.overflow-hidden.full-width.ml-s",
			{
				style: {
					height: px(TEMPLATE_LIST_ENTRY_HEIGHT),
				},
				// this title is for the hover text
				title: title,
			},
			[
				// marginLeft 4px because border-radius of tag has margin of 4px
				m(
					".text-ellipsis.smaller",
					{
						style: {
							marginLeft: "4px",
						},
					},
					title,
				),
				m(".flex.badge-line-height.text-ellipsis", [
					tag
						? m(".small.keyword-bubble-no-padding.pl-s.pr-s.border-radius.no-wrap.small.min-content", TEMPLATE_SHORTCUT_PREFIX + tag.toLowerCase())
						: null,
				]),
			],
		)
	}
}
