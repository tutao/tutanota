// @flow

import m from "mithril"
import {Icon} from "../gui/base/Icon"
import {lang} from "../misc/LanguageViewModel"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {nativeApp} from '../native/NativeWrapper.js'
import {Request} from "../api/common/WorkerProtocol.js"

export type UpdateHelpLabelAttrs = {
	updateAvailable: Stream<boolean>;
}

export class DesktopUpdateHelpLabel {
	_waiting: boolean;
	_error: boolean;

	getActionLink(updateAvailable: Stream<boolean>): Child {
		if (this._waiting || this._error) return null

		const onclick = () => {
			if (updateAvailable()) {
				// install now (restarts the app)
				nativeApp.invokeNative(new Request('manualUpdate', []))
			} else if (!this._waiting) {
				// no update available & not currently waiting for check result -> check for update again
				this._waiting = true
				Promise.join(
					nativeApp.invokeNative(new Request('manualUpdate', [])),
					// make sure there's at least some delay
					// instant response tends to make users nervous
					Promise.resolve().delay(500),
					hasUpdate => {
						this._waiting = false
						updateAvailable(hasUpdate)
						m.redraw()
					}
				).catch(() => this._error = true)
			}
		}

		return m("span.text-break.pr-s", m('button.underline', {
				type: "button",
				href: "#",
				tabindex: "0",
				role: "button",
				onclick,
			}, lang.get(updateAvailable() ? "installNow_action" : "checkAgain_action"))
		)
	}

	getLabel(updateAvailable: Stream<boolean>): Child {
		let ret = ""
		if (updateAvailable()) {
			ret = lang.get("updateFound_label")
		} else if (this._error) {
			ret = lang.get("serviceUnavailable_msg")
		} else if (this._waiting) {
			ret = lang.get("checkingForUpdate_action")
		} else {
			ret = lang.get("noUpdateAvailable_msg")
		}
		return m("span.pr-s", ret + " ")
	}

	getIcon(): Child {
		return this._waiting && !this._error
			? m(Icon, {
				icon: BootIcons.Progress,
				class: 'flex-center items-center icon-progress-tiny icon-progress'
			})
			: null
	}

	view(vnode: Vnode<UpdateHelpLabelAttrs>): Children {
		const updateAvailable = vnode.attrs.updateAvailable
		return m('.flex.items-center', [
			this.getLabel(updateAvailable),
			this.getActionLink(updateAvailable),
			this.getIcon()
		])
	}
}