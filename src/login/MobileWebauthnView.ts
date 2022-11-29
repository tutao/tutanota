import type {Children, Vnode} from "mithril"
import m from "mithril"
import type {CurrentView, TopLevelAttrs} from "../gui/Header.js"
import {DialogHeaderBar, DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar.js"
import {SecondFactorImage} from "../gui/base/icons/Icons.js"
import {progressIcon} from "../gui/base/Icon.js"
import {lang} from "../misc/LanguageViewModel.js"
import {Button, ButtonType} from "../gui/base/Button.js"
import {BrowserWebauthn} from "../misc/2fa/webauthn/BrowserWebauthn.js"
import {Dialog} from "../gui/base/Dialog.js"

export interface MobileWebauthnAttrs extends TopLevelAttrs {
	browserWebauthn: BrowserWebauthn,
}

/**
 * This is a special view which is not used by the web client
 * directly but is loaded remotely by desktop client in a dialog.
 * See DesktopWebauthnFacade.
 */
export class MobileWebauthnView implements CurrentView<MobileWebauthnAttrs> {

	view({attrs}: Vnode<MobileWebauthnAttrs>): Children {
		console.log("args:", attrs)
		const headerBarAttrs: DialogHeaderBarAttrs = {
			left: [{
				label: "cancel_action",
				click: () => window.close(),
				type: ButtonType.Secondary
			}],
			right: [],
			middle: () => lang.get("u2fSecurityKey_label"),
		}

		return m(".mt.flex.col.flex-center.center", {
				style: {
					margin: "0 auto",
				}
			},
			[
				m(".flex.col.justify-center", [
					m(".dialog-header", m(DialogHeaderBar, headerBarAttrs)),
					m(".flex-center.mt-s", m("img", {src: SecondFactorImage})),
					m(".mt.flex.col", [
						m(".flex.justify-center", [m(".mr-s", progressIcon()), m("", lang.get("waitingForU2f_msg"))])
					]),
					m(Button, {
						type: ButtonType.Primary,
						label: () => "TEST WEBAUTHN (needs https)",
						click: async () => {
							if (!(await attrs.browserWebauthn.isSupported())) {
								await Dialog.message(() => "Webauthn is not supported! https?")
								return
							}
							const result = await attrs.browserWebauthn.register({
								challenge: new Uint8Array([1, 2, 3]),
								name: "name",
								displayName: "displayName",
								domain: "",
								userId: "userId"
							})
							console.log("webauthn result", result)
						}
					}),
					m(Button, {
						type: ButtonType.Primary,
						label: () => "RETURN RESULT",
						click: () => {
							const cbUrlTemplate = attrs.args["cbUrl"] as string
							const cbUrl = cbUrlTemplate.replace("{result}", "someResultValue")
							window.open(cbUrl)
						}
					})
				])
			]
		)
	}
}