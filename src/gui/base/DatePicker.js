//@flow
import {TextField} from "./TextField"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Icons} from "./icons/Icons"
import {Button} from "./Button"
import {client} from "../../misc/ClientDetector"
import {parseDate, formatDate, formatDateWithMonth} from "../../misc/Formatter"
import {lang} from "../../misc/LanguageViewModel"

/**
 * The HTML input[type=date] is not usable on desktops because:
 * * it always displays a placeholder (mm/dd/yyyy) and several buttons and
 * * the picker can't be opened programmatically and
 * * the date format is based on the operating systems locale and not on the one set in the browser (and used by us)
 *
 * That is why we only use the picker on mobile devices. They provide native picker components
 * and allow opening the picker by forwarding the click event to the input.
 */
export class DatePicker {
	input: TextField;
	view: Function;
	invalidDate: boolean;
	date: stream<?Date>;
	_domDateInput: HTMLInputElement;

	constructor(labelTextIdOrTextFunction: string|lazy<string>, nullSelectionTextId: string = "emptyString_msg") {
		this.date = stream(null)

		let pickerButton = new Button(labelTextIdOrTextFunction, e => {
			this._domDateInput.click()
			e.stopPropagation()
		}, () => Icons.Calendar)

		this.invalidDate = false
		this.input = new TextField(labelTextIdOrTextFunction, () => {
			if (this.invalidDate) {
				return lang.get("invalidDateFormat_msg", {"{1}": formatDate(new Date())})
			} else if (this.date() != null) {
				return formatDateWithMonth(this.date())
			} else {
				return lang.get(nullSelectionTextId)
			}
		})
		this.input._injectionsRight = () => {
			if (client.isMobileDevice()) {
				return [m(pickerButton)]
			}
			return null // TODO implement Date-Picker for Desktop (see https://github.com/bendavis78/paper-date-picker)
		}
		this.input.onUpdate(value => {
			try {
				if (value.trim().length > 0) {
					let timestamp = parseDate(value)
					if (isNaN(timestamp)) {
						// always set invalidDate first to make sure that functions depending on the date stream can read the current invalidDate value
						this.invalidDate = false
						this.date(null)
						this._domDateInput.value = ""
					} else {
						this.invalidDate = false
						this.date(new Date(timestamp))
						if (this._domDateInput) {
							this._domDateInput.valueAsDate = this.date()
						}
					}
				} else {
					this.invalidDate = false
					this.date(null)
				}
			} catch (e) {
				this.invalidDate = true
			}
		})

		this.view = () => {
			return m("", [
				m(this.input),
				m("input[type=date]", {
					oncreate: (vnode) => this._domDateInput = vnode.dom,
					onchange: (e) => this.setDate(this._domDateInput.valueAsDate),
					style: {
						display: 'none', // clear (x) button is shown on edge, otherwise
						visibility: 'hidden',
						position: 'absolute',
						z_index: -1,
					},
				}),
			])
		}
	}

	setDate(date: Date) {
		this.invalidDate = false
		this.date(date)
		if (this.input.isEmpty() && this.input._domInput) {
			this.input.animate()
		}
		this.input.value(date != null ? formatDate(date) : "")
	}

}