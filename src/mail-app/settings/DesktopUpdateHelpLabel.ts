import m, { Child, Children, Vnode } from "mithril"
import { Icon } from "../../common/gui/base/Icon"
import { lang } from "../../common/misc/LanguageViewModel"
import { BootIcons } from "../../common/gui/base/icons/BootIcons"
import { delay } from "@tutao/tutanota-utils"
import Stream from "mithril/stream"

export type UpdateHelpLabelAttrs = {
	updateAvailable: Stream<boolean>
	manualUpdate(): Promise<boolean>
}

export class DesktopUpdateHelpLabel {
	private _waiting: boolean = false
	private _error: boolean = false

	getActionLink({ updateAvailable, manualUpdate }: UpdateHelpLabelAttrs): Child {
		if (this._waiting || this._error) return null

		const onclick = async () => {
			if (updateAvailable()) {
				// install now (restarts the app)
				manualUpdate()
			} else if (!this._waiting) {
				// no update available & not currently waiting for check result -> check for update again
				this._waiting = true
				const [hasUpdate] = await Promise.all([
					manualUpdate(), // make sure there's at least some delay
					// instant response tends to make users nervous
					delay(500),
				])
				this._waiting = false
				updateAvailable(hasUpdate)
				m.redraw()
			}
		}

		return m(
			"span.text-break.pr-s",
			m(
				"button.underline",
				{
					type: "button",
					href: "#",
					tabindex: "0",
					role: "button",
					onclick,
				},
				lang.get(updateAvailable() ? "installNow_action" : "checkAgain_action"),
			),
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
					class: "flex-center items-center icon-progress-tiny icon-progress",
			  })
			: null
	}

	view(vnode: Vnode<UpdateHelpLabelAttrs>): Children {
		return m(".flex.items-center", [this.getLabel(vnode.attrs.updateAvailable), this.getActionLink(vnode.attrs), this.getIcon()])
	}
}
