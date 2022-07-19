import m, {Children, Component, Vnode} from "mithril"
import {Dialog} from "../../gui/base/Dialog"
import {PasswordGenerator} from "./PasswordGenerator"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {locator} from "../../api/main/MainLocator"
import {px} from "../../gui/size"
import {copyToClipboard} from "../ClipboardUtils"
import {state} from "../../app.js"
import {assertNotNull} from "@tutao/tutanota-utils"

let dictionary: string[] | null = null

/**
 * Show a dialog to generate a random passphrase
 * @returns a promise containing the generated password
 */
export async function showPasswordGeneratorDialog(): Promise<string> {
	if (dictionary == null) {
		const baseUrl = location.protocol + "//" + location.hostname + (location.port ? (":" + location.port) : "") + assertNotNull(state.prefixWithoutFile)
		dictionary = await fetch(baseUrl + "/wordlibrary.json").then((response) => response.json())
	}

	let password = ""
	const pwGenerator = new PasswordGenerator(locator.random, dictionary!)

	return new Promise((resolve) => {
		const insertPasswordOkAction = () => {
			resolve(password)
			dialog.close()
		}

		const updateAction = async () => {
			password = await pwGenerator.generateRandomPassphrase()
			m.redraw()
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

interface PasswordGeneratorDialogAttrs {
	okAction: () => void
	updateAction: () => void
	password: string
}

class PasswordGeneratorDialog implements Component<PasswordGeneratorDialogAttrs> {
	view(vnode: Vnode<PasswordGeneratorDialogAttrs>): Children {
		const {updateAction, okAction, password} = vnode.attrs
		return m("", [
			m(".editor-border.mt.flex.center-horizontally.center-vertically", {
				style: {
					minHeight: px(65) // needs 65px for displaying two rows
				}
			}, m(".center.b.monospace", password)),
			m(".small.mt-xs", "This is a secure and easy to remember passphrase generated from a large dictionary. Find out why it is secure FAQ."), // TODO add link to FAQ
			m(".flex-end", [
				m(ButtonN, {
					label: () => "Regenerate",
					click: () => updateAction(),
					type: ButtonType.Secondary
				}),
				m(ButtonN, {
					click: () => copyToClipboard(password),
					label: () => "Copy",
					type: ButtonType.Secondary,
				}),
			]),
			m(".flex", m(ButtonN, {
				label: () => "Confirm",
				click: () => okAction(),
				type: ButtonType.Login
			})),
		])
	}
}