import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../gui/base/ViewColumn"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { FeatureType, Keys, MailFolderType } from "../../api/common/TutanotaConstants"
import { assertMainOrNode } from "../../api/common/Env"
import { keyManager, Shortcut } from "../../misc/KeyManager"
import { NavButton, NavButtonColor } from "../../gui/base/NavButton.js"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { Contact, ContactTypeRef, Mail, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { SearchListView, SearchListViewAttrs } from "./SearchListView"
import { size } from "../../gui/size"
import { getFreeSearchStartDate, SEARCH_MAIL_FIELDS } from "../model/SearchUtils"
import { Dialog } from "../../gui/base/Dialog"
import { locator } from "../../api/main/MainLocator"
import { getIndentedFolderNameForDropdown } from "../../mail/model/MailUtils"
import { getFirstOrThrow, isSameDay, isSameTypeRef, isSameTypeRefNullable, lazyMemoized, noOp, ofClass, TypeRef } from "@tutao/tutanota-utils"
import { formatDateWithMonth, formatDateWithTimeIfNotEven } from "../../misc/Formatter"
import { Icons } from "../../gui/base/icons/Icons"
import { AppHeaderAttrs, Header } from "../../gui/Header.js"
import { ButtonType } from "../../gui/base/Button.js"
import { PermissionError } from "../../api/common/error/PermissionError"
import { ContactEditor } from "../../contacts/ContactEditor"
import { styles } from "../../gui/styles"
import { FolderColumnView } from "../../gui/FolderColumnView.js"
import { getGroupInfoDisplayName } from "../../api/common/utils/GroupUtils"
import { isNewMailActionAvailable } from "../../gui/nav/NavFunctions"
import { TextField } from "../../gui/base/TextField.js"
import { SidebarSection } from "../../gui/SidebarSection"
import type { clickHandler } from "../../gui/base/GuiUtils"
import { DropDownSelector, SelectorItem } from "../../gui/base/DropDownSelector.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { BottomNav } from "../../gui/nav/BottomNav.js"
import { MobileMailActionBar } from "../../mail/view/MobileMailActionBar.js"
import { DrawerMenuAttrs } from "../../gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { getContactSelectionMessage, MultiContactViewer } from "../../contacts/view/MultiContactViewer.js"
import { ContactCardViewer } from "../../contacts/view/ContactCardViewer.js"
import { getMailSelectionMessage, MultiItemViewer } from "../../mail/view/MultiItemViewer.js"
import { ConversationViewer } from "../../mail/view/ConversationViewer.js"
import { ContactViewerActions } from "../../contacts/view/ContactViewerActions.js"
import { confirmMerge, deleteContacts, writeMail } from "../../contacts/view/ContactView.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../gui/theme.js"
import { searchBar } from "../SearchBar.js"
import { MobileMailMultiselectionActionBar } from "../../mail/view/MobileMailMultiselectionActionBar.js"
import { exportContacts } from "../../contacts/VCardExporter.js"
import { BackgroundColumnLayout } from "../../gui/BackgroundColumnLayout.js"
import { DesktopListToolbar, DesktopViewerToolbar } from "../../gui/DesktopToolbars.js"
import { MailViewerActions } from "../../mail/view/MailViewerToolbar.js"
import { BaseMobileHeader } from "../../gui/BaseMobileHeader.js"
import { ProgressBar } from "../../gui/base/ProgressBar.js"
import { EnterMultiselectIconButton } from "../../gui/EnterMultiselectIconButton.js"
import { MobileHeader, MobileHeaderMenuButton } from "../../gui/MobileHeader.js"
import { MobileContactActionBar } from "../../contacts/view/MobileContactActionBar.js"
import { MobileBottomActionBar } from "../../gui/MobileBottomActionBar.js"
import {
	archiveMails,
	getConversationTitle,
	getMoveMailBounds,
	moveToInbox,
	showDeleteConfirmationDialog,
	showMoveMailsDropdown,
} from "../../mail/view/MailGuiUtils.js"
import { SelectAllCheckbox } from "../../gui/SelectAllCheckbox.js"
import { selectionAttrsForList } from "../../misc/ListModel.js"
import { MultiselectMobileHeader } from "../../gui/MultiselectMobileHeader.js"
import { MultiselectMode } from "../../gui/base/List.js"
import { PaidFunctionResult, SearchViewModel } from "./SearchViewModel.js"
import { NotFoundError } from "../../api/common/error/RestError.js"
import { showNotAvailableForFreeDialog } from "../../misc/SubscriptionDialogs.js"
import { showDateRangeSelectionDialog } from "../../gui/date/DatePickerDialog.js"
import { MailFilterButton } from "../../mail/view/MailFilterButton.js"
import { listSelectionKeyboardShortcuts } from "../../gui/base/ListUtils.js"
import { getElementId, isSameId } from "../../api/common/utils/EntityUtils.js"

assertMainOrNode()

export interface SearchViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	makeViewModel: () => SearchViewModel
}

