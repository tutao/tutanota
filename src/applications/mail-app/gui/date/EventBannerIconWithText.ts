import { AllIcons, Icon, IconSize } from "../../../../ui/base/Icon"
import m, { Children, ClassComponent, Vnode } from "mithril"
import { theme } from "../../../../ui/theme"
import { px, size } from "../../../../ui/size"

export enum EventBannerTextVariant {
	Normal,
	Large,
}

export enum EventBannerIconVariant {
	Neutral,
	Success,
	Warning,
	Error,
}

export type EventBannerIconWithTextAttrs = {
	icon: AllIcons
	text: string
	textVariant?: EventBannerTextVariant
	iconVariant?: EventBannerIconVariant
}

export class EventBannerIconWithText implements ClassComponent<EventBannerIconWithTextAttrs> {
	public view(vnode: Vnode<EventBannerIconWithTextAttrs>): Children {
		const { icon, text } = vnode.attrs
		const textVariant = vnode.attrs.textVariant || EventBannerTextVariant.Normal
		const iconVariant = vnode.attrs.iconVariant || EventBannerIconVariant.Neutral

		return m(".flex", [
			m(Icon, {
				icon: icon,
				container: "div",
				class: "mr-4",
				style: { fill: this.getIconFillColor(iconVariant) },
				size: IconSize.PX24,
			}),

			m(
				"span.text-ellipsis-multi-line" + this.getTextVariantClasses(textVariant),
				{
					style: {
						// Use line height 24px in order to align the text with the icon which also has 24px size.
						// This ensures that the first line also is aligned with the icon when there is a long multi line text.
						lineHeight: px(size.core_24),
					},
				},
				text,
			),
		])
	}

	private getTextVariantClasses(textVariant: EventBannerTextVariant) {
		switch (textVariant) {
			case EventBannerTextVariant.Normal:
				return ""
			case EventBannerTextVariant.Large:
				return ".h5.b"
		}
	}

	private getIconFillColor(iconState: EventBannerIconVariant) {
		switch (iconState) {
			case EventBannerIconVariant.Neutral:
				return theme.on_surface
			case EventBannerIconVariant.Success:
				return theme.success
			case EventBannerIconVariant.Warning:
				return theme.warning
			case EventBannerIconVariant.Error:
				return theme.error
		}
	}
}
