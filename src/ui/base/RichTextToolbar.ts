import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Icons } from "./icons/Icons"
import type { Editor, Listing, Style } from "../editor/Editor"
import { Alignment } from "../editor/Editor"
import { numberRange } from "../../platform-kit/utils"
import { font_size, px } from "../size"
import { theme } from "../theme"
import { getColorLuminance, isValidCSSHexColor } from "./Color"
import { createDropdown, DropdownButtonAttrs } from "./Dropdown.js"
import { lang, MaybeTranslation, TranslationKey } from "../utils/LanguageViewModel"
import { animations, height, opacity } from "../animation/Animations"
import { ClientDetector } from "../../platform-kit/app-env/boot/ClientDetector"
import { BrowserType } from "../../platform-kit/app-env/boot/ClientConstants"
import { ToggleButton } from "./buttons/ToggleButton.js"
import { IconButton, IconButtonAttrs } from "./IconButton.js"
import { ButtonSize } from "./ButtonSize.js"
import { Dialog, DialogType } from "./Dialog.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "./DialogHeaderBar.js"
import { ButtonType } from "./Button.js"
import { ContentWithOptionsDialog } from "../dialogs/ContentWithOptionsDialog.js"
import { ColorPickerView } from "./colorPicker/ColorPickerView.js"

export interface RichTextToolbarAttrs {
	editor: Editor
	imageButtonClickHandler?: ((ev: Event, editor: Editor) => unknown) | null
	alignmentEnabled?: boolean
	fontSizeEnabled?: boolean
	customButtonAttrs?: Array<IconButtonAttrs>
	isNonElevatedBackground?: boolean
}

export class RichTextToolbar implements Component<RichTextToolbarAttrs> {
	selectedSize = font_size.base

	constructor({ attrs }: Vnode<RichTextToolbarAttrs>) {
		try {
			this.selectedSize = parseInt(attrs.editor.squire!.getFontInfo()?.size!.slice(0, -2))
		} catch (e) {
			this.selectedSize = font_size.base
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
			`${attrs.isNonElevatedBackground ? "" : ".nav-bg"}.overflow-hidden`,
			{
				style: {
					top: "0px",
					position:
						ClientDetector.get().browser === BrowserType.SAFARI
							? ClientDetector.get().isMacOS
								? "-webkit-sticky" // safari on macos
								: "inherit" // sticky changes the rendering order on iOS
							: "sticky", // normal browsers
				},
			},
			[
				m(
					".flex.wrap.items-center.mb-4.mt-4",
					{ style: { columnGap: px(8), justifyContent: "flex-start" } },
					[
						[this.renderHistoryButtons(attrs)],
						[this.renderStyleButtons(attrs), this.renderCustomButtons(attrs)],
						[this.renderAlignDropDown(attrs), this.renderIndentButtons(attrs)],
						[this.renderParagraphStyleDropDown(attrs), this.renderFontFamilyDropDown(attrs), this.renderSizeButtons(attrs)],
						[this.renderColorButtons(attrs), this.renderEmojiButton(attrs), this.renderTableDropDown(attrs)],
						[this.renderImageSizeDropDown(attrs), this.renderMoreDropDown(attrs), this.renderRemoveFormattingButton(attrs)],
					].map((group) => m(".flex.items-center.ml-between-4", group)),
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
			this.renderStyleToggleButton("s", lang.get("formatTextStrikethrough_msg") + " (Ctrl + Shift + 7)", Icons.Strikethrough, editor),
			this.renderStyleToggleButton("c", lang.get("formatTextMonospace_msg"), Icons.Code, editor),
			this.renderToggleButton(
				lang.makeTranslation("link", (editor.hasStyle("a") ? lang.get("editLink_action") : lang.get("makeLink_action")) + " (Ctrl + K)"),
				Icons.Chainlink,
				() => editor.makeLink(),
				() => editor.hasStyle("a"),
			),
			this.renderListToggleButton("ol", lang.get("formatTextOl_msg") + " (Ctrl + Shift + 9)", Icons.OrderedList, editor),
			this.renderListToggleButton("ul", lang.get("formatTextUl_msg") + " (Ctrl + Shift + 8)", Icons.UnorderedList, editor),
			imageButtonClickHandler
				? m(IconButton, {
						label: "insertImage_action",
						click: (ev) => imageButtonClickHandler(ev, editor),
						icon: Icons.PictureFilled,
						size: ButtonSize.Compact,
					})
				: null,
		]
	}

	private renderStyleToggleButton(style: Style, title: string, icon: Icons, editor: Editor): Children {
		return this.renderToggleButton(
			lang.makeTranslation(title, title),
			icon,
			() => editor.setStyle(!editor.hasStyle(style), style),
			() => editor.hasStyle(style),
		)
	}

	private renderListToggleButton(listing: Listing, title: string, icon: Icons, editor: Editor): Children {
		return this.renderToggleButton(
			lang.makeTranslation(title, title),
			icon,
			() =>
				editor.styles.listing === listing
					? editor.squire!.removeList()
					: listing === "ul"
						? editor.squire!.makeUnorderedList()
						: editor.squire!.makeOrderedList(),
			() => editor.styles.listing === listing,
		)
	}

	private renderToggleButton(title: MaybeTranslation, icon: Icons, click: () => void, isSelected: () => boolean): Children {
		return m(ToggleButton, {
			title: title,
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
					attrs.editor.squire!.setTextAlignment(alignment)
					setTimeout(() => attrs.editor.squire!.focus(), 100) // blur for the editor is fired after the handler for some reason
					m.redraw()
				},
				icon: icon,
			}
		}

		return m(IconButton, {
			// label: () => "▼",
			label: "formatTextAlignment_msg",
			icon: this.alignIcon(attrs),
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation()
				createDropdown({
					width: 200,
					lazyButtons: () => [
						alignButtonAttrs("left", "formatTextLeft_msg", Icons.TextAlignLeft),
						alignButtonAttrs("center", "formatTextCenter_msg", Icons.TextAlignCenter),
						alignButtonAttrs("right", "formatTextRight_msg", Icons.TextAlignRight),
						alignButtonAttrs("justify", "formatTextJustify_msg", Icons.TextAlignJustify),
					],
				})(e, dom)
			},
		})
	}

