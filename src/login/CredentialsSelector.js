// @flow

import m from "mithril"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"

export type CredentialsSelectorAttrs = {
	credentials: Stream<Credentials[]>;
	isDeleteCredentials: Stream<boolean>;
	onCredentialsSelected: Credentials => void;
	onCredentialsDelete: Credentials => void;
}

export class CredentialsSelector implements MComponent<CredentialsSelectorAttrs> {
	view(vnode: Vnode<CredentialsSelectorAttrs>): Children {
		let a = vnode.attrs
		return a.credentials().map(c => {
			const buttons = []
			buttons.push(m(ButtonN, {
				label: () => c.mailAddress,
				click: () => a.onCredentialsSelected(c),
				type: ButtonType.Login
			}))

			if (a.isDeleteCredentials()) {
				buttons.push(m(ButtonN, {
					label: "delete_action",
					click: () => a.onCredentialsDelete(c),
					type: ButtonType.Secondary
				}))
			}
			return m(".flex-space-between.pt-l.child-grow.last-child-fixed", buttons)
		})
	}
}