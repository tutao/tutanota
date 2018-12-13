// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {nativeApp} from '../native/NativeWrapper.js'
import {Request} from "../api/common/WorkerProtocol.js"
import {showProgressDialog} from "../gui/base/ProgressDialog.js"
import {noOp} from "../api/common/utils/Utils"

assertMainOrNode()

export class DesktopSettingsViewer implements UpdatableSettingsViewer {
	view: Function;

	_setDefaultMailtoHandlerDropdown: DropDownSelector<boolean>;
	_isDefaultMailtoHandler: boolean = false;

	constructor() {
		this._setDefaultMailtoHandlerDropdown = new DropDownSelector("defaultMailHandler_label", () => lang.get("defaultMailHandler_msg"), [
			{name: lang.get("unregistered_label"), value: false},
			{name: lang.get("registered_label"), value: true}
		], stream(this._isDefaultMailtoHandler), 250)
			.setSelectionChangedHandler(v => {
				showProgressDialog("pleaseWait_msg", this._updateDefaultMailtoHandler(v), false)
					.then(() => {
						this._setDefaultMailtoHandlerDropdown.selectedValue(v)
						m.redraw()
					})
			})

		nativeApp.invokeNative(new Request('checkMailto', []))
		         .then(v => {
			         this._isDefaultMailtoHandler = v
			         this._setDefaultMailtoHandlerDropdown.selectedValue(v)
			         m.redraw()
		         })

		this.view = () => {
			return [
				m("#user-settings.fill-absolute.scroll.plr-l.pb-xl", [
					m(".h4.mt-l", lang.get('desktopSettings_label')),
					env.platformId === 'linux' ? null : m(this._setDefaultMailtoHandlerDropdown),
				])
			]
		}
	}

	_updateDefaultMailtoHandler(v: boolean): Promise<void> {
		if (v) {
			return nativeApp.invokeNative(new Request('registerMailto', []))
		} else {
			return nativeApp.invokeNative(new Request('unregisterMailto', []))
		}
	}

	// this is all local for now
	entityEventsReceived = noOp
}
