import m, { Component, Vnode, VnodeDOM } from "mithril"
import { AllIcons, Icon, IconSize } from "../../gui/base/Icon"
import { theme } from "../../gui/theme"
import { Translation } from "../../misc/LanguageViewModel"
import { px } from "../../gui/size"
import { Icons } from "../../gui/base/icons/Icons"

type MessageBannerType = "success" | "warning" | "error" | "base"
const COLUMN_THRESHOLD = 120
interface MessageBannerAttrs {
	translation: Translation
	type: MessageBannerType
	icon?: AllIcons
}

function getBannerTheme(type: MessageBannerType): { background: string; color: string; icon: AllIcons } {
	switch (type) {
		case "base":
			return {
				background: theme.surface_container,
				color: theme.on_surface_variant,
				icon: Icons.InfoCircleOutline,
			}
		case "success":
			return {
				background: theme.success_container,
				color: theme.on_success_container,
				icon: Icons.CheckCircleFilled,
			}
		case "warning":
			return {
				background: theme.warning_container,
				color: theme.on_warning_container,
				icon: Icons.AlertCircle,
			}
		case "error":
			return {
				background: theme.error_container,
				color: theme.on_error_container,
				icon: Icons.CloseCircleFilled,
			}
	}
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

	view({ attrs: { translation, type, icon: customIcon } }: Vnode<MessageBannerAttrs>) {
		const { background, color, icon } = getBannerTheme(type)
		const bannerIcon = customIcon ?? icon
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
				icon: bannerIcon,
				size: IconSize.PX24,
				container: "div",
				style: {
					fill: color,
					marginRight: this.isTall ? px(0) : px(16),
				},
			}),
			m(".left.normal-font-size", translation.text),
		)
	}
}
