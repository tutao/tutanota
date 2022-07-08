import m, {Children, Component, Vnode, VnodeDOM} from "mithril"
import {Icons} from "./icons/Icons"
import type {Editor, Listing, Style} from "../editor/Editor"
import {Alignment} from "../editor/Editor"
import {noOp, numberRange} from "@tutao/tutanota-utils"
import type {ButtonAttrs} from "./Button.js"
import {Button, ButtonColor, ButtonType} from "./Button.js"
import {size} from "../size"
import {attachDropdown} from "./Dropdown.js"
import {lang, TranslationKey} from "../../misc/LanguageViewModel"
import {animations, height, opacity} from "../animation/Animations"
import {client} from "../../misc/ClientDetector"
import {BrowserType} from "../../misc/ClientConstants"

export interface RichTextToolbarAttrs {
	editor: Editor
	imageButtonClickHandler?: ((ev: Event, editor: Editor) => unknown) | null
	alignmentEnabled?: boolean
	fontSizeEnabled?: boolean
	customButtonAttrs?: Array<ButtonAttrs>
}

export class RichTextToolbar implements Component<RichTextToolbarAttrs> {
	selectedSize = size.font_size_base

	oncreate(vnode: VnodeDOM<any>): void {
		const dom = vnode.dom as HTMLElement
		dom.style.height = "0"
		animateToolbar(dom, true)
	}

	onbeforeremove(vnode: VnodeDOM<any>): Promise<void> {
		return animateToolbar(vnode.dom as HTMLElement, false)
	}

	view({attrs}: Vnode<RichTextToolbarAttrs>): Children {

		try {
			this.selectedSize = parseInt(attrs.editor.squire.getFontInfo().size.slice(0, -2))
		} catch (e) {
			this.selectedSize = size.font_size_base
		}

		return m(".elevated-bg.overflow-hidden",
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
				m(".flex-end.wrap",
					this.renderStyleButtons(attrs),
					this.renderCustomButtons(attrs),
					this.renderAlignDropDown(attrs),
					this.renderSizeButtons(attrs),
					this.renderRemoveFormattingButton(attrs)
				),
			],
		)
	}

	private renderStyleButtons(attrs: RichTextToolbarAttrs): Children {
		const {
			editor,
			imageButtonClickHandler
		} = attrs

		return [
			this.renderStyleToggleButton("b", lang.get("formatTextBold_msg") + " (Ctrl + B)", Icons.Bold, editor),
			this.renderStyleToggleButton("i", lang.get("formatTextItalic_msg") + " (Ctrl + I)", Icons.Italic, editor),
			this.renderStyleToggleButton("u", lang.get("formatTextUnderline_msg") + " (Ctrl + U)", Icons.Underline, editor),
			this.renderStyleToggleButton("c", "formatTextMonospace_msg", Icons.Code, editor),
			this.renderListToggleButton("ol", lang.get("formatTextOl_msg") + " (Ctrl + Shift + 9)", Icons.ListOrdered, editor),
			this.renderListToggleButton("ul", lang.get("formatTextUl_msg") + " (Ctrl + Shift + 8)", Icons.ListUnordered, editor),
			imageButtonClickHandler
				? m(Button, {
					label: "emptyString_msg",
					title: "insertImage_action",
					click: ev => imageButtonClickHandler(ev, editor),
					type: ButtonType.Toggle,
					icon: () => Icons.Picture,
					colors: ButtonColor.Elevated,
				})
				: null
		]
	}

	private renderStyleToggleButton(style: Style, title: string, icon: Icons, editor: Editor): Children {
		return this.renderToggleButton(
			title,
			icon,
			() => editor.setStyle(!editor.hasStyle(style), style),
			() => editor.hasStyle(style)
		)
	}

	private renderListToggleButton(listing: Listing, title: string, icon: Icons, editor: Editor): Children {
		return this.renderToggleButton(
			title,
			icon,
			() => editor.styles.listing === listing
				? editor.squire.removeList()
				: listing === "ul" ? editor.squire.makeUnorderedList() : editor.squire.makeOrderedList(),
			() => editor.styles.listing === listing
		)
	}

	private renderToggleButton(
		title: string,
		icon: Icons,
		click: () => void,
		isSelected: () => boolean,
	): Children {
		return m(Button, {
			label: "emptyString_msg",
			title: () => title,
			click,
			icon: () => icon,
			type: ButtonType.Toggle,
			noBubble: true,
			isSelected,
			colors: ButtonColor.Elevated,
		})
	}

	private renderCustomButtons(attrs: RichTextToolbarAttrs): Children {
		return (attrs.customButtonAttrs ?? []).map(attrs => m(Button, attrs))
	}

	private renderAlignDropDown(attrs: RichTextToolbarAttrs): Children {
		if (attrs.alignmentEnabled === false) {
			return null
		}

		const alignButtonAttrs = (alignment: Alignment, title: TranslationKey, icon: Icons): ButtonAttrs => {
			return {
				label: "emptyString_msg",
				title: title,
				click: () => {
					attrs.editor.squire.setTextAlignment(alignment)
					setTimeout(() => attrs.editor.squire.focus(), 100) // blur for the editor is fired after the handler for some reason
					m.redraw()
				},
				icon: () => icon,
				type: ButtonType.Toggle,
				isSelected: () => false,
				colors: ButtonColor.Elevated,
			}
		}

		return m(Button, attachDropdown({
			mainButtonAttrs: {
				label: () => "▼",
				title: "formatTextAlignment_msg",
				icon: () => {
					switch (attrs.editor.styles.alignment) {
						case "left":
							return Icons.AlignLeft

						case "center":
							return Icons.AlignCenter

						case "right":
							return Icons.AlignRight

						case "justify":
							return Icons.AlignJustified
					}
				},
				type: ButtonType.Toggle,
				noBubble: true,
				colors: ButtonColor.Elevated,
			},
			childAttrs: () => [
				alignButtonAttrs("left", "formatTextLeft_msg", Icons.AlignLeft),
				alignButtonAttrs("center", "formatTextCenter_msg", Icons.AlignCenter),
				alignButtonAttrs("right", "formatTextRight_msg", Icons.AlignRight),
				alignButtonAttrs("justify", "formatTextJustify_msg", Icons.AlignJustified),
			],
			showDropdown: () => true,
			width: 2 * size.hpad_large + size.button_height
		}))
	}

	private renderSizeButtons({editor}: RichTextToolbarAttrs): Children {
		return m(Button, attachDropdown({
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
		}))
	}

	private renderRemoveFormattingButton(attrs: RichTextToolbarAttrs): Children {
		if (attrs.fontSizeEnabled === false) {
			return null
		}

		return m(Button, {
				label: "emptyString_msg",
				title: "removeFormatting_action",
				icon: () => Icons.Cancel,
				type: ButtonType.Toggle,
				click: () => attrs.editor.squire.removeAllFormatting(),
				noBubble: true,
				colors: ButtonColor.Elevated,
			}
		)
	}
}

export function animateToolbar(dom: HTMLElement, appear: boolean): Promise<void> {
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