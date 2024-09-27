import m, { Children, ClassComponent, Vnode } from "mithril"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils.js"
import { inputLineHeight, px, size } from "../size.js"
import { styles } from "../styles.js"
import { TabIndex } from "../../api/common/TutanotaConstants.js"
import { BootIcons } from "./icons/BootIcons.js"
import { DefaultAnimationTime } from "../animation/Animations.js"
import { Icons } from "./icons/Icons.js"
import { TextFieldType } from "./TextField.js"
import { Icon, IconAttrs, IconSize } from "./Icon.js"
import { theme } from "../theme.js"
import { lang } from "../../misc/LanguageViewModel.js"
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
			".flex-end.items-center.border-radius.plr-s.pt-xs.pb-xs.search-bar.flex-grow.click",
			{
				focused: String(this.isFocused),
				...landmarkAttrs(AriaLandmarks.Search),
				class: getOperatingClasses(attrs.disabled),
				style: {
					"min-height": px(inputLineHeight + 2),
					"margin-top": px(6),
					"margin-bottom": px(6),
					"max-width": styles.isUsingBottomNavigation() ? "" : px(350),
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
							size: IconSize.Medium,
							style: {
								fill: theme.content_button,
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
							label: lang.get(attrs.busy ? "loading_msg" : "close_alt"),
							icon: m(Icon, {
								container: "div",
								size: IconSize.Medium,
								icon: attrs.busy ? BootIcons.Progress : Icons.Close,
								class: "center-h  " + (attrs.busy ? "icon-progress-search icon-progress" : ""),
								style: {
									fill: theme.header_button,
								},
							}),
							onclick: () => {
								if (!attrs.disabled) attrs.onClear?.()
							},
							disabled: attrs.busy,
							style: {
								width: size.icon_size_large,
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
				"line-height": px(inputLineHeight),
			},
		})
	}
}