export class SearchView extends BaseTopLevelView implements TopLevelView<SearchViewAttrs> {
	private readonly resultListColumn: ViewColumn
	private readonly resultDetailsColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private readonly searchViewModel: SearchViewModel

	constructor(vnode: Vnode<SearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()

		this.folderColumn = new ViewColumn(
			{
				view: () => {
					const restriction = this.searchViewModel.getRestriction()
					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: this.getMainButton(restriction.type),
						content: [
							m(
								SidebarSection,
								{
									name: "search_label",
								},
								[
									m(
										".folder-row.flex-start.mlr-button",
										m(NavButton, {
											label: "emails_label",
											icon: () => BootIcons.Mail,
											href: () => "/search/mail",
											isSelectedPrefix: "/search/mail",
											colors: NavButtonColor.Nav,
											persistentBackground: true,
										}),
									),
									m(
										".folder-row.flex-start.mlr-button",
										m(NavButton, {
											label: "contacts_label",
											icon: () => BootIcons.Contacts,
											href: "/search/contact",
											colors: NavButtonColor.Nav,
											persistentBackground: true,
										}),
									),
								],
							),
							this.searchViewModel.lastType && isSameTypeRef(this.searchViewModel.lastType, MailTypeRef)
								? m(
										SidebarSection,
										{
											name: "filter_label",
										},
										this.renderSearchFilters(),
								  )
								: null,
						],
						ariaLabel: "search_label",
					})
				},
			},
			ColumnType.Foreground,
			size.first_col_min_width,
			size.first_col_max_width,
			() => lang.get("search_label"),
		)

		this.resultListColumn = new ViewColumn(
			{
				view: () => {
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.navigation_bg,
						desktopToolbar: () =>
							m(DesktopListToolbar, [
								this.searchViewModel.listModel
									? [
											m(SelectAllCheckbox, selectionAttrsForList(this.searchViewModel.listModel)),
											isSameTypeRefNullable(this.searchViewModel.lastType, MailTypeRef) ? this.renderFilterButton() : null,
									  ]
									: m(".button-height"),
							]),
						mobileHeader: () => this.renderMobileListHeader(vnode.attrs.header),
						columnLayout: this.searchViewModel.lastType
							? m(SearchListView, {
									listModel: this.searchViewModel.listModel,
									currentType: this.searchViewModel.lastType,
									onSingleSelection: (item) => {
										this.viewSlider.focus(this.resultDetailsColumn)

										if (isSameTypeRef(item.entry._type, MailTypeRef)) {
											// Make sure that we mark mail as read if you select the mail again, even if it was selected before.
											// Do it in the next even loop to not rely on what is called first, listModel or us. ListModel changes are
											// sync so this should be enough.
											Promise.resolve().then(() => {
												const conversationViewModel = this.searchViewModel.conversationViewModel
												if (conversationViewModel && isSameId(item._id, conversationViewModel.primaryMail._id)) {
													conversationViewModel?.primaryViewModel().setUnread(false)
												}
											})
										}
									},
									isFreeAccount: locator.logins.getUserController().isFreeAccount(),
							  } satisfies SearchListViewAttrs)
							: null,
					})
				},
			},
			ColumnType.Background,
			size.second_col_min_width,
			size.second_col_max_width,
			() => lang.get("searchResult_label"),
		)
		this.resultDetailsColumn = new ViewColumn(
			{
				view: () => this.renderDetailsView(vnode.attrs.header),
			},
			ColumnType.Background,
			size.third_col_min_width,
			size.third_col_max_width,
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.resultListColumn, this.resultDetailsColumn])
	}

	oncreate(): void {
		this.searchViewModel.init()

		keyManager.registerShortcuts(this.shortcuts())
	}

	onremove(): void {
		this.searchViewModel.dispose()

		keyManager.unregisterShortcuts(this.shortcuts())
	}

	private renderMobileListHeader(header: AppHeaderAttrs) {
		return this.searchViewModel.listModel && this.searchViewModel.listModel?.state.inMultiselect
			? m(MultiselectMobileHeader, {
					...selectionAttrsForList(this.searchViewModel.listModel),
					message:
						getCurrentSearchMode() === "mail"
							? getMailSelectionMessage(this.searchViewModel.getSelectedMails())
							: getContactSelectionMessage(this.searchViewModel.getSelectedContacts().length),
			  })
			: m(BaseMobileHeader, {
					left: m(MobileHeaderMenuButton, { ...header, backAction: () => this.viewSlider.focusPreviousColumn() }),
					right: [
						isSameTypeRefNullable(this.searchViewModel.lastType, MailTypeRef) ? this.renderFilterButton() : null,
						m(EnterMultiselectIconButton, {
							clickAction: () => {
								this.searchViewModel.listModel?.enterMultiselect()
							},
						}),
						styles.isSingleColumnLayout() ? this.renderHeaderRightView() : null,
					],
					center: m(
						".flex-grow.flex.justify-center",
						m(searchBar, {
							placeholder: this.searchBarPlaceholder(),
							returnListener: () => this.resultListColumn.focus(),
						}),
					),
					injections: m(ProgressBar, { progress: header.offlineIndicatorModel.getProgress() }),
			  })
	}

	/** depending on the search and selection state we want to render a
	 * (multi) mail viewer or a (multi) contact viewer
	 */
	private renderDetailsView(header: AppHeaderAttrs): Children {
		if (getCurrentSearchMode() === "contact") {
			const selectedContacts = this.searchViewModel.getSelectedContacts()

			const actions = m(ContactViewerActions, {
				contacts: selectedContacts,
				onEdit: (c: Contact) => new ContactEditor(locator.entityClient, c).show(),
				onDelete: deleteContacts,
				onMerge: confirmMerge,
				onExport: exportContacts,
			})
			const isMultiselect = this.searchViewModel.listModel?.state.inMultiselect || selectedContacts.length === 0
			return m(BackgroundColumnLayout, {
				backgroundColor: theme.navigation_bg,
				desktopToolbar: () => m(DesktopViewerToolbar, actions),
				mobileHeader: () =>
					m(MobileHeader, {
						...header,
						backAction: () => this.viewSlider.focusPreviousColumn(),
						columnType: "other",
						title: lang.get("search_label"),
						actions: null,
						multicolumnActions: () => actions,
						primaryAction: () => this.renderHeaderRightView(),
					}),
				columnLayout:
					// see comment for .scrollbar-gutter-stable-or-fallback
					m(
						".fill-absolute.flex.col.overflow-y-scroll",
						isMultiselect
							? m(MultiContactViewer, {
									selectedEntities: selectedContacts,
									selectNone: () => this.searchViewModel.listModel.selectNone(),
							  })
							: m(ContactCardViewer, { contact: selectedContacts[0], onWriteMail: writeMail }),
					),
			})
		} else if (getCurrentSearchMode() === "mail") {
			const selectedMails = this.searchViewModel.getSelectedMails()

			const conversationViewModel = this.searchViewModel.conversationViewModel
			if (this.searchViewModel.listModel?.state.inMultiselect || !conversationViewModel) {
				const actions = m(MailViewerActions, {
					mailModel: locator.mailModel,
					mails: selectedMails,
					selectNone: () => this.searchViewModel.listModel.selectNone(),
				})
				return m(BackgroundColumnLayout, {
					backgroundColor: theme.navigation_bg,
					desktopToolbar: () => m(DesktopViewerToolbar, actions),
					mobileHeader: () =>
						m(MobileHeader, {
							...header,
							backAction: () => this.viewSlider.focusPreviousColumn(),
							columnType: "other",
							title: getMailSelectionMessage(selectedMails),
							actions: null,
							multicolumnActions: () => actions,
							primaryAction: () => this.renderHeaderRightView(),
						}),
					columnLayout: m(MultiItemViewer, {
						selectedEntities: selectedMails,
						selectNone: () => this.searchViewModel.listModel.selectNone(),
						loadAll: () => this.searchViewModel.loadAll(),
						stopLoadAll: () => this.searchViewModel.stopLoadAll(),
						loadingAll:
							this.searchViewModel.loadingAllForSearchResult != null
								? "loading"
								: this.searchViewModel.listModel?.isLoadedCompletely()
								? "loaded"
								: "can_load",
						getSelectionMessage: (selected: ReadonlyArray<Mail>) => getMailSelectionMessage(selected),
					}),
				})
			} else {
				const actions = m(MailViewerActions, {
					mailModel: conversationViewModel.primaryViewModel().mailModel,
					mailViewerViewModel: conversationViewModel.primaryViewModel(),
					mails: [conversationViewModel.primaryMail],
				})
				return m(BackgroundColumnLayout, {
					backgroundColor: theme.navigation_bg,
					desktopToolbar: () => m(DesktopViewerToolbar, actions),
					mobileHeader: () =>
						m(MobileHeader, {
							...header,
							backAction: () => this.viewSlider.focusPreviousColumn(),
							columnType: "other",
							title: getConversationTitle(conversationViewModel),
							actions: null,
							multicolumnActions: () => actions,
							primaryAction: () => this.renderHeaderRightView(),
						}),
					columnLayout: m(ConversationViewer, {
						// Re-create the whole viewer and its vnode tree if email has changed
						key: getElementId(conversationViewModel.primaryMail),
						viewModel: conversationViewModel,
						delayBodyRendering: Promise.resolve(),
					}),
				})
			}
		} else {
			return m(
				".flex.col.fill-absolute",
				// Using contactViewToolbar because it will display empty
				m(ContactViewerActions, { contacts: [], onExport: noOp, onMerge: noOp, onDelete: noOp, onEdit: noOp }),
				m(
					".flex-grow.rel.overflow-hidden",
					m(ColumnEmptyMessageBox, {
						message: () => lang.get("noSelection_msg"),
						color: theme.content_message_bg,
						backgroundColor: theme.navigation_bg,
					}),
				),
			)
		}
	}

	view({ attrs }: Vnode<SearchViewAttrs>): Children {
		return m(
			"#search.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					searchBar: () =>
						m(searchBar, {
							placeholder: this.searchBarPlaceholder(),
							returnListener: () => this.resultListColumn.focus(),
						}),
					...attrs.header,
				}),
				bottomNav:
					styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.resultDetailsColumn && this.searchViewModel.conversationViewModel
						? m(MobileMailActionBar, { viewModel: this.searchViewModel.conversationViewModel?.primaryViewModel() })
						: styles.isSingleColumnLayout() &&
						  this.searchViewModel.listModel &&
						  this.searchViewModel.listModel.state.inMultiselect &&
						  getCurrentSearchMode() === "mail"
						? m(MobileMailMultiselectionActionBar, {
								mails: this.searchViewModel.getSelectedMails(),
								selectNone: () => this.searchViewModel.listModel.selectNone(),
								mailModel: locator.mailModel,
						  })
						: getCurrentSearchMode() === "contact" &&
						  styles.isSingleColumnLayout() &&
						  this.viewSlider.focusedColumn === this.resultDetailsColumn &&
						  !this.searchViewModel.listModel?.state.inMultiselect
						? m(MobileContactActionBar, {
								editAction: () => new ContactEditor(locator.entityClient, this.searchViewModel.getSelectedContacts()[0]).show(),
								deleteAction: () => deleteContacts(this.searchViewModel.getSelectedContacts()),
						  })
						: styles.isSingleColumnLayout() &&
						  this.viewSlider.focusedColumn === this.resultListColumn &&
						  this.searchViewModel.listModel?.state.inMultiselect
						? m(
								MobileBottomActionBar,
								m(ContactViewerActions, {
									contacts: this.searchViewModel.getSelectedContacts(),
									onEdit: () => new ContactEditor(locator.entityClient, getFirstOrThrow(this.searchViewModel.getSelectedContacts())).show(),
									onDelete: deleteContacts,
									onMerge: confirmMerge,
									onExport: exportContacts,
								}),
						  )
						: m(BottomNav),
			}),
		)
	}

	private searchBarPlaceholder() {
		return lang.get(m.route.get().startsWith("/search/mail") ? "searchEmails_placeholder" : "searchContacts_placeholder")
	}

	private getAvailableMailFolders(): SelectorItem<Id | null>[] {
		const mailboxes = this.searchViewModel.mailboxes

		const availableMailFolders: SelectorItem<Id | null>[] = [
			{
				name: lang.get("all_label"),
				value: null,
				indentationLevel: 0,
			},
		]

		for (const mailbox of mailboxes) {
			const mailboxIndex = mailboxes.indexOf(mailbox)
			const mailFolders = mailbox.folders.getIndentedList()
			for (const folderInfo of mailFolders) {
				if (folderInfo.folder.folderType !== MailFolderType.SPAM) {
					const mailboxLabel = mailboxIndex === 0 ? "" : ` (${getGroupInfoDisplayName(mailbox.mailGroupInfo)})`
					availableMailFolders.push({
						name: getIndentedFolderNameForDropdown(folderInfo) + mailboxLabel,
						value: folderInfo.folder.mails,
					})
				}
			}
		}
		return availableMailFolders
	}

	private renderSearchFilters(): Children {
		const availableMailFolders = this.getAvailableMailFolders()
		const availableMailFields = SEARCH_MAIL_FIELDS.map((f) => ({ name: lang.get(f.textId), value: f.field }))
		return [
			this.renderTimeField(),
			m("div.mlr-button", [
				m(DropDownSelector, {
					label: "field_label",
					items: availableMailFields,
					selectedValue: this.searchViewModel.selectedMailField,
					selectionChangedHandler: async (newValue: string | null) => {
						const result = await this.searchViewModel.setSelectedField(newValue)
						if (result === PaidFunctionResult.PaidSubscriptionNeeded) {
							showNotAvailableForFreeDialog()
						} else {
							this.searchAgain()
						}
					},
					dropdownWidth: 250,
				}),
				availableMailFolders.length > 0
					? m(DropDownSelector, {
							label: "mailFolder_label",
							items: availableMailFolders,
							selectedValue: this.searchViewModel.selectedMailFolder,
							selectionChangedHandler: async (newValue: string | null) => {
								const result = await this.searchViewModel.selectMailFolder(newValue)
								if (result === PaidFunctionResult.PaidSubscriptionNeeded) {
									showNotAvailableForFreeDialog()
								} else {
									this.searchAgain()
								}
							},
							dropdownWidth: 250,
					  })
					: null,
			]),
		].map((row) => m(".folder-row.plr-button.content-fg", row))
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	private renderHeaderRightView(): Children {
		const restriction = this.searchViewModel.getRestriction()
		return styles.isUsingBottomNavigation()
			? isSameTypeRef(restriction.type, MailTypeRef) && isNewMailActionAvailable()
				? m(IconButton, {
						click: () => {
							newMailEditor()
								.then((editor) => editor.show())
								.catch(ofClass(PermissionError, noOp))
						},
						title: "newMail_action",
						icon: Icons.PencilSquare,
				  })
				: isSameTypeRef(restriction.type, ContactTypeRef)
				? m(IconButton, {
						click: () => {
							locator.contactModel.contactListId().then((contactListId) => {
								new ContactEditor(locator.entityClient, null, contactListId ?? undefined).show()
							})
						},
						title: "newContact_action",
						icon: Icons.Add,
				  })
				: null
			: null
	}

	private renderTimeField(): Children {
		let end: string
		let start: string

		if (locator.logins.getUserController().isFreeAccount()) {
			end = lang.get("today_label")
			start = formatDateWithMonth(getFreeSearchStartDate())
		} else {
			if (this.searchViewModel.endDate) {
				end = formatDateWithTimeIfNotEven(this.searchViewModel.endDate)
			} else {
				end = lang.get("today_label")
			}

			if (this.searchViewModel.startDate) {
				start = formatDateWithTimeIfNotEven(this.searchViewModel.startDate)
			} else {
				let currentIndexDate = this.searchViewModel.getCurrentMailIndexDate()

				if (currentIndexDate) {
					if (isSameDay(currentIndexDate, new Date())) {
						start = lang.get("today_label")
					} else {
						start = formatDateWithTimeIfNotEven(currentIndexDate)
					}
				} else {
					start = lang.get("unlimited_label")
				}
			}
		}

		const timeDisplayValue = start + " - " + end
		return m(TextField, {
			label: "periodOfTime_label",
			value: timeDisplayValue,
			disabled: true,
			class: "plr-button",
			injectionsRight: () =>
				m(IconButton, {
					title: "selectPeriodOfTime_label",
					click: async () => {
						if (this.searchViewModel.canSelectTimePeriod()) {
							const period = await showDateRangeSelectionDialog(
								this.searchViewModel.getStartOfTheWeekOffset(),
								this.searchViewModel.startDate ?? this.searchViewModel.getCurrentMailIndexDate() ?? new Date(),
								this.searchViewModel.endDate ?? new Date(),
							)
							const result = await this.searchViewModel.selectTimePeriod(period)
							if (result === PaidFunctionResult.PaidSubscriptionNeeded) {
								await showNotAvailableForFreeDialog()
							} else {
								this.searchAgain()
							}
						} else {
							await showNotAvailableForFreeDialog()
						}
					},
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
		})
	}

	private searchAgain() {
		this.searchViewModel.searchAgain(() => this.confirmSearch())
	}

	private confirmSearch() {
		return Dialog.confirm("continueSearchMailbox_msg", "search_label")
	}

	private readonly shortcuts = lazyMemoized<ReadonlyArray<Shortcut>>(() => [
		...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.searchViewModel.listModel),
		{
			key: Keys.N,
			exec: () => {
				const type = this.searchViewModel.lastType

				if (type && isSameTypeRef(type, MailTypeRef)) {
					newMailEditor()
						.then((editor) => editor.show())
						.catch(ofClass(PermissionError, noOp))
				} else if (type && isSameTypeRef(type, ContactTypeRef)) {
					locator.contactModel.contactListId().then((contactListId) => {
						new ContactEditor(locator.entityClient, null, contactListId ?? undefined).show()
					})
				}
			},
			enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.ReplyOnly),
			help: "newMail_action",
		},
		{
			key: Keys.DELETE,
			exec: () => this.deleteSelected(),
			help: "delete_action",
		},
		{
			key: Keys.A,
			exec: () => this.archiveSelected(),
			help: "archive_action",
			enabled: () => getCurrentSearchMode() === "mail",
		},
		{
			key: Keys.I,
			exec: () => this.moveSelectedToInbox(),
			help: "moveToInbox_action",
			enabled: () => getCurrentSearchMode() === "mail",
		},
		{
			key: Keys.V,
			exec: () => this.move(),
			help: "move_action",
			enabled: () => getCurrentSearchMode() === "mail",
		},
		{
			key: Keys.U,
			exec: () => this.toggleUnreadStatus(),
			help: "toggleUnread_action",
			enabled: () => getCurrentSearchMode() === "mail",
		},
	])

	async onNewUrl(args: Record<string, any>, requestedPath: string) {
		// calling init here too because this is called very early in the lifecycle and onNewUrl won't work properly if init is called
		// afterwards
		await this.searchViewModel.init()
		this.searchViewModel.onNewUrl(args, requestedPath)
		// redraw because init() is async
		m.redraw()
	}

	private getMainButton(typeRef: TypeRef<unknown>): {
		type: ButtonType
		label: TranslationKey
		click: clickHandler
	} | null {
		if (styles.isUsingBottomNavigation()) {
			return null
		} else if (isSameTypeRef(typeRef, MailTypeRef) && isNewMailActionAvailable()) {
			return {
				type: ButtonType.FolderColumnHeader,
				click: () => {
					newMailEditor()
						.then((editor) => editor.show())
						.catch(ofClass(PermissionError, noOp))
				},
				label: "newMail_action",
			}
		} else if (isSameTypeRef(typeRef, ContactTypeRef)) {
			return {
				type: ButtonType.FolderColumnHeader,
				click: () => {
					locator.contactModel.contactListId().then((contactListId) => {
						new ContactEditor(locator.entityClient, null, contactListId ?? undefined).show()
					})
				},
				label: "newContact_action",
			}
		} else {
			return null
		}
	}

	private archiveSelected(): void {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) {
				this.searchViewModel.listModel.selectNone()
			}

			archiveMails(selectedMails)
		}
	}

	private moveSelectedToInbox(): void {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			if (selectedMails.length > 1) {
				this.searchViewModel.listModel.selectNone()
			}

			moveToInbox(selectedMails)
		}
	}

	private move() {
		const selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			showMoveMailsDropdown(locator.mailModel, getMoveMailBounds(), selectedMails, {
				onSelected: () => {
					if (selectedMails.length > 1) {
						this.searchViewModel.listModel.selectNone()
					}
				},
			})
		}
	}

	private toggleUnreadStatus(): void {
		let selectedMails = this.searchViewModel.getSelectedMails()

		if (selectedMails.length > 0) {
			locator.mailModel.markMails(selectedMails, !selectedMails[0].unread)
		}
	}

	private deleteSelected(): void {
		if (this.searchViewModel.listModel.state.selectedItems.size > 0) {
			if (this.searchViewModel.lastType && isSameTypeRef(this.searchViewModel.lastType, MailTypeRef)) {
				const selected = this.searchViewModel.getSelectedMails()
				showDeleteConfirmationDialog(selected).then((confirmed) => {
					if (confirmed) {
						if (selected.length > 1) {
							// is needed for correct selection behavior on mobile
							this.searchViewModel.listModel.selectNone()
						}

						locator.mailModel.deleteMails(selected)
					}
				})
			} else if (this.searchViewModel.lastType && isSameTypeRef(this.searchViewModel.lastType, ContactTypeRef)) {
				Dialog.confirm("deleteContacts_msg").then((confirmed) => {
					const selected = this.searchViewModel.getSelectedContacts()
					if (confirmed) {
						if (selected.length > 1) {
							// is needed for correct selection behavior on mobile
							this.searchViewModel.listModel.selectNone()
						}

						for (const contact of selected) {
							locator.entityClient.erase(contact).catch(
								ofClass(NotFoundError, (_) => {
									// ignore because the delete key shortcut may be executed again while the contact is already deleted
								}),
							)
						}
					}
				})
			}
		}
	}

	private renderFilterButton(): Children {
		return m(MailFilterButton, { filter: this.searchViewModel.mailFilter, setFilter: (filter) => this.searchViewModel.setMailFilter(filter) })
	}
}

function getCurrentSearchMode() {
	return m.route.get().startsWith("/search/contact") ? "contact" : "mail"
}

async function newMailEditor(): Promise<Dialog> {
	const [mailboxDetails, { newMailEditor }] = await Promise.all([locator.mailModel.getUserMailboxDetails(), import("../../mail/editor/MailEditor")])
	return newMailEditor(mailboxDetails)
}
