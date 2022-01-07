import m, {Children, Component, Vnode} from "mithril"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {CredentialsInfo} from "../misc/credentials/CredentialsProvider"

export type CredentialsSelectorAttrs = {
	credentials: ReadonlyArray<CredentialsInfo>
	onCredentialsSelected: (arg0: CredentialsInfo) => unknown
	// will show the delete options if this is provided
	onCredentialsDeleted?: ((arg0: CredentialsInfo) => void) | null
}

export class CredentialsSelector implements Component<CredentialsSelectorAttrs> {
	view(vnode: Vnode<CredentialsSelectorAttrs>): Children {
		const a = vnode.attrs
		return a.credentials.map(c => {
			const buttons: Children = []
			const onCredentialsDeleted = a.onCredentialsDeleted
			buttons.push(
				m(ButtonN, {
					label: () => c.login,
					click: () => a.onCredentialsSelected(c),
					type: ButtonType.Login,
				}),
			)

			if (onCredentialsDeleted) {
				buttons.push(
					m(ButtonN, {
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