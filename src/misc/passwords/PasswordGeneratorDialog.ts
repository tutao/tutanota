import m, {Children, Component, Vnode} from "mithril"
import {Dialog} from "../../gui/base/Dialog"
import {PasswordGenerator} from "./PasswordGenerator"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {locator} from "../../api/main/MainLocator"
import {px} from "../../gui/size"
import {HttpMethod, MediaType} from "../../api/common/EntityFunctions"
import {copyToClipboard} from "../ClipboardUtils"
import type Stream from "mithril/stream"
import stream from "mithril/stream"
import {getWebRoot} from "../../api/common/Env.js"

let dictionary: string[] | null = null

/**
 * Show a dialog to generate a random passphrase
 * @returns a promise containing the generated password
 */
export function showPasswordGeneratorDialog(): Promise<string> {
	return new Promise(async (resolve) => {
		if (dictionary == null) {
			const dictionaryJson = await locator.worker.restRequest(`/wordlibrary.json`, HttpMethod.GET, {
				responseType: MediaType.Json,
				baseUrl: getWebRoot(),
			})
			dictionary = JSON.parse(dictionaryJson)
		}

		const password = stream("")
		const pwGenerator = new PasswordGenerator(locator.random, dictionary!)

		const insertPasswordOkAction = () => {
			resolve(password())
			dialog.close()
		}

		const updateAction = () => {
			pwGenerator.generateRandomPassphrase()
					   .then((passphrase) => {
						   password(passphrase)
						   m.redraw()
					   })
		}
		updateAction()
		const dialog = Dialog.showActionDialog({
			title: () => "Passphrase",
			child: {
				view: () => m(PasswordGeneratorDialog, {
					okAction: insertPasswordOkAction,
					updateAction,
					password
				})
			},
			okAction: null
		})
	})
}

type PasswordGeneratorDialogAttrs = {
	okAction: () => void,
	updateAction: () => void,
	password: Stream<string>
}

class PasswordGeneratorDialog implements Component<PasswordGeneratorDialogAttrs> {
	view(vnode: Vnode<PasswordGeneratorDialogAttrs>): Children {
		const {updateAction, okAction, password} = vnode.attrs
		return m("", [
			m(".editor-border.mt.flex.center-horizontally.center-vertically", {
				style: {
					minHeight: px(65) // needs 65px for displaying two rows
				}
			}, m(".center.b.monospace", password())),
			m(".small.mt-xs", "This is a secure and easy to remember passphrase generated from a large dictionary. Find out why it is secure FAQ."), // TODO add link to FAQ
			m(".flex.mt", m(ButtonN, {
				label: () => "Confirm",
				click: () => okAction(),
				type: ButtonType.Login
			})),
			m(".flex-space-between", [
				m(ButtonN, {
					label: () => "Regenerate",
					click: () => updateAction(),
					type: ButtonType.Secondary
				}),
				m(ButtonN, {
					click: () => copyToClipboard(password()),
					label: () => "Copy",
					type: ButtonType.Secondary,
				}),
			])
		])
	}
}