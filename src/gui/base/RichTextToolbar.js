// @flow
import m from "mithril"
import {Icons} from "./icons/Icons"
import type {Editor} from './Editor.js'
import stream from "mithril/stream/stream.js"
import {numberRange} from "../../api/common/utils/ArrayUtils"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonColors, ButtonN, ButtonType} from "./ButtonN"
import {size} from '../size.js'
import {noOp} from "../../api/common/utils/Utils"
import {attachDropdown} from "./DropdownN"
import {lang} from '../../misc/LanguageViewModel.js'
import {animations, height, opacity} from "../animation/Animations"
import {client} from "../../misc/ClientDetector"
import {BrowserType} from "../../misc/ClientConstants"

export type Options = {
	imageButtonClickHandler?: ?((ev: Event, editor: Editor) => mixed),
	alignmentEnabled?: boolean,
	fontSizeEnabled?: boolean,
}

export class RichTextToolbar {
	view: Function;
	selectedSize: Stream<number>;

	constructor(editor: Editor, options: Options) {

		this.selectedSize = stream(size.font_size_base)

		const styleToggleAttrs: Array<ButtonAttrs> = [
			{style: 'b', title: () => lang.get("formatTextBold_msg") + " (Ctrl + B)", icon: Icons.Bold},
			{style: 'i', title: () => lang.get("formatTextItalic_msg") + " (Ctrl + I)", icon: Icons.Italic},
			{style: 'u', title: () => lang.get("formatTextUnderline_msg") + " (Ctrl + U)", icon: Icons.Underline},
			{style: 'c', title: "formatTextMonospace_msg", icon: Icons.Code},
			{
				style: 'a',
				title: () => editor.hasStyle('a')
					? lang.get('breakLink_action')
					: lang.get('makeLink_action'),
				icon: Icons.Link
			}
		].map(o => ({
			label: "emptyString_msg",
			title: o.title,
			click: () => editor.setStyle(!editor.hasStyle(o.style), o.style),
			icon: () => o.icon,
			type: ButtonType.Toggle,
			noBubble: true,
			isSelected: () => editor.hasStyle(o.style),
			colors: ButtonColors.Elevated,
		}))

		const alignToggleAttrs = [
			{name: 'left', title: "formatTextLeft_msg", icon: Icons.AlignLeft},
			{name: 'center', title: "formatTextCenter_msg", icon: Icons.AlignCenter,},
			{name: 'right', title: "formatTextRight_msg", icon: Icons.AlignRight,},
			{name: 'justify', title: "formatTextJustify_msg", icon: Icons.AlignJustified}
		].map(o => ({
			label: "emptyString_msg",
			title: o.title,
			click: () => {
				editor._squire.setTextAlignment(o.name)
				setTimeout(() => editor._squire.focus(), 100) // blur for the editor is fired after the handler for some reason
				m.redraw()
			},
			icon: () => o.icon,
			type: ButtonType.Toggle,
			isSelected: () => false,
			colors: ButtonColors.Elevated,
		}))

		styleToggleAttrs.unshift({
			label: "emptyString_msg",
			title: () => lang.get("formatTextUl_msg") + " (Ctrl + Shift + 8)",
			click: () => {
				if (editor.styles.listing === 'ul') {
					editor._squire.removeList()
				} else {
					editor._squire.makeUnorderedList()
				}
			},
			icon: () => Icons.ListUnordered,
			type: ButtonType.Toggle,
			noBubble: true,
			isSelected: () => {
				return editor.styles.listing === 'ul'
			},
			colors: ButtonColors.Elevated,
		}, {
			label: "emptyString_msg",
			title: () => lang.get("formatTextOl_msg") + " (Ctrl + Shift + 9)",
			click: () => {
				if (editor.styles.listing === 'ol') {
					editor._squire.removeList()
				} else {
					editor._squire.makeOrderedList()
				}
			},
			icon: () => Icons.ListOrdered,
			type: ButtonType.Toggle,
			noBubble: true,
			isSelected: () => editor.styles.listing === 'ol',
			colors: ButtonColors.Elevated,
		})
		const attachHandler = options.imageButtonClickHandler
		if (attachHandler) {
			styleToggleAttrs.unshift({
				label: "emptyString_msg",
				title: "insertImage_action",
				click: (ev) => attachHandler(ev, editor),
				type: ButtonType.Toggle,
				icon: () => Icons.Picture,
				colors: ButtonColors.Elevated,
			})
		}
		const alignDropdownAttrs = attachDropdown({
			label: () => "▼",
			title: "formatTextAlignment_msg",
			icon: () => {
				switch (editor.styles.alignment) {
					case 'left':
						return Icons.AlignLeft
					case 'center':
						return Icons.AlignCenter
					case 'right':
						return Icons.AlignRight
					default:
						return Icons.AlignJustified
				}
			},
			type: ButtonType.Toggle,
			noBubble: true,
			colors: ButtonColors.Elevated,
		}, () => alignToggleAttrs, () => true, 2 * size.hpad_large + size.button_height,)

		const removeFormattingButtonAttrs = {
			label: "emptyString_msg",
			title: "removeFormatting_action",
			icon: () => Icons.Cancel,
			type: ButtonType.Toggle,
			click: () => editor._squire.removeAllFormatting(),
			noBubble: true,
			colors: ButtonColors.Elevated,
		}

		const sizeButtonAttrs = attachDropdown({
			label: () => '▼',
			title: "formatTextFontSize_msg",
			icon: () => Icons.FontSize,
			type: ButtonType.Toggle,
			click: noOp,
			noBubble: true,
			colors: ButtonColors.Elevated,
		}, () => numberRange(8, 144).map(n => {
			return {
				label: () => n.toString(),
				type: ButtonType.Dropdown,
				click: () => {
					editor._squire.setFontSize(n)
					this.selectedSize(n)
					setTimeout(() => editor._squire.focus(), 100) // blur for the editor is fired after the handler for some reason
					m.redraw()
				}
			}
		}))

		const allButtonAttrs: Array<ButtonAttrs> = styleToggleAttrs
		if (options.alignmentEnabled == null || options.alignmentEnabled) {
			allButtonAttrs.push(alignDropdownAttrs)
		}
		if (options.fontSizeEnabled == null || options.fontSizeEnabled) {
			allButtonAttrs.push(sizeButtonAttrs)
		}
		allButtonAttrs.push(removeFormattingButtonAttrs)

		this.view = (): ?VirtualElement => {
			try {
				this.selectedSize(parseInt(editor._squire.getFontInfo().size.slice(0, -2)))
			} catch (e) {
				this.selectedSize(size.font_size_base)
			}

			return m(".elevated-bg.overflow-hidden", {
					style: {
						"top": '0px',
						"position": client.browser === BrowserType.SAFARI
							? client.isMacOS
								? "-webkit-sticky" // safari on macos
								: "inherit" // sticky changes the rendering order on iOS
							: "sticky" // normal browsers
					}
				}, [
					m(".flex-end.wrap", allButtonAttrs.map((t) => m(ButtonN, t)))
				]
			)
		}
	}

	oncreate(vnode: Vnode<any>): void {
		vnode.dom.style.height = "0"
		this._animate(vnode.dom, true)
	}

	onbeforeremove(vnode: Vnode<any>): Promise<void> {
		return this._animate(vnode.dom, false)
	}

	_animate(dom: HTMLElement, appear: boolean): Promise<*> {
		let childHeight = Array.from(dom.children)
		                       .map((domElement: HTMLElement) => domElement.offsetHeight)
		                       .reduce((current: number, previous: number) => Math.max(current, previous), 0)
		return animations
			.add(dom, [
				height(appear ? 0 : childHeight, appear ? childHeight : 0),
				appear ? opacity(0, 1, false) : opacity(1, 0, false)
			])
			.then(() => {
				if (appear) {
					dom.style.height = ''
				}
			})
	}
}
