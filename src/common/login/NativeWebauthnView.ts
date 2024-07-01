import type { Children, Vnode } from "mithril"
import m from "mithril"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar.js"
import type { WebauthnNativeBridge } from "../native/main/WebauthnNativeBridge.js"
import { SecondFactorImage } from "../gui/base/icons/Icons.js"
import { progressIcon } from "../gui/base/Icon.js"
import { lang } from "../misc/LanguageViewModel.js"
import { ButtonType } from "../gui/base/Button.js"
import { BrowserWebauthn } from "../misc/2fa/webauthn/BrowserWebauthn.js"
import { TopLevelView } from "../../TopLevelView.js"

/**
 * This is a special view which is not used by the web client
 * directly but is loaded remotely by desktop client in a dialog.
 * See DesktopWebauthnFacade.
 */
export class NativeWebauthnView implements TopLevelView {
	constructor(private readonly webauthn: BrowserWebauthn, private readonly nativeTransport: WebauthnNativeBridge) {
		this.view = this.view.bind(this)
		this.nativeTransport.init(this.webauthn)
	}

	updateUrl(args: Record<string, any>, requestedPath: string): void {}

	view(vnode: Vnode): Children {
		const headerBarAttrs: DialogHeaderBarAttrs = {
			left: [
				{
					label: "cancel_action",
					click: () => window.close(),
					type: ButtonType.Secondary,
				},
			],
			right: [],
			middle: () => lang.get("u2fSecurityKey_label"),
		}

		return m(
			".mt.flex.col.flex-center.center",
			{
				style: {
					margin: "0 auto",
				},
			},
			[
				m(".flex.col.justify-center", [
					m(DialogHeaderBar, headerBarAttrs),
					m(".flex-center.mt-s", m("img", { src: SecondFactorImage })),
					m(".mt.flex.col", [m(".flex.justify-center", [m(".mr-s", progressIcon()), m("", lang.get("waitingForU2f_msg"))])]),
				]),
			],
		)
	}
}