	private alignIcon(attrs: RichTextToolbarAttrs) {
		switch (attrs.editor.styles.alignment) {
			case "left":
				return Icons.TextAlignLeft

			case "center":
				return Icons.TextAlignCenter

			case "right":
				return Icons.TextAlignRight

			case "justify":
				return Icons.TextAlignJustify
		}
	}

	private renderSizeButtons({ editor }: RichTextToolbarAttrs): Children {
		const current = currentFontInfo(editor).fontSize
		return m(IconButton, {
			label: current ? lang.makeTranslation("fontSize", `${lang.get("formatTextFontSize_msg")} (${parseInt(current)})`) : "formatTextFontSize_msg",
			icon: Icons.TextHeight,
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation()
				createDropdown({
					lazyButtons: () =>
						numberRange(8, 144).map((n) => {
							return {
								label: lang.makeTranslation("font_size_" + n, n.toString()),
								click: () => {
									editor.squire!.setFontSize(px(n))
									this.selectedSize = n
									setTimeout(() => editor.squire!.focus(), 100) // blur for the editor is fired after the handler for some reason
									m.redraw()
								},
							}
						}),
				})(e, dom)
			},
		})
	}

	private renderHistoryButtons({ editor }: RichTextToolbarAttrs): Children {
		return [
			m(IconButton, {
				label: lang.makeTranslation("undo", lang.get("undo_action") + " (Ctrl + Z)"),
				icon: Icons.Undo,
				size: ButtonSize.Compact,
				click: () => editor.squire!.undo(),
			}),
			m(IconButton, {
				label: lang.makeTranslation("redo", lang.get("redo_action") + " (Ctrl + Y)"),
				icon: Icons.Redo,
				size: ButtonSize.Compact,
				click: () => editor.squire!.redo(),
			}),
		]
	}

	private renderIndentButtons({ editor }: RichTextToolbarAttrs): Children {
		return [
			m(IconButton, {
				label: lang.makeTranslation("outdent", lang.get("formatTextOutdent_msg") + " (Ctrl + [)"),
				icon: Icons.IndentDecrease,
				size: ButtonSize.Compact,
				click: () => editor.changeIndent(-1),
			}),
			m(IconButton, {
				label: lang.makeTranslation("indent", lang.get("formatTextIndent_msg") + " (Ctrl + ])"),
				icon: Icons.IndentIncrease,
				size: ButtonSize.Compact,
				click: () => editor.changeIndent(1),
			}),
			this.renderToggleButton(
				lang.makeTranslation("quote", lang.get("formatTextQuote_msg")),
				Icons.Quote,
				() => editor.toggleQuote(),
				() => editor.isInQuote(),
			),
		]
	}

	private renderParagraphStyleDropDown({ editor }: RichTextToolbarAttrs): Children {
		const styles: Array<[TranslationKey, string]> = [
			["formatTextNormal_msg", "div"],
			["formatTextHeading1_msg", "h1"],
			["formatTextHeading2_msg", "h2"],
			["formatTextHeading3_msg", "h3"],
		]
		return m(IconButton, {
			label: "formatTextParagraphStyle_msg",
			icon: Icons.TextOutline,
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation()
				createDropdown({
					lazyButtons: () =>
						styles.map(([label, tag]) => ({
							label,
							click: () => {
								editor.setBlockTag(tag)
								setTimeout(() => editor.squire!.focus(), 100)
							},
						})),
				})(e, dom)
			},
		})
	}

	private renderFontFamilyDropDown({ editor }: RichTextToolbarAttrs): Children {
		return m(IconButton, {
			label: "formatTextFontFamily_msg",
			icon: Icons.TextFilled,
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation()
				createDropdown({
					lazyButtons: () => [
						{
							label: "formatTextDefaultFont_msg",
							click: () => {
								editor.squire!.setFontFace(null)
								setTimeout(() => editor.squire!.focus(), 100)
							},
						},
						...FONT_FAMILIES.map((font) => ({
							label: lang.makeTranslation("font_" + font, font),
							click: () => {
								editor.squire!.setFontFace(font)
								setTimeout(() => editor.squire!.focus(), 100)
							},
						})),
					],
				})(e, dom)
			},
		})
	}

	private renderTableDropDown({ editor }: RichTextToolbarAttrs): Children {
		return m(IconButton, {
			label: "insertTable_action",
			icon: Icons.GridOutline,
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation()
				editor.openTablePicker(dom.getBoundingClientRect())
			},
		})
	}

	private renderEmojiButton({ editor }: RichTextToolbarAttrs): Children {
		return m(IconButton, {
			label: "insertEmoji_action",
			icon: Icons.SmileyfaceOutline,
			size: ButtonSize.Compact,
			click: (e) => {
				e.stopPropagation()
				showEmojiDialog(editor)
			},
		})
	}

	/** only shown while an image is selected */
	private renderImageSizeDropDown({ editor }: RichTextToolbarAttrs): Children {
		const image = editor.getSelectedImage()
		if (image == null) {
			return null
		}
		return m(IconButton, {
			label: "imageSize_label",
			icon: Icons.PictureOutline,
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation()
				createDropdown({
					lazyButtons: () => [
						...[0.25, 0.5, 0.75, 1].map((fraction) => ({
							label: lang.makeTranslation("image_size_" + fraction, `${fraction * 100}%`),
							click: () => editor.setImageScale(image, fraction),
						})),
						{
							label: "imageAltText_label" as const,
							click: () => editor.editImageAltText(image),
						},
					],
				})(e, dom)
			},
		})
	}

	private renderMoreDropDown({ editor }: RichTextToolbarAttrs): Children {
		const item = (label: TranslationKey, icon: Icons | undefined, action: () => unknown): DropdownButtonAttrs => ({
			label,
			icon,
			click: () => {
				action()
				setTimeout(() => editor.squire!.focus(), 100)
			},
		})
		return m(IconButton, {
			label: "formatTextMore_msg",
			icon: Icons.More,
			size: ButtonSize.Compact,
			click: (e, dom) => {
				e.stopPropagation()
				createDropdown({
					width: 240,
					lazyButtons: () => [
						item("formatTextSuperscript_msg", undefined, () =>
							editor.squire!.hasFormat("sup") ? editor.squire!.removeSuperscript() : editor.squire!.superscript(),
						),
						item("formatTextSubscript_msg", undefined, () =>
							editor.squire!.hasFormat("sub") ? editor.squire!.removeSubscript() : editor.squire!.subscript(),
						),
						item("formatTextHorizontalRule_msg", Icons.HorizontalRule, () => editor.squire!.insertHTML("<hr>")),
						item("formatTextChecklist_msg", undefined, () => editor.addChecklist()),
						item("formatTextCodeBlock_msg", Icons.Code, () => editor.squire!.toggleCode()),
						item("formatTextLtr_msg", Icons.TextAlignLeft, () => editor.squire!.setTextDirection("ltr")),
						item("formatTextRtl_msg", Icons.TextAlignRight, () => editor.squire!.setTextDirection("rtl")),
					],
				})(e, dom)
			},
		})
	}

	private renderColorButtons({ editor }: RichTextToolbarAttrs): Children {
		return [
			m(IconButton, {
				label: "formatTextColor_msg",
				icon: Icons.ColorpaletteOutline,
				size: ButtonSize.Compact,
				style: currentColorStyle(editor, "color"),
				click: (e) => {
					e.stopPropagation()
					showColorDialog(editor, "formatTextColor_msg", (color) => editor.squire!.setTextColor(color), true)
				},
			}),
			m(IconButton, {
				label: "formatTextBackgroundColor_msg",
				icon: Icons.PenOutline,
				size: ButtonSize.Compact,
				style: currentColorStyle(editor, "backgroundColor"),
				click: (e) => {
					e.stopPropagation()
					showColorDialog(editor, "formatTextBackgroundColor_msg", (color) => editor.squire!.setHighlightColor(color), false)
				},
			}),
		]
	}

	private renderRemoveFormattingButton(attrs: RichTextToolbarAttrs): Children {
		if (attrs.fontSizeEnabled === false) {
			return null
		}

		return m(IconButton, {
			label: "removeFormatting_action",
			icon: Icons.FormatClear,
			click: (e) => {
				e.stopPropagation()
				attrs.editor.squire!.removeAllFormatting()
			},
			size: ButtonSize.Compact,
		})
	}
}

