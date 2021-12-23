// @flow

import m from "mithril"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {CredentialsInfo} from "../misc/credentials/CredentialsProvider"

export type CredentialsSelectorAttrs = {
	credentials: $ReadOnlyArray<CredentialsInfo>;
	onCredentialsSelected: CredentialsInfo => mixed;
	// will show the delete options if this is provided
	onCredentialsDeleted?: ?(CredentialsInfo => void);
}

export class CredentialsSelector implements MComponent<CredentialsSelectorAttrs> {
	view(vnode: Vnode<CredentialsSelectorAttrs>): Children {
		const a = vnode.attrs
		return a.credentials.map(c => {
			const buttons = []
			const onCredentialsDeleted = a.onCredentialsDeleted
			buttons.push(m(ButtonN, {
				label: () => c.login,
				click: () => a.onCredentialsSelected(c),
				type: ButtonType.Login
			}))

			if (onCredentialsDeleted) {
				buttons.push(m(ButtonN, {
					label: "delete_action",
					click: () => onCredentialsDeleted(c),
					type: ButtonType.Secondary
				}))
			}
			return m(".flex-space-between.pt-l.child-grow.last-child-fixed", buttons)
		})
	}
}