import m, { Component, Vnode } from "mithril"
import { Icon, IconSize } from "../../gui/base/Icon"
import { theme } from "../../gui/theme"
import { Translation } from "../../misc/LanguageViewModel"
import { px } from "../../gui/size"
import { Icons } from "../../gui/base/icons/Icons"
import { client } from "../../misc/ClientDetector"

type InfoBannerTypes = "success" | "warning" | "error"

interface InfoBannerAttrs {
	translation: Translation
	type: InfoBannerTypes
}

export class InfoBanner implements Component<InfoBannerAttrs> {
	view({ attrs: { translation, type } }: Vnode<InfoBannerAttrs>) {
		const isMobileDevice = client.isMobileDevice()
		let width = isMobileDevice ? px(320) : px(669)
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
			icon = Icons.ExclamationMark
		} else if (type === "error") {
			background = theme.error_container
			color = theme.on_error_container
			icon = Icons.CloseCircleFilled
		}
		return m(
			".flex-start.items-start.gap-4.mb-16.mt-16",
			{
				style: {
					background: background,
					color: color,
					border: `${px(2)} solid ${color}`,
					borderRadius: px(12),
					padding: px(24),
					marginInline: "auto",
					width: "100%",
					maxWidth: width,
					display: "flex",
					alignItems: "center",
				},
			},
			icon &&
				m(Icon, {
					icon,
					size: IconSize.PX24,
					container: "div",
					style: { fill: color, marginRight: px(16) },
				}),
			m(".center", { style: { fontSize: px(16) } }, translation.text),
		)
	}
}
