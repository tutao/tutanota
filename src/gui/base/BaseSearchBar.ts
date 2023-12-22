import m, { Children, ClassComponent, Vnode } from "mithril"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils.js"
import { inputLineHeight, px } from "../size.js"
import { styles } from "../styles.js"
import { TabIndex } from "../../api/common/TutanotaConstants.js"
import { BootIcons } from "./icons/BootIcons.js"
import { DefaultAnimationTime } from "../animation/Animations.js"
import { Icons } from "./icons/Icons.js"
import { TextFieldType } from "./TextField.js"
import { IconButton } from "./IconButton.js"
import { ButtonSize } from "./ButtonSize.js"
import { ButtonColor } from "./Button.js"

export interface BaseSearchBarAttrs {
	placeholder?: string | null
	text: string
	busy: boolean
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
			".flex-end.items-center.border-radius.plr-s.pt-xs.pb-xs.search-bar.flex-grow",
			{
				focused: String(this.isFocused),
				...landmarkAttrs(AriaLandmarks.Search),
				style: {
					"min-height": px(inputLineHeight + 2),
					"margin-top": px(6),
					"margin-bottom": px(6),
					"max-width": styles.isUsingBottomNavigation() ? "" : px(350),
				},
				oncreate: ({ dom }) => {
					attrs.onWrapperCreated?.(dom as HTMLElement)
				},
			},
			[
				styles.isDesktopLayout()
					? m(IconButton, {
							tabIndex: TabIndex.Default,
							title: "search_label",
							icon: BootIcons.Search,
							size: ButtonSize.Compact,
							class: "",
							mousedown: (e: MouseEvent) => {
								e.preventDefault()
							},
							click: (e: MouseEvent) => {
								e.preventDefault()
								attrs.onSearchClick?.()
							},
					  })
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
					? m(IconButton, {
							tabIndex: TabIndex.Default,
							title: "close_alt",
							icon: attrs.busy ? BootIcons.Progress : Icons.Close,
							iconClass: attrs.busy ? "icon-progress icon-progress-search" : undefined,
							size: ButtonSize.Compact,
							class: "",
							colors: ButtonColor.Header,
							click: () => attrs.onClear?.(),
					  })
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
