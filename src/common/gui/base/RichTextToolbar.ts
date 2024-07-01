import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Icons } from "./icons/Icons"
import type { Editor, Listing, Style } from "../editor/Editor"
import { Alignment } from "../editor/Editor"
import { numberRange } from "@tutao/tutanota-utils"
import { size } from "../size"
import { createDropdown, DropdownButtonAttrs } from "./Dropdown.js"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { animations, height, opacity } from "../animation/Animations"
import { client } from "../../misc/ClientDetector"
import { BrowserType } from "../../misc/ClientConstants"
import { ToggleButton } from "./buttons/ToggleButton.js"
import { IconButton, IconButtonAttrs } from "./IconButton.js"
import { ButtonSize } from "./ButtonSize.js"

export interface RichTextToolbarAttrs {
	editor: Editor
	imageButtonClickHandler?: ((ev: Event, editor: Editor) => unknown) | null
	alignmentEnabled?: boolean
	fontSizeEnabled?: boolean
	customButtonAttrs?: Array<IconButtonAttrs>
}

export class RichTextToolbar implements Component<RichTextToolbarAttrs> {
	selectedSize = size.font_size_base

	constructor({ attrs }: Vnode<RichTextToolbarAttrs>) {
		try {
			this.selectedSize = parseInt(attrs.editor.squire.getFontInfo().size.slice(0, -2))
		} catch (e) {
			this.selectedSize = size.font_size_base
		}
	}

	oncreate(vnode: VnodeDOM<any>): void {
		const dom = vnode.dom as HTMLElement
		dom.style.height = "0"
		animateToolbar(dom, true)
	}

	onbeforeremove(vnode: VnodeDOM<any>): Promise<void> {
		return animateToolbar(vnode.dom as HTMLElement, false)
	}

	view({ attrs }: Vnode<RichTextToolbarAttrs>): Children {
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
					".flex-end.wrap.items-center.mb-xs.mt-xs.ml-between-s",
					this.renderStyleButtons(attrs),
					this.renderCustomButtons(attrs),
					this.renderAlignDropDown(attrs),
					this.renderSizeButtons(attrs),
					this.renderRemoveFormattingButton(attrs),
				),
			],
		)
	}

	private renderStyleButtons(attrs: RichTextToolbarAttrs): Children {
		const { editor, imageButtonClickHandler } = attrs

		return [
			this.renderStyleToggleButton("b", lang.get("formatTextBold_msg") + " (Ctrl + B)", Icons.Bold, editor),
			this.renderStyleToggleButton("i", lang.get("formatTextItalic_msg") + " (Ctrl + I)", Icons.Italic, editor),
			this.renderStyleToggleButton("u", lang.get("formatTextUnderline_msg") + " (Ctrl + U)", Icons.Underline, editor),
			this.renderStyleToggleButton("c", lang.get("formatTextMonospace_msg"), Icons.Code, editor),
			this.renderStyleToggleButton("a", editor.hasStyle("a") ? lang.get("breakLink_action") : lang.get("makeLink_action"), Icons.Link, editor),
			this.renderListToggleButton("ol", lang.get("formatTextOl_msg") + " (Ctrl + Shift + 9)", Icons.ListOrdered, editor),
			this.renderListToggleButton("ul", lang.get("formatTextUl_msg") + " (Ctrl + Shift + 8)", Icons.ListUnordered, editor),
			imageButtonClickHandler
				? m(IconButton, {
						title: "insertImage_action",
						click: (ev) => imageButtonClickHandler(ev, editor),
						icon: Icons.Picture,
						size: ButtonSize.Compact,
				  })
				: null,
		]
	}

	private renderStyleToggleButton(style: Style, title: string, icon: Icons, editor: Editor): Children {
		return this.renderToggleButton(
			title,
			icon,
			() => editor.setStyle(!editor.hasStyle(style), style),
			() => editor.hasStyle(style),
		)
	}

	private renderListToggleButton(listing: Listing, title: string, icon: Icons, editor: Editor): Children {
		return this.renderToggleButton(
			title,
			icon,
			() =>
				editor.styles.listing === listing
					? editor.squire.removeList()
					: listing === "ul"
					? editor.squire.makeUnorderedList()
					: editor.squire.makeOrderedList(),
			() => editor.styles.listing === listing,
		)
	}

	private renderToggleButton(title: string, icon: Icons, click: () => void, isSelected: () => boolean): Children {
		return m(ToggleButton, {
			title: () => title,
			onToggled: click,
			icon: icon,
			toggled: isSelected(),
			size: ButtonSize.Compact,
		})
	}

	private renderCustomButtons(attrs: RichTextToolbarAttrs): Children {
		return (attrs.customButtonAttrs ?? []).map((attrs) => m(IconButton, attrs))
	}

	private renderAlignDropDown(attrs: RichTextToolbarAttrs): Children {
		if (attrs.alignmentEnabled === false) {
			return null
		}

		const alignButtonAttrs = (alignment: Alignment, title: TranslationKey, icon: Icons): DropdownButtonAttrs => {
			return {
				label: title,
				click: () => {
					attrs.editor.squire.setTextAlignment(alignment)
					setTimeout(() => attrs.editor.squire.focus(), 100) // blur for the editor is fired after the handler for some reason
					m.redraw()
				},
				icon: icon,
			}
		}

		return m(IconButton, {
			// label: () => "▼",
			title: "formatTextAlignment_msg",
			icon: this.alignIcon(attrs),
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation()
				createDropdown({
					width: 200,
					lazyButtons: () => [
						alignButtonAttrs("left", "formatTextLeft_msg", Icons.AlignLeft),
						alignButtonAttrs("center", "formatTextCenter_msg", Icons.AlignCenter),
						alignButtonAttrs("right", "formatTextRight_msg", Icons.AlignRight),
						alignButtonAttrs("justify", "formatTextJustify_msg", Icons.AlignJustified),
					],
				})(e, dom)
			},
		})
	}

	private alignIcon(attrs: RichTextToolbarAttrs) {
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
	}

	private renderSizeButtons({ editor }: RichTextToolbarAttrs): Children {
		return m(IconButton, {
			title: "formatTextFontSize_msg",
			icon: Icons.FontSize,
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation()
				createDropdown({
					lazyButtons: () =>
						numberRange(8, 144).map((n) => {
							return {
								label: () => n.toString(),
								click: () => {
									editor.squire.setFontSize(n)
									this.selectedSize = n
									setTimeout(() => editor.squire.focus(), 100) // blur for the editor is fired after the handler for some reason
									m.redraw()
								},
							}
						}),
				})(e, dom)
			},
		})
	}

	private renderRemoveFormattingButton(attrs: RichTextToolbarAttrs): Children {
		if (attrs.fontSizeEnabled === false) {
			return null
		}

		return m(IconButton, {
			title: "removeFormatting_action",
			icon: Icons.FormatClear,
			click: (e) => {
				e.stopPropagation()
				attrs.editor.squire.removeAllFormatting()
			},
			size: ButtonSize.Compact,
		})
	}
}

export function animateToolbar(dom: HTMLElement, appear: boolean): Promise<void> {
	let childHeight = Array.from(dom.children)
		.map((domElement) => (domElement as HTMLElement).offsetHeight)
		.reduce((current: number, previous: number) => Math.max(current, previous), 0)
	return animations.add(dom, [height(appear ? 0 : childHeight, appear ? childHeight : 0), appear ? opacity(0, 1, false) : opacity(1, 0, false)]).then(() => {
		if (appear) {
			dom.style.height = ""
		}
	})
}
