import m, {Children, Component} from "mithril"
import stream from "mithril/stream"
import {Editor} from "./Editor.js"
import type {TranslationKey, TranslationText} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {px} from "../size"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import type {Options as ToolbarOptions} from "../base/RichTextToolbar"
import {RichTextToolbar} from "../base/RichTextToolbar"
import {assertNotNull} from "@tutao/tutanota-utils"
import {DropDownSelector} from "../base/DropDownSelector.js"

export enum HtmlEditorMode {
	HTML = "html",
	WYSIWYG = "what you see is what you get",
}

type RichToolbarOptions = {enabled: boolean} & ToolbarOptions

export class HtmlEditor implements Component {
	editor: Editor
	private toolbar: RichTextToolbar
	private mode = HtmlEditorMode.WYSIWYG
	private active = false
	private domTextArea: HTMLTextAreaElement | null = null
	private _showBorders = false
	private minHeight: number | null = null
	private placeholderId: TranslationKey | null = null
	private placeholderDomElement: HTMLElement | null = null
	private value = stream("")
	private htmlMonospace = true
	private modeSwitcherLabel: TranslationText | null = null

	constructor(
		private label?: TranslationText,
		private readonly richToolbarOptions: RichToolbarOptions = {enabled: false},
		private readonly injections?: () => Children
	) {
		this.editor = new Editor(null, (html) => htmlSanitizer.sanitizeFragment(html, {blockExternalContent: false}).fragment)
		this.toolbar = new RichTextToolbar(this.editor, richToolbarOptions)
		this.view = this.view.bind(this)
	}

	view(): Children {

		const modeSwitcherLabel = this.modeSwitcherLabel
		let borderClasses = this._showBorders
			? this.active
				? ".editor-border-active"
				: ".editor-border" + (modeSwitcherLabel != null ? ".editor-no-top-border" : "")
			: ""

		const renderedInjections = this.injections?.() ?? null

		const focus = () => {
			this.active = true
			m.redraw()
		}

		const blur = () => {
			this.active = false
			if (this.mode === HtmlEditorMode.WYSIWYG) {
				this.value(this.editor.getValue())
			} else {
				this.value(assertNotNull(this.domTextArea).value)
			}
		}

		const getPlaceholder = () => {
			return (!this.active && this.isEmpty()) ? m(".abs.text-ellipsis.noselect.backface_fix.z1.i.pr-s", {
					oncreate: vnode => this.placeholderDomElement = vnode.dom as HTMLElement,
					onclick: () => this.mode === HtmlEditorMode.WYSIWYG
						? assertNotNull(this.editor.domElement).focus()
						: assertNotNull(this.domTextArea).focus()
				},
				(this.placeholderId ? lang.get(this.placeholderId) : "")
			) : null
		}


		return m(".html-editor" + (this.mode === HtmlEditorMode.WYSIWYG ? ".text-break" : ""), [
			modeSwitcherLabel != null ? m(DropDownSelector, {
					label: () => lang.getMaybeLazy(modeSwitcherLabel),
					items: [
						{name: lang.get("richText_label"), value: HtmlEditorMode.WYSIWYG},
						{name: lang.get("htmlSourceCode_label"), value: HtmlEditorMode.HTML}
					],
					selectedValue: this.mode,
					selectionChangedHandler: (mode: HtmlEditorMode) => {
						this.mode = mode
						this.setValue(this.value())
						this.editor.initialized.promise.then(() => {
							const dom = assertNotNull(this.editor?.domElement)
							dom.onfocus = (_) => focus()
							dom.onblur = (_) => blur()
						})
					}
				}
			) : null,
			(this.label)
				? m(".small.mt-form", lang.getMaybeLazy(this.label))
				: null,
			m(borderClasses, [
				getPlaceholder(),
				this.mode === HtmlEditorMode.WYSIWYG
					? m(".wysiwyg.rel.overflow-hidden.selectable", [
						(this.editor.isEnabled() && (this.richToolbarOptions.enabled || renderedInjections))
							? [
								m(".flex-end.mr-negative-s.sticky.pb-2", [
									(this.richToolbarOptions.enabled) ? m(this.toolbar) : null,
									renderedInjections,
								]),
								m("hr.hr.mb-s")
							]
							: null,
						m(this.editor,
							{
								oncreate: () => {
									this.editor.initialized.promise.then(() => this.editor.setHTML(this.value()))
								},
								onremove: () => {
									this.value(this.getValue())
								}
							}
						)
					])
					: m(".html", m("textarea.input-area.selectable", {
						oncreate: vnode => {
							this.domTextArea = vnode.dom as HTMLTextAreaElement
							if (!this.isEmpty()) {
								this.domTextArea.value = this.value()
							}
						},
						onfocus: () => focus(),
						onblur: () => blur(),
						oninput: () => {
							if (this.domTextArea) {
								this.domTextArea.style.height = '0px'
								this.domTextArea.style.height = (this.domTextArea.scrollHeight) + 'px'
							}
						},
						style: {
							'font-family': this.htmlMonospace ? 'monospace' : 'inherit',
							"min-height": this.minHeight ? px(this.minHeight) : 'initial'
						},
						disabled: !this.editor.enabled
					})),
			])
		])
	}


	setModeSwitcher(label: TranslationText): this {
		this.modeSwitcherLabel = label
		return this
	}

	showBorders(): HtmlEditor {
		this._showBorders = true
		return this
	}

	setMinHeight(height: number): HtmlEditor {
		this.minHeight = height
		this.editor.setMinHeight(height)
		return this
	}

	setPlaceholderId(placeholderId: TranslationKey): HtmlEditor {
		this.placeholderId = placeholderId
		return this
	}

	getValue(): string {
		if (this.mode === HtmlEditorMode.WYSIWYG) {
			if (this.editor.isAttached()) {
				return this.editor.getHTML()
			} else {
				return this.value()
			}
		} else {
			if (this.domTextArea) {
				return htmlSanitizer.sanitizeHTML(this.domTextArea.value, {blockExternalContent: false}).html
			} else {
				return this.value()
			}
		}
	}

	setValue(html: string): HtmlEditor {
		if (this.mode === HtmlEditorMode.WYSIWYG) {
			this.editor.initialized.promise.then(() => this.editor.setHTML(html))
		} else if (this.domTextArea) {
			this.domTextArea.value = html
		}
		this.value(html)
		return this
	}


	isActive(): boolean {
		return this.active
	}

	isEmpty(): boolean {
		return this.value() === ""
	}


	setEnabled(enabled: boolean): HtmlEditor {
		this.editor.setEnabled(enabled)
		if (this.domTextArea) {
			this.domTextArea.disabled = !enabled
		}
		return this
	}

	setMode(mode: HtmlEditorMode): HtmlEditor {
		this.mode = mode
		return this
	}

	setHtmlMonospace(monospace: boolean): HtmlEditor {
		this.htmlMonospace = monospace
		return this
	}
}
