// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/Env"
import {lang} from "../../misc/LanguageViewModel"

assertMainOrNode()

export class StatusField {

	view: Function;
	_status: Stream<Status>;

	constructor(status: Stream<Status>) {
		this._status = status
		this.view = () => m("", lang.get(this._status().text))
	}

	isValid(): boolean {
		return this._status().type === 'valid'
	}

	getErrorMessageId(): ?string {
		return (this._status().type !== "valid") ? this._status().text : null
	}
}