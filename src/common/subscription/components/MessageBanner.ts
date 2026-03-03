import m, { Component, Vnode, VnodeDOM } from "mithril"
import { Icon, IconSize } from "../../gui/base/Icon"
import { theme } from "../../gui/theme"
import { Translation } from "../../misc/LanguageViewModel"
import { px } from "../../gui/size"
import { Icons } from "../../gui/base/icons/Icons"

type InfoBannerTypes = "success" | "warning" | "error"
const COLUMN_THRESHOLD = 120
interface MessageBannerAttrs {
	translation: Translation
	type: InfoBannerTypes
}

/* Component for general information on the website
 * For example, if a customer wanted to manage multiple subscriptions with the same Apple ID,
 * this component would be used
 * There are three types of messages banners
 * 1: Success: should be used if a process was successful.
 * It's a green box with a checkmark next to it.
 * 2: Warning: should be used if there is a warning that needs to be shown to the user
 * It's a yellow box with a filled exclamation mark next to it
 * 3: Error: should be used if there is an error during a process
 * It's a red box with a filled cross next to it
 */
export class MessageBanner implements Component<MessageBannerAttrs> {
	private isTall: boolean = false

	onupdate(vnode: VnodeDOM<MessageBannerAttrs>) {
		const { dom } = vnode
		const newTall = dom.getBoundingClientRect().height > COLUMN_THRESHOLD
		if (newTall !== this.isTall) {
			this.isTall = newTall
			m.redraw()
		}
	}
	oncreate(vnode: VnodeDOM<MessageBannerAttrs>) {
		const { dom } = vnode
		this.isTall = dom.getBoundingClientRect().height > COLUMN_THRESHOLD
	}

	view({ attrs: { translation, type } }: Vnode<MessageBannerAttrs>) {
		let background = null
		let color = null
		let icon = null
		if (type === "success") {
			background = theme.success_container
			color = theme.on_success_container
			icon = Icons.CheckCircleFilled
		} else if (type === "warning") {
			background = theme.warning_container
			color = theme.on_warning_container
			icon = Icons.AlertCircle
		} else {
			// type == error
			background = theme.error_container
			color = theme.on_error_container
			icon = Icons.CloseCircleFilled
		}
		const flexDir = this.isTall ? ".col" : ".row"

		return m(
			".flex-start.full-width.gap-4.mb-16.mt-16.p-24.border-radius-12.items-center" + flexDir,
			{
				style: {
					background: background,
					color: color,
					border: `${px(2)} solid ${color}`,
					marginInline: "auto",
				},
			},
			m(Icon, {
				icon,
				size: IconSize.PX24,
				container: "div",
				style: {
					fill: color,
					marginRight: this.isTall ? px(0) : px(16),
				},
			}),
			m(".center.normal-font-size", translation.text),
		)
	}
}
