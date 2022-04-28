import m from "mithril"
import type {RejectedSender} from "../api/entities/sys/TypeRefs.js"
import {TextFieldN} from "../gui/base/TextFieldN"
import stream from "mithril/stream"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"

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
export function showRejectedSendersInfoDialog(rejectedSender: RejectedSender) {
	const actionDialogProperties = {
		title: () => lang.get("details_label"),
		child: {
			view: () => {
				return [
					m(TextFieldN, {
						label: "emailSender_label",
						value: rejectedSender.senderMailAddress,
						disabled: true,
					}),
					m(TextFieldN, {
						label: "mailServer_label",
						value: `${rejectedSender.senderHostname} (${rejectedSender.senderIp})`,
						disabled: true,
					}),
					m(TextFieldN, {
						label: "emailRecipient_label",
						value: rejectedSender.recipientMailAddress,
						disabled: true,
					}),
					m(TextFieldN, {
						label: "rejectReason_label",
						value: rejectedSender.reason,
						disabled: true,
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