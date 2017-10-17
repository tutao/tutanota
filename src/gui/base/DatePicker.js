//@flow
import {TextField} from "./TextField"
import m from "mithril"
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
	_date: ?Date;
	_domDateInput: HTMLInputElement;

	constructor(labelTextIdOrTextFunction: string|lazy<string>) {
		let pickerButton = new Button(labelTextIdOrTextFunction, e => {
			this._domDateInput.click()
			e.stopPropagation()
		}, () => Icons.Calendar)

		this.invalidDate = false
		this.input = new TextField(labelTextIdOrTextFunction, () => {
			if (this.invalidDate) return lang.get("invalidDateFormat_msg", {"{1}": formatDate(new Date())})
			else if (this._date != null) return formatDateWithMonth(this._date)
		})
		this._date = null
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
						this._date = null
						this._domDateInput.value = ""
					} else {
						this._date = new Date(timestamp)
						this._domDateInput.valueAsDate = this._date
					}
				} else {
					this._date = null
				}
				this.invalidDate = false
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
						visibility: 'hidden',
						position: 'absolute',
						z_index: -1,
					},
				}),
			])
		}
	}

	setDate(date: Date) {
		this._date = date
		if (this.input.isEmpty() && this.input._domInput) this.input.animate()
		this.input.value(date != null ? formatDate(date) : "")
	}

}