/**
 * Shows a small dialog with a color picker. The primary button below applies the color, the secondary one removes it (passes null).
 */
const MAX_RECENT_COLORS = 8
/** colors picked in this session, most recent first */
const recentColors: string[] = []

/** very light or very dark colors are hard to read on at least one of a white or a dark background */
function isLowContrast(color: string): boolean {
	const luminance = getColorLuminance(color)
	return luminance > 0.85 || luminance < 0.15
}

export function showColorDialog(editor: Editor, title: TranslationKey, apply: (color: string | null) => unknown, warnLowContrast: boolean) {
	let color = ""
	const finish = (value: string | null) => {
		dialog.close()
		if (value != null) {
			recentColors.splice(0, recentColors.length, ...[value, ...recentColors.filter((c) => c !== value)].slice(0, MAX_RECENT_COLORS))
		}
		apply(value)
		setTimeout(() => editor.squire!.focus(), 100) // blur for the editor is fired after the handler for some reason
	}
	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [{ type: ButtonType.Secondary, label: "close_alt", click: () => dialog.close() }],
		middle: title,
	}
	const dialog = new Dialog(DialogType.Popup_S, {
		view: () =>
			m(".flex.col.border-radius", { style: { height: "100%" } }, [
				m(DialogHeaderBar, headerBarAttrs),
				m(
					".plr-24.flex-grow",
					m(
						ContentWithOptionsDialog,
						{
							mainActionText: "ok_action",
							mainActionClick: () => finish(color),
							subActionText: "removeColor_action",
							subActionClick: () => finish(null),
						},
						[
							recentColors.length > 0
								? m(".mb-16", [
										m(".small.mb-8", lang.get("recentColors_label")),
										m(
											".flex.wrap.gap-8",
											recentColors.map((recent) =>
												m("button.border-radius.flash", {
													"aria-label": recent,
													style: {
														width: px(30),
														height: px(30),
														backgroundColor: recent,
														border: `1px solid ${theme.outline}`,
														cursor: "pointer",
													},
													onclick: () => finish(recent),
												}),
											),
										),
									])
								: null,
							warnLowContrast && isValidCSSHexColor(color) && isLowContrast(color)
								? m(".small.mb-8", { style: { color: theme.error } }, lang.get("lowContrastColor_msg"))
								: null,
							m(ColorPickerView, {
								value: color,
								onselect: (newColor) => {
									color = newColor
								},
							}),
						],
					),
				),
			]),
	})
	dialog.show()
}

