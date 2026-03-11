import { Dialog, DialogType } from "../../../common/gui/base/Dialog.js"
import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import { Contact } from "../../../common/api/entities/tutanota/TypeRefs.js"
import m from "mithril"
import { List, ListAttrs, ListState, MultiselectMode, RenderConfig } from "../../../common/gui/base/List.js"
import { component_size, px } from "../../../common/gui/size.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../../common/gui/base/DialogHeaderBar.js"
import { ButtonType } from "../../../common/gui/base/Button.js"
import { KindaContactRow } from "./ContactListView.js"
import { SelectAllCheckbox } from "../../../common/gui/SelectAllCheckbox.js"
import { theme } from "../../../common/gui/theme"
import { Card } from "../../../common/gui/base/Card"
import { ContentWithOptionsDialog } from "../../../common/gui/dialogs/ContentWithOptionsDialog"
import { ListModel, selectionAttrsForList } from "../../../common/misc/ListModel"
import { elementIdPart, isSameId, sortCompareById } from "../../../common/api/common/utils/EntityUtils"
import { noOp } from "@tutao/tutanota-utils"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import Stream from "mithril/stream"

export enum ContactSelectionDialogSize {
	Medium,
	Large,
}

export interface ContactSelectionDialogAttrs {
	titleText: TranslationKey
	okActionText: TranslationKey
	contentText?: TranslationKey
	dialogSize?: ContactSelectionDialogSize
	confirmActionText?: TranslationKey
}

/**
 * Show a dialog with a preview of a given list of contacts
 * @param attrs the ContactSelectionDialogAttrs to configure the dialog texts
 * @param contacts The contact list to be previewed
 * @param okAction The action to be executed when the user presses the confirm button with at least one contact selected
 */
export function showContactSelectionDialog(
	attrs: ContactSelectionDialogAttrs,
	contacts: Contact[],
	okAction: (dialog: Dialog, selectedContacts: Contact[]) => unknown,
) {
	const viewModel: ContactSelectionDialogViewModel = new ContactSelectionDialogViewModel(contacts, m.redraw)

	const renderConfig: RenderConfig<Contact, KindaContactRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			return new KindaContactRow(
				dom,
				(selectedContact: Contact) => viewModel.listModel.onSingleInclusiveSelection(selectedContact),
				() => true,
			)
		},
	}

	const dialogHeaderBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				type: ButtonType.Secondary,
				label: "close_alt",
				click: () => {
					dialog.close()
				},
			},
		],
		middle: attrs.titleText,
	}

	const dialog = new Dialog(DialogType.EditMedium, {
		view: () => {
			return m(
				".flex.col.border-radius",
				{
					style: {
						height: "100%",
						"background-color": theme.surface_container,
					},
				},
				[
					m(DialogHeaderBar, dialogHeaderBarAttrs),
					m(
						`${attrs.dialogSize === ContactSelectionDialogSize.Large ? ".dialog-max-height" : ""}.plr-24.flex-grow`,
						m(
							ContentWithOptionsDialog,
							{
								mainActionText: attrs.okActionText,
								mainActionClick: async () => {
									const selectedContacts = [...viewModel.listState().selectedItems]
									if (selectedContacts.length <= 0) {
										Dialog.message("noContact_msg")
									} else {
										if (attrs.confirmActionText) {
											return Dialog.confirm(attrs.confirmActionText).then((confirmed) => {
												if (confirmed) {
													okAction(dialog, selectedContacts)
												}
											})
										} else {
											okAction(dialog, selectedContacts)
										}
									}
								},
								subActionText: null,
								subActionClick: () => {},
							},
							[
								attrs.contentText ? m(Card, m("p.mt-8", lang.getTranslationText(attrs.contentText))) : null,
								m(
									".list-bg.border-radius.mt-8",
									m(SelectAllCheckbox, {
										style: {
											paddingLeft: 0,
										},
										...selectionAttrsForList(viewModel.listModel),
									}),
								),
								m(
									".flex.col.rel",
									{
										style: {
											marginLeft: px(-8),
											height: attrs.dialogSize === ContactSelectionDialogSize.Large ? "60vh" : "20vh",
										},
									},
									m(List, {
										renderConfig,
										state: viewModel.listState(),
										onLoadMore: noOp,
										onRangeSelectionTowards(contact: Contact) {
											viewModel.listModel.selectRangeTowards(contact)
										},
										onRetryLoading() {
											viewModel.listModel.retryLoading()
										},
										onSingleSelection(contact: Contact) {
											viewModel.listModel.onSingleInclusiveSelection(contact)
										},
										onSingleTogglingMultiselection(contact: Contact) {
											viewModel.listModel.onSingleInclusiveSelection(contact)
										},
										onStopLoading: noOp,
									} satisfies ListAttrs<Contact, KindaContactRow>),
								),
							],
						),
					),
				],
			)
		},
	})

	dialog.show()
}

class ContactSelectionDialogViewModel {
	private listModelStateStream: Stream<unknown> | null = null
	readonly listModel: ListModel<Contact, Id>

	constructor(
		readonly contacts: Contact[],
		readonly updateUi: () => void,
	) {
		this.listModel = new ListModel({
			fetch: (_, __) => {
				return Promise.resolve({ items: contacts, complete: true })
			},

			sortCompare: (item1, item2) => {
				return sortCompareById(item1, item2)
			},

			getItemId: (item) => elementIdPart(item._id),

			isSameId: (id1, id2) => isSameId(id1, id2),

			autoSelectBehavior: () => ListAutoSelectBehavior.NONE,
		})

		this.listModelStateStream = this.listModel.stateStream.map(() => {
			this.updateUi()
		})

		this.listModel.loadInitial().then(() => {
			this.listModel.selectAll()
		})
	}

	listState(): ListState<Contact> {
		return this.listModel.state
	}

	dispose() {
		this.listModelStateStream?.end(true)
		this.listModelStateStream = null
	}
}
