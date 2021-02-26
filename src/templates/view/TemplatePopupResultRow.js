//@flow
import m from "mithril"
import {TEMPLATE_LIST_ENTRY_HEIGHT} from "./TemplatePopup"
import {px} from "../../gui/size"
import type {EmailTemplate} from "../../api/entities/tutanota/EmailTemplate"
import {TEMPLATE_SHORTCUT_PREFIX} from "../model/TemplatePopupModel"

export type TemplateResultRowAttrs = {
	template: EmailTemplate
}

/**
 *   renders one entry of the list in the template popup
 */

export class TemplatePopupResultRow implements MComponent<TemplateResultRowAttrs> {
	view(vnode: Vnode<TemplateResultRowAttrs>): Children {
		const {title, tag} = vnode.attrs.template
		return m(".flex.flex-column.overflow-hidden.full-width.ml-s", {
			style: {
				height: px(TEMPLATE_LIST_ENTRY_HEIGHT)
			}
		}, [
			// marginLeft 4px because border-radius of tag has margin of 4px
			m(".text-ellipsis", {style: {marginLeft: "4px"}}, title),
			m(".flex.badge-line-height.text-ellipsis", [
				tag
					? m(".small.keyword-bubble-no-padding.pl-s.pr-s.border-radius.no-wrap.small.min-content", TEMPLATE_SHORTCUT_PREFIX
					+ tag.toLowerCase())
					: null,
			]),
		])
	}
}

