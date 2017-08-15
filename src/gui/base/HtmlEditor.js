//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Editor} from "./Editor.js"
import {DropDownSelector} from "./DropDownSelector"
import {lang} from "../../misc/LanguageViewModel"

export const Mode = {
	HTML: "html",
	WYSIWYG: "what you see is what you get",
}

export class HtmlEditor {
	editor: Editor;
	_mode: stream<HtmlEditorModeEnum>;
	_active: boolean;
	_disabled: boolean;
	_domWrapper: HTMLElement;
	_domTextArea: HTMLTextAreaElement;
	value: stream<string>;
	view: Function;

	constructor(label: string|lazy<string>, helpLabel: ?lazy<string>) {
		this.editor = new Editor(true, 200)
		this._mode = stream(Mode.WYSIWYG)
		this._active = false
		this._disabled = false
		this.value = stream("")


		this._mode.map(v => {
			if (this._mode() == Mode.WYSIWYG && this.editor.initialized.promise.isResolved()) {
				this.value(this._domTextArea.value)
				this.editor.initialized.promise.then(() => this.editor.squire.setHTML(this.value()))
			} else if (this._domTextArea) {
				this.value(this.editor.squire.getHTML())
				this._domTextArea.value = this.value()
			}
		})

		let modeSwitcher = new DropDownSelector(label, null, [
			{name: lang.get("richText_label"), value: Mode.WYSIWYG},
			{name: lang.get("htmlSourceCode_label"), value: Mode.HTML}
		], this._mode).setSelectionChangedHandler(v => {
			this._mode(v)
		})

		this.editor.initialized.promise.then(() => {
			this.editor.squire.setHTML(this.value())
			this.editor._domElement.onfocus = (e) => this.focus(e)
			this.editor._domElement.onblur = (e) => this.blur(e)
		})

		this.view = () => {
			return m("html-editor-wrapper", [
					m(".html-editor.input-field", {
						oncreate: vnode => this._domWrapper = vnode.dom
					}, [
						m(modeSwitcher),
						m(".wysiwyg", {style: {display: this._mode() === Mode.WYSIWYG ? '' : 'none'}}, m(this.editor)),
						m(".html", {style: {display: this._mode() === Mode.HTML ? '' : 'none'}}, m("textarea.input-area", {
							oncreate: vnode => this._domTextArea = vnode.dom,
							value: this.value(),
							onfocus: (e) => this.focus(e),
							onblur: e => this.blur(e),
							oninput: e => {
								this._domTextArea.style.height = '0px';
								this._domTextArea.style.height = (this._domTextArea.scrollHeight) + 'px';
								this.value(this._domTextArea.value)
							},
							style: {
								'font-family': 'monospace'
							}
						})),
					])
				],
				helpLabel ? m("small.help", helpLabel()) : []
			)
		}
	}

	setValue(html: string) {
		this.value(html)
		return this
	}

	focus() {
		if (!this._active) {
			this._active = true
			this._domWrapper.classList.add("input-field-active")
		}
	}

	blur() {
		if (this._active) {
			this._active = false
			this._domWrapper.classList.remove("input-field-active")
		}
		if (this._mode() == Mode.WYSIWYG && this.editor.initialized.promise.isResolved()) {
			this.value(this.editor.squire.getHTML())
		} else {
			this.value(this._domTextArea.value)
		}
	}

	isActive() {
		return this._active
	}

}