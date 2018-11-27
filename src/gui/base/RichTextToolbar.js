// @flow
import m from "mithril"
import {Icons} from "./icons/Icons"
import type {Editor} from './Editor.js'
import stream from "mithril/stream/stream.js"
import {numberRange} from "../../api/common/utils/ArrayUtils"
import {ButtonN, ButtonType} from "./ButtonN"
import {size} from '../size.js'
import type {DropDownSelectorAttrs} from "./DropDownSelectorN"
import {DropDownSelectorN} from "./DropDownSelectorN"
import {TextFieldN} from "./TextFieldN"
import {noOp} from "../../api/common/utils/Utils"
import {attachDropdown} from "./DropdownN"
import {px} from "../size"
import {lang} from '../../misc/LanguageViewModel.js'

export class RichTextToolbar {
	view: Function;
	selectedSize: Stream<number>;

	constructor(editor: Editor) {

		this.selectedSize = stream(size.font_size_base)

		const styleToggleAttrs = [
			{style: 'b', title: () => lang.get("formatTextBold_msg") + " (Ctrl + B)", icon: Icons.Bold},
			{style: 'i', title: () => lang.get("formatTextItalic_msg") + " (Ctrl + I)", icon: Icons.Italic},
			{style: 'u', title: () => lang.get("formatTextUnderline_msg") + " (Ctrl + U)", icon: Icons.Underline},
			{style: 'c', title: "formatTextMonospace_msg", icon: Icons.Code}
		].map(o => ({
			label: "emptyString_msg",
			title: o.title,
			click: () => editor.setStyle(!editor.hasStyle(o.style), o.style),
			icon: () => o.icon,
			type: ButtonType.Toggle,
			noBubble: true,
			isSelected: () => editor.hasStyle(o.style),
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
			}
		}, {
			label: "emptyString_msg",
			title: () => lang.get("formatTextUl_msg") + " (Ctrl + Shift + 9)",
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
			isSelected: () => editor.styles.listing === 'ol'
		})

		const alignDropdownAttrs = attachDropdown({
			label: () => "▼",
			title: "formatTextAlignment_msg",
			click: noOp,
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
		}, () => alignToggleAttrs, () => true, 2 * size.hpad_large + size.button_height,)

		const sizeSelectorAttrs: DropDownSelectorAttrs<number> = {
			label: "formatTextFontSize_msg",
			items: numberRange(8, 144).map(n => ({name: n.toString(), value: n})),
			selectedValue: this.selectedSize,
			selectionChangedHandler: (newSize: number) => {
				editor._squire.setFontSize(newSize)
				this.selectedSize(newSize)
				setTimeout(() => editor._squire.focus(), 100) // blur for the editor is fired after the handler for some reason
				m.redraw()
			},
			dropdownWidth: 150
		}

		const buttonPanelAttrs = {
			label: "emptyString_msg",
			value: stream(""),
			injectionsRight: () => styleToggleAttrs.concat(alignDropdownAttrs).map(t => m(ButtonN, t)),
			disabled: true,
		}

		this.view = (): ?VirtualElement => {
			try {
				this.selectedSize(parseInt(editor._squire.getFontInfo().size.slice(0, -2)))
			} catch (e) {
				this.selectedSize(size.font_size_base)
			}

			return m(".wrapping-row.pt-m.sticky.content-bg.pb-2", {style: {"top": '0px'}},
				[
					m('',
						{style: {"max-width": px(150), "min-width": 'unset'}},
						m(DropDownSelectorN, sizeSelectorAttrs)
					),
					m(TextFieldN, buttonPanelAttrs)
				]
			)
		}
	}
}