import m, { Children, Component, Vnode } from "mithril"
import { Button, ButtonType } from "../gui/base/Button.js"
import type { CredentialsInfo } from "../misc/credentials/CredentialsProvider.js"

export type CredentialsSelectorAttrs = {
	credentials: ReadonlyArray<CredentialsInfo>
	onCredentialsSelected: (arg0: CredentialsInfo) => unknown
	// will show the delete options if this is provided
	onCredentialsDeleted?: ((arg0: CredentialsInfo) => void) | null
}

export class CredentialsSelector implements Component<CredentialsSelectorAttrs> {
	view(vnode: Vnode<CredentialsSelectorAttrs>): Children {
		const a = vnode.attrs
		return a.credentials.map((c) => {
			const buttons: Children = []
			const onCredentialsDeleted = a.onCredentialsDeleted
			buttons.push(
				m(Button, {
					label: () => c.login,
					click: () => a.onCredentialsSelected(c),
					type: ButtonType.Login,
				}),
			)

			if (onCredentialsDeleted) {
				buttons.push(
					m(Button, {
						label: "delete_action",
						click: () => onCredentialsDeleted(c),
						type: ButtonType.Secondary,
					}),
				)
			}

			return m(".flex-space-between.pt-l.child-grow.last-child-fixed", buttons)
		})
	}
}