function currentFontInfo(editor: Editor): Record<string, string | undefined> {
	try {
		return editor.squire!.getFontInfo()
	} catch (e) {
		return {}
	}
}

/** underlines the toolbar button with the color that is active at the cursor */
function currentColorStyle(editor: Editor, key: "color" | "backgroundColor"): Record<string, string> | undefined {
	const color = currentFontInfo(editor)[key]
	return color ? { boxShadow: `inset 0 -3px 0 ${color}` } : undefined
}

const FONT_FAMILIES = ["Arial", "Verdana", "Tahoma", "Trebuchet MS", "Georgia", "Times New Roman", "Courier New"]

const EMOJIS = Array.from("😀😃😄😁😆😅😂🙂😉😊😍😘😋😎🤔😐😴😢😭😡😱🙏👍👎👏🙌👋💪🎉🎂🎁❤️💔⭐🔥✅❌⚠️❓💡📎📅📞✉️☀️🌧️🍀🍕☕")

function showEmojiDialog(editor: Editor) {
	const dialog = new Dialog(DialogType.Popup_S, {
		view: () =>
			m(".flex.col.border-radius", { style: { height: "100%" } }, [
				m(DialogHeaderBar, {
					left: [{ type: ButtonType.Secondary, label: "close_alt", click: () => dialog.close() }],
					middle: "insertEmoji_action",
				} satisfies DialogHeaderBarAttrs),
				m(
					".plr-24.pb-24.flex.wrap.gap-4",
					EMOJIS.map((emoji) =>
						m(
							"button.flash",
							{
								style: { fontSize: px(24), width: px(40), height: px(40), background: "none", border: "none", cursor: "pointer" },
								onclick: () => {
									dialog.close()
									editor.squire!.insertHTML(emoji)
									setTimeout(() => editor.squire!.focus(), 100)
								},
							},
							emoji,
						),
					),
				),
			]),
	})
	dialog.show()
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
