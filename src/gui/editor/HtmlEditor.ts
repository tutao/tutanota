import m, {Children, Component} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {Editor} from "./Editor.js"
import {DropDownSelector} from "../base/DropDownSelector"
import type {TranslationKey, TranslationText} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {px} from "../size"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import type {Options as ToolbarOptions} from "../base/RichTextToolbar"
import {RichTextToolbar} from "../base/RichTextToolbar"
import type {lazy} from "@tutao/tutanota-utils"
import {assertNotNull} from "@tutao/tutanota-utils"

export enum HtmlEditorMode {
	HTML = "html",
	WYSIWYG = "what you see is what you get",
}

type RichToolbarOptions = {enabled: boolean} & ToolbarOptions

export class HtmlEditor implements Component {
	// Currently accessed form outside
	_editor: Editor;
	private _mode: Stream<HtmlEditorMode>;
	private _active: boolean;
	private _disabled: boolean;
	private _domTextArea: HTMLTextAreaElement | null = null;
	private _showBorders: boolean;
	private _minHeight: number | null;
	private _placeholderId: TranslationKey | null;
	view: Component["view"]
	private _placeholderDomElement: HTMLElement | null = null;
	private _value: Stream<string>;
	private _modeSwitcher: DropDownSelector<HtmlEditorMode> | null;
	private _htmlMonospace: boolean;
	private _richToolbarOptions: RichToolbarOptions;

	constructor(labelIdOrLabelFunction?: TranslationText, richToolbarOptions?: RichToolbarOptions,
				injections?: () => Children) {
		if (typeof richToolbarOptions === 'undefined') {
			richToolbarOptions = {enabled: false}
		}
		this._editor = new Editor(null, (html) => htmlSanitizer.sanitizeFragment(html, {blockExternalContent: false}).html)
		this._mode = stream<HtmlEditorMode>(HtmlEditorMode.WYSIWYG)
		this._active = false
		this._disabled = false
		this._showBorders = false
		this._minHeight = null
		this._placeholderId = null
		this._value = stream("")
		this._modeSwitcher = null
		this._htmlMonospace = true
		this._richToolbarOptions = richToolbarOptions;

		this._mode.map(v => {
			this.setValue(this._value())
			this._editor.initialized.promise.then(() => {
				const dom = assertNotNull(this._editor?.domElement)
				dom.onfocus = (_) => focus()
				dom.onblur = (_) => blur()
			})
		})

		let focus = () => {
			this._active = true
			m.redraw()
		}

		let blur = () => {
			this._active = false
			if (this._mode() === HtmlEditorMode.WYSIWYG) {
				this._value(this._editor.getValue())
			} else {
				this._value(assertNotNull(this._domTextArea).value)
			}
		}

		let getPlaceholder = () => {
			return (!this._active && this.isEmpty()) ? m(".abs.text-ellipsis.noselect.backface_fix.z1.i.pr-s", {
					oncreate: vnode => this._placeholderDomElement = vnode.dom as HTMLElement,
					onclick: () => this._mode() === HtmlEditorMode.WYSIWYG
						? assertNotNull(this._editor.domElement).focus()
						: assertNotNull(this._domTextArea).focus()
				},
				(this._placeholderId ? lang.get(this._placeholderId) : "")
			) : null
		}

		const label = labelIdOrLabelFunction


		const toolbar = new RichTextToolbar(this._editor, richToolbarOptions)

		this.view = () => {
			const borderClasses: string = this._showBorders
				? (this._active
						? ".editor-border-active"
						: (".editor-border" + (this._modeSwitcher ? ".editor-no-top-border" : ""))
				)
				: ""
			const renderedInjections = injections && injections() || null

			return m(".html-editor" + (this._mode() === HtmlEditorMode.WYSIWYG ? ".text-break" : ""), [
				this._modeSwitcher ? m(this._modeSwitcher) : null,
				(label)
					? m(".small.mt-form", lang.getMaybeLazy(label))
					: null,
				m(borderClasses, [
					getPlaceholder(),
					this._mode() === HtmlEditorMode.WYSIWYG
						? m(".wysiwyg.rel.overflow-hidden.selectable", [
							(this._editor.isEnabled() && (this._richToolbarOptions.enabled || renderedInjections))
								? [
									m(".flex-end.mr-negative-s.sticky.pb-2", [
										(this._richToolbarOptions.enabled) ? m(toolbar) : null,
										renderedInjections,
									]),
									m("hr.hr.mb-s")
								]
								: null,
							m(this._editor,
								{
									oncreate: () => {
										this._editor.initialized.promise.then(() => this._editor.setHTML(this._value()))
									},
									onremove: () => {
										this._value(this.getValue())
									}
								}
							)
						])
						: m(".html", m("textarea.input-area.selectable", {
							oncreate: vnode => {
								this._domTextArea = vnode.dom as HTMLTextAreaElement
								if (!this.isEmpty()) {
									this._domTextArea.value = this._value()
								}
							},
							onfocus: () => focus(),
							onblur: () => blur(),
							oninput: () => {
								if (this._domTextArea) {
									this._domTextArea.style.height = '0px'
									this._domTextArea.style.height = (this._domTextArea.scrollHeight) + 'px'
								}
							},
							style: {
								'font-family': this._htmlMonospace ? 'monospace' : 'inherit',
								"min-height": this._minHeight ? px(this._minHeight) : 'initial'
							},
							disabled: !this._editor.enabled
						})),
				])
			])
		}
	}


	setModeSwitcher(label: TranslationKey | lazy<string>): this {
		this._modeSwitcher = new DropDownSelector(label, null, [
			{name: lang.get("richText_label"), value: HtmlEditorMode.WYSIWYG},
			{name: lang.get("htmlSourceCode_label"), value: HtmlEditorMode.HTML}
		], this._mode).setSelectionChangedHandler(v => {
			this._mode(v)
		})
		return this
	}


	showBorders(): HtmlEditor {
		this._showBorders = true
		return this
	}

	setMinHeight(height: number): HtmlEditor {
		this._minHeight = height
		this._editor.setMinHeight(height)
		return this
	}

	setPlaceholderId(placeholderId: TranslationKey): HtmlEditor {
		this._placeholderId = placeholderId
		return this
	}

	getValue(): string {
		if (this._mode() === HtmlEditorMode.WYSIWYG) {
			if (this._editor.isAttached()) {
				return this._editor.getHTML()
			} else {
				return this._value()
			}
		} else {
			if (this._domTextArea) {
				return htmlSanitizer.sanitizeHTML(this._domTextArea.value, {blockExternalContent: false}).text
			} else {
				return this._value()
			}
		}
	}

	setValue(html: string): HtmlEditor {
		if (this._mode() === HtmlEditorMode.WYSIWYG) {
			this._editor.initialized.promise.then(() => this._editor.setHTML(html))
		} else if (this._domTextArea) {
			this._domTextArea.value = html
		}
		this._value(html)
		return this
	}


	isActive(): boolean {
		return this._active
	}

	isEmpty(): boolean {
		return this._value() === ""
	}


	setEnabled(enabled: boolean): HtmlEditor {
		this._editor.setEnabled(enabled)
		if (this._domTextArea) {
			this._domTextArea.disabled = !enabled
		}
		return this
	}

	setMode(mode: HtmlEditorMode): HtmlEditor {
		this._mode(mode)
		return this
	}

	setHtmlMonospace(monospace: boolean): HtmlEditor {
		this._htmlMonospace = monospace
		return this
	}
}
