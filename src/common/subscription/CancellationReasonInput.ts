import m, { Children, Vnode } from "mithril"
import { lang } from "../misc/LanguageViewModel"
import { DropDownSelector, type DropDownSelectorAttrs } from "../gui/base/DropDownSelector.js"
import { TextField } from "../gui/base/TextField.js"

export type CancellationReasonInputAttrs = {
	category: NumberString | null
	reason: string
	categoryHandler: (category: NumberString | null) => unknown
	reasonHandler: (reason: string) => unknown
}

/**
 * Allows the user to specify why they want to delete or downgrade their account.
 */
export class CancellationReasonInput {
	view(vnode: Vnode<CancellationReasonInputAttrs>): Children {
		return [
			m(".mt.pb-s.b.center", lang.get("cancellationInfo_msg")),
			m(DropDownSelector, {
				label: () => lang.get("whyLeave_msg"),
				items: [
					{
						name: lang.get("experienceSamplingAnswer_label"),
						value: null,
					},
					{
						name: lang.get("cancellationReasonUsability_label"),
						value: "1",
					},
					{
						name: lang.get("cancellationReasonUI_label"),
						value: "2",
					},
					{
						name: lang.get("cancellationReasonPrice_label"),
						value: "3",
					},
					{
						name: lang.get("cancellationReasonSearch_label"),
						value: "4",
					},
					{
						name: lang.get("cancellationReasonSpam_label"),
						value: "5",
					},
					{
						name: lang.get("cancellationReasonImap_label"),
						value: "6",
					},
					{
						name: lang.get("cancellationReasonImport_label"),
						value: "7",
					},
					{
						name: lang.get("cancellationReasonLabels_label"),
						value: "8",
					},
					{
						name: lang.get("cancellationReasonOtherFeature_label"),
						value: "9",
					},
					{
						name: lang.get("cancellationReasonNoNeed_label"),
						value: "10",
					},
					{
						name: lang.get("cancellationReasonOther_label"),
						value: "11",
					},
				],
				selectedValue: vnode.attrs.category,
				selectionChangedHandler: vnode.attrs.categoryHandler,
				dropdownWidth: 350,
			} satisfies DropDownSelectorAttrs<NumberString | null>),
			m(TextField, {
				label: "enterDetails_msg",
				value: vnode.attrs.reason,
				oninput: vnode.attrs.reasonHandler,
				helpLabel: () => lang.get("cancellationConfirmation_msg"),
			}),
		]
	}
}
