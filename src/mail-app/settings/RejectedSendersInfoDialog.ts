import m from "mithril"
import { LegacyTextField } from "../../common/gui/base/LegacyTextField.js"
import { Dialog } from "../../common/gui/base/Dialog"
import { sysTypeRefs } from "@tutao/typerefs"

/*
label: TranslationKey | lazy<string>,
	value: Stream<string>,
	preventAutofill?: boolean,
	type?: TextFieldType,
	helpLabel?: ?lazy<Children>,
	alignRight?: boolean,
	injectionsLeft?: lazy<Children>, // only used by the BubbleTextField to display bubbles
	injectionsRight?: lazy<Children>,
	keyHandler?: keyHandler, // interceptor used by the BubbleTextField to react on certain keys
	onfocus?: (dom: HTMLElement, input: HTMLInputElement) => mixed,
	onblur?: Function,
	maxWidth?: number,
	class?: string,
*/
export function showRejectedSendersInfoDialog(rejectedSender: sysTypeRefs.RejectedSender) {
	const actionDialogProperties = {
		title: "details_label",
		child: {
			view: () => {
				return [
					m(LegacyTextField, {
						label: "emailSender_label",
						value: rejectedSender.senderMailAddress,
						isReadOnly: true,
					}),
					m(LegacyTextField, {
						label: "mailServer_label",
						value: `${rejectedSender.senderHostname} (${rejectedSender.senderIp})`,
						isReadOnly: true,
					}),
					m(LegacyTextField, {
						label: "emailRecipient_label",
						value: rejectedSender.recipientMailAddress,
						isReadOnly: true,
					}),
					m(LegacyTextField, {
						label: "rejectReason_label",
						value: rejectedSender.reason,
						isReadOnly: true,
					}),
				]
			},
		},
		okAction: null,
		allowCancel: true,
		allowOkWithReturn: false,
		cancelActionTextId: "close_alt",
	} as const
	Dialog.showActionDialog(actionDialogProperties)
}
