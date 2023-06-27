import m, { Children, ClassComponent, Vnode } from "mithril"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils.js"
import { inputLineHeight, px, size } from "../size.js"
import { styles } from "../styles.js"
import { TabIndex } from "../../api/common/TutanotaConstants.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { Icon } from "./Icon.js"
import { BootIcons } from "./icons/BootIcons.js"
import { theme } from "../theme.js"
import { DefaultAnimationTime } from "../animation/Animations.js"
import { Icons } from "./icons/Icons.js"
import { TextFieldType } from "./TextField.js"

export interface BaseSearchBarAttrs {
	placeholder?: string | null
	text: string
	busy: boolean
	onInput: (text: string) => unknown
	onFocus?: () => unknown
	onBlur?: () => unknown
	onSearchClick?: () => unknown
	onClear?: () => unknown
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
					? m(
							"button.click",
							{
								tabindex: TabIndex.Default,
								title: lang.get("search_label"),
								onmousedown: (e: MouseEvent) => {
									e.preventDefault()
								},
								onclick: (e: MouseEvent) => {
									e.preventDefault()
									attrs.onSearchClick?.()
								},
							},
							m(Icon, {
								icon: BootIcons.Search,
								class: "flex-center items-center icon-large",
								style: {
									fill: theme.header_button,
								},
							}),
					  )
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
					[
						this.renderInputField(attrs),
						m(
							"button.closeIconWrapper",
							{
								onclick: () => attrs.onClear?.(),
								style: {
									width: size.icon_size_large,
								},
								title: lang.get("close_alt"),
								tabindex: TabIndex.Default,
							},
							attrs.busy
								? m(Icon, {
										icon: BootIcons.Progress,
										// see comment on icon-progress-search for what is going on with sizes here
										class: "flex-center items-center icon-progress icon-progress-search",
										style: {
											fill: theme.header_button,
										},
								  })
								: attrs.text
								? m(Icon, {
										icon: Icons.Close,
										class: "flex-center items-center icon-large",
										style: {
											fill: theme.header_button,
										},
								  })
								: null,
						),
					],
				),
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
