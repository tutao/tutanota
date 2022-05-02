import m, {Children, Component, VnodeDOM} from "mithril"
import {Icons} from "./icons/Icons"
import type {Editor} from "../editor/Editor"
import {noOp, numberRange} from "@tutao/tutanota-utils"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonColor, ButtonN, ButtonType} from "./ButtonN"
import {size} from "../size"
import {attachDropdown, DropdownButtonAttrs} from "./DropdownN"
import {lang} from "../../misc/LanguageViewModel"
import {animations, height, opacity} from "../animation/Animations"
import {client} from "../../misc/ClientDetector"
import {BrowserType} from "../../misc/ClientConstants"

export type Options = {
	imageButtonClickHandler?: ((ev: Event, editor: Editor) => unknown) | null
	alignmentEnabled?: boolean
	fontSizeEnabled?: boolean
	customButtonAttrs?: Array<ButtonAttrs>
}

export class RichTextToolbar implements Component<Options> {
	view: Component["view"]
	selectedSize: number

	constructor(editor: Editor, options?: Options) {
		this.selectedSize = size.font_size_base
		const styleToggleAttrs: Array<ButtonAttrs> = ([
			{
				style: "b",
				title: () => lang.get("formatTextBold_msg") + " (Ctrl + B)",
				icon: Icons.Bold,
			},
			{
				style: "i",
				title: () => lang.get("formatTextItalic_msg") + " (Ctrl + I)",
				icon: Icons.Italic,
			},
			{
				style: "u",
				title: () => lang.get("formatTextUnderline_msg") + " (Ctrl + U)",
				icon: Icons.Underline,
			},
			{
				style: "c",
				title: "formatTextMonospace_msg",
				icon: Icons.Code,
			},
			{
				style: "a",
				title: () => (editor.hasStyle("a") ? lang.get("breakLink_action") : lang.get("makeLink_action")),
				icon: Icons.Link,
			},
		] as const).map(o => ({
			label: "emptyString_msg",
			title: o.title,
			click: () => editor.setStyle(!editor.hasStyle(o.style), o.style),
			icon: () => o.icon,
			type: ButtonType.Toggle,
			noBubble: true,
			isSelected: () => editor.hasStyle(o.style),
			colors: ButtonColor.Elevated,
		}))
		const alignToggleAttrs: Array<ButtonAttrs> = ([
			{
				name: "left",
				title: "formatTextLeft_msg",
				icon: Icons.AlignLeft,
			},
			{
				name: "center",
				title: "formatTextCenter_msg",
				icon: Icons.AlignCenter,
			},
			{
				name: "right",
				title: "formatTextRight_msg",
				icon: Icons.AlignRight,
			},
			{
				name: "justify",
				title: "formatTextJustify_msg",
				icon: Icons.AlignJustified,
			},
		] as const).map(o => ({
			label: "emptyString_msg",
			title: o.title,
			click: () => {
				editor.squire.setTextAlignment(o.name)

				setTimeout(() => editor.squire.focus(), 100) // blur for the editor is fired after the handler for some reason

				m.redraw()
			},
			icon: () => o.icon,
			type: ButtonType.Toggle,
			isSelected: () => false,
			colors: ButtonColor.Elevated,
		}))
		styleToggleAttrs.unshift(
			{
				label: "emptyString_msg",
				title: () => lang.get("formatTextUl_msg") + " (Ctrl + Shift + 8)",
				click: () => {
					if (editor.styles.listing === "ul") {
						editor.squire.removeList()
					} else {
						editor.squire.makeUnorderedList()
					}
				},
				icon: () => Icons.ListUnordered,
				type: ButtonType.Toggle,
				noBubble: true,
				isSelected: () => {
					return editor.styles.listing === "ul"
				},
				colors: ButtonColor.Elevated,
			},
			{
				label: "emptyString_msg",
				title: () => lang.get("formatTextOl_msg") + " (Ctrl + Shift + 9)",
				click: () => {
					if (editor.styles.listing === "ol") {
						editor.squire.removeList()
					} else {
						editor.squire.makeOrderedList()
					}
				},
				icon: () => Icons.ListOrdered,
				type: ButtonType.Toggle,
				noBubble: true,
				isSelected: () => editor.styles.listing === "ol",
				colors: ButtonColor.Elevated,
			},
		)
		const {imageButtonClickHandler, customButtonAttrs, alignmentEnabled, fontSizeEnabled} = options || {}
		const attachHandler = imageButtonClickHandler

		if (attachHandler) {
			styleToggleAttrs.unshift({
				label: "emptyString_msg",
				title: "insertImage_action",
				click: ev => attachHandler(ev, editor),
				type: ButtonType.Toggle,
				icon: () => Icons.Picture,
				colors: ButtonColor.Elevated,
			})
		}

		const buttonAttrs: DropdownButtonAttrs = {
			label: () => "▼",
			title: "formatTextAlignment_msg",
			icon: () => {
				switch (editor.styles.alignment) {
					case "left":
						return Icons.AlignLeft

					case "center":
						return Icons.AlignCenter

					case "right":
						return Icons.AlignRight

					default:
						return Icons.AlignJustified
				}
			},
			type: ButtonType.Toggle,
			noBubble: true,
			colors: ButtonColor.Elevated,

		}
		const alignDropdownAttrs = attachDropdown({
			mainButtonAttrs: buttonAttrs,
			childAttrs: () => alignToggleAttrs,
			showDropdown: () => true,
			width: 2 * size.hpad_large + size.button_height
		})
		const removeFormattingButtonAttrs: ButtonAttrs = {
			label: "emptyString_msg",
			title: "removeFormatting_action",
			icon: () => Icons.Cancel,
			type: ButtonType.Toggle,
			click: () => editor.squire.removeAllFormatting(),
			noBubble: true,
			colors: ButtonColor.Elevated,
		}
		const sizeButtonAttrs = attachDropdown({
			mainButtonAttrs: {
				label: () => "▼",
				title: "formatTextFontSize_msg",
				icon: () => Icons.FontSize,
				type: ButtonType.Toggle,
				click: noOp,
				noBubble: true,
				colors: ButtonColor.Elevated,
			},
			childAttrs: () =>
				numberRange(8, 144).map(n => {
					return {
						label: () => n.toString(),
						type: ButtonType.Dropdown,
						click: () => {
							editor.squire.setFontSize(n)

							this.selectedSize = n
							setTimeout(() => editor.squire.focus(), 100) // blur for the editor is fired after the handler for some reason

							m.redraw()
						},
					}
				})
		})
		const allButtonAttrs: Array<ButtonAttrs> = styleToggleAttrs

		if (customButtonAttrs) {
			allButtonAttrs.push(...customButtonAttrs)
		}

		if (alignmentEnabled == null || alignmentEnabled) {
			allButtonAttrs.push(alignDropdownAttrs)
		}

		if (fontSizeEnabled == null || fontSizeEnabled) {
			allButtonAttrs.push(sizeButtonAttrs)
		}

		allButtonAttrs.push(removeFormattingButtonAttrs)

		this.view = (): Children | null => {
			try {
				this.selectedSize = parseInt(editor.squire.getFontInfo().size.slice(0, -2))
			} catch (e) {
				this.selectedSize = size.font_size_base
			}

			return m(
				".elevated-bg.overflow-hidden",
				{
					style: {
						top: "0px",
						position:
							client.browser === BrowserType.SAFARI
								? client.isMacOS
									? "-webkit-sticky" // safari on macos
									: "inherit" // sticky changes the rendering order on iOS
								: "sticky", // normal browsers
					},
				},
				[
					m(
						".flex-end.wrap",
						allButtonAttrs.map(t => m(ButtonN, t)),
					),
				],
			)
		}
	}

	oncreate(vnode: VnodeDOM<any>): void {
		const dom = vnode.dom as HTMLElement
		dom.style.height = "0"

		this._animate(dom, true)
	}

	onbeforeremove(vnode: VnodeDOM<any>): Promise<void> {
		return this._animate(vnode.dom as HTMLElement, false)
	}

	_animate(dom: HTMLElement, appear: boolean): Promise<any> {
		let childHeight = Array.from(dom.children)
							   .map((domElement) => (domElement as HTMLElement).offsetHeight)
							   .reduce((current: number, previous: number) => Math.max(current, previous), 0)
		return animations
			.add(dom, [height(appear ? 0 : childHeight, appear ? childHeight : 0), appear ? opacity(0, 1, false) : opacity(1, 0, false)])
			.then(() => {
				if (appear) {
					dom.style.height = ""
				}
			})
	}
}