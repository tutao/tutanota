import m, { Children, ClassComponent, Vnode } from "mithril"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils.js"
import { font_size, px, size } from "../size.js"
import { styles } from "../styles.js"
import { TabIndex } from "../../api/common/TutanotaConstants.js"
import { BootIcons } from "./icons/BootIcons.js"
import { DefaultAnimationTime } from "../animation/Animations.js"
import { Icons } from "./icons/Icons.js"
import { TextFieldType } from "./TextField.js"
import { Icon, IconAttrs, IconSize } from "./Icon.js"
import { theme } from "../theme.js"
import { BaseButton, BaseButtonAttrs } from "./buttons/BaseButton.js"
import { getOperatingClasses } from "./GuiUtils.js"

export interface BaseSearchBarAttrs {
	placeholder?: string | null
	text: string
	busy: boolean
	disabled?: boolean
	onInput: (text: string) => unknown
	onFocus?: () => unknown
	onBlur?: () => unknown
	onSearchClick?: () => unknown
	onClear?: () => unknown
	onInputCreated?: (dom: HTMLElement) => unknown
	onWrapperCreated?: (dom: HTMLElement) => unknown
	onKeyDown?: (keyboardEvent: KeyboardEvent) => unknown
}

export class BaseSearchBar implements ClassComponent<BaseSearchBarAttrs> {
	private domInput!: HTMLInputElement
	private isFocused: boolean = false

	view({ attrs }: Vnode<BaseSearchBarAttrs>) {
		return m(
			".flex-end.items-center.border-radius.plr-4.pt-4.pb-4.search-bar.flex-grow.click",
			{
				focused: String(this.isFocused),
				...landmarkAttrs(AriaLandmarks.Search),
				class: getOperatingClasses(attrs.disabled),
				style: {
					"min-height": px(font_size.line_height_input + 2),
					"margin-top": px(6),
					"margin-bottom": px(6),
				},
				oncreate: ({ dom }) => {
					attrs.onWrapperCreated?.(dom as HTMLElement)
				},
				onclick: () => {
					if (!attrs.disabled) {
						this.domInput?.focus()
						attrs.onSearchClick?.()
					}
				},
			},
			[
				styles.isDesktopLayout()
					? m(Icon, {
							icon: BootIcons.Search,
							size: IconSize.PX24,
							style: {
								fill: theme.on_surface_variant,
							},
						} satisfies IconAttrs)
					: null,
				m(
					".flex.items-center",
					{
						style: {
							width: "100%",
							transition: `width ${DefaultAnimationTime}ms`,
							"padding-left": styles.isDesktopLayout() ? px(10) : px(6),
							"padding-top": "3px",
							"padding-bottom": "3px",
							"overflow-x": "hidden",
						},
					},
					[this.renderInputField(attrs)],
				),
				attrs.busy || attrs.text
					? m(BaseButton, {
							label: attrs.busy ? "loading_msg" : "close_alt",
							icon: m(Icon, {
								container: "div",
								size: IconSize.PX24,
								icon: attrs.busy ? BootIcons.Progress : Icons.Close,
								class: "center-h  " + (attrs.busy ? "icon-progress-search icon-progress" : ""),
								style: {
									fill: theme.on_surface_variant,
								},
							}),
							onclick: () => {
								if (!attrs.disabled) attrs.onClear?.()
							},
							disabled: attrs.busy,
							style: {
								width: size.icon_24,
							},
						} satisfies BaseButtonAttrs)
					: null,
			],
		)
	}

	private renderInputField(attrs: BaseSearchBarAttrs): Children {
		return m("input.input.input-no-clear", {
			"aria-autocomplete": "list",
			tabindex: TabIndex.Default,
			role: "combobox",
			placeholder: attrs.placeholder,
			type: TextFieldType.Text,
			value: attrs.text,
			disabled: attrs.disabled,
			oncreate: (vnode) => {
				this.domInput = vnode.dom as HTMLInputElement
				attrs.onInputCreated?.(this.domInput)
			},
			onfocus: () => {
				this.isFocused = true

				attrs.onFocus?.()
			},
			onblur: () => {
				this.isFocused = false
				attrs.onBlur?.()
			},
			onremove: () => {
				this.domInput.onblur = null
				this.isFocused = false
			},
			oninput: () => {
				attrs.onInput(this.domInput.value)
			},
			onkeydown: (e: KeyboardEvent) => {
				attrs.onKeyDown?.(e)
			},
			style: {
				"line-height": px(font_size.line_height_input),
			},
		})
	}
}
