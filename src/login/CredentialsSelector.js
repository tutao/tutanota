// @flow

import m from "mithril"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"

export type CredentialsSelectorAttrs = {
	credentials: Credentials[];
	onCredentialsSelected: Credentials => void;
	// will show the delete options if this is provided
	onCredentialsDeleted?: ?(Credentials => void);
}

export class CredentialsSelector implements MComponent<CredentialsSelectorAttrs> {
	view(vnode: Vnode<CredentialsSelectorAttrs>): Children {
		const a = vnode.attrs
		return a.credentials.map(c => {
			const buttons = []
			const onCredentialsDeleted = a.onCredentialsDeleted
			buttons.push(m(ButtonN, {
				label: () => c.mailAddress,
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