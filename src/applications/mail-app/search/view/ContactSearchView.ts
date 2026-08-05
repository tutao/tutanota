import { TopLevelAttrs, TopLevelView } from "../../../../ui/base/TopLevelView"
import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { ColumnType, ViewColumn } from "../../../../ui/base/ViewColumn"
import m, { Children, Vnode } from "mithril"
import { ContactSearchViewModel } from "./ContactSearchViewModel"
import { AppHeaderAttrs, Header } from "../../../../ui/Header"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { SidebarSection } from "../../../../ui/SidebarSection"
import { layout_size } from "../../../../ui/size"
import { locator } from "../../../common/api/main/CommonLocator"
import { ContactEditor } from "../../contacts/ContactEditor"
import { assertNotNull, getFirstOrThrow, isNotEmpty, lazyMemoized } from "@tutao/utils"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { ClickHandler } from "../../../../ui/base/GuiUtils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { AllIcons } from "../../../../ui/base/Icon"
import { FilterChip } from "../../../../ui/base/FilterChip"
import { createDropdown } from "../../../../ui/base/Dropdown"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { BackgroundColumnLayout } from "../../../../ui/BackgroundColumnLayout"
import { theme } from "../../../../ui/theme"
import { DesktopListToolbar, DesktopViewerToolbar } from "../../../../ui/DesktopToolbars"
import { SelectAllCheckbox } from "../../../../ui/SelectAllCheckbox"
import { selectionAttrsForList } from "../../../common/misc/ListModel"
import { MultiselectMobileHeader } from "../../../../ui/MultiselectMobileHeader"
import { getContactSelectionMessage, MultiContactViewer } from "../../contacts/view/MultiContactViewer"
import { EnterMultiselectIconButton } from "../../../../ui/EnterMultiselectIconButton"
import { BaseMobileHeader } from "../../../../ui/BaseMobileHeader"
import { IconButton } from "../../../../ui/base/IconButton"
import { MAIL_PREFIX, throttleRoute } from "../../../../ui/utils/RouteChange"
import { ProgressBar } from "../../../../ui/base/ProgressBar"
import { keyManager, Shortcut } from "../../../../ui/utils/KeyManager"
import { FeatureType } from "@tutao/app-env"
import { ViewSlider } from "../../../../ui/nav/ViewSlider"
import { windowFacade } from "../../../common/misc/WindowFacade"
import { ContactViewerActions } from "../../contacts/view/ContactViewerActions"
import { Contact } from "@tutao/entities/tutanota"
import { confirmMerge, deleteContacts, writeMail } from "../../contacts/view/ContactView"
import { exportContacts } from "../../contacts/VCardExporter"
import { MobileHeader } from "../../../../ui/MobileHeader"
import { ContactCardViewer } from "../../contacts/view/ContactCardViewer"
import { renderHeaderButtons } from "../../../calendar-app/gui/HeaderButtons"
import { BottomNav } from "../../gui/BottomNav"
import { MobileActionBar } from "../../../../ui/MobileActionBar"
import { MobileBottomActionBar } from "../../../../ui/MobileBottomActionBar"
import { listSelectionKeyboardShortcuts } from "../../../../ui/base/ListUtils"
import { MultiselectMode } from "../../../../ui/base/List"
import { ContactSearchListView } from "./ContactSearchListView"
import { CommonSearchListViewAttrs } from "../../../common/search/SearchUtils"
import { AppPromo } from "../../../common/gui/AppPromo"
import { SearchViewSearchBar } from "../../../common/search/SearchViewSearchBar"
import { Dialog } from "../../../../ui/base/Dialog"
import { ClientDetector } from "../../../../platform-kit/app-env/boot/ClientDetector"
import { Keys } from "../../../../ui/utils/KeyboardKeys"
import { Styles } from "../../../../ui/styles"

export interface ContactSearchViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	makeViewModel: () => ContactSearchViewModel
}
export class ContactSearchView extends BaseTopLevelView implements TopLevelView<ContactSearchViewAttrs> {
	private readonly resultListColumn: ViewColumn
	private readonly resultDetailsColumn: ViewColumn
	private readonly folderColumn: ViewColumn
	private readonly viewSlider: ViewSlider
	private readonly searchViewModel: ContactSearchViewModel
	private readonly routeTo = throttleRoute()

	constructor(vnode: Vnode<ContactSearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()

		this.folderColumn = new ViewColumn(
			{
				view: () => {
					return m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: this.getMainButton(),
						content: [
							m(SidebarSection, {
								name: "searchFilters_label",
							}),
							m(".flex.wrap.plr-16.gap-8.flex-shrink-children", this.renderFilterChips()),
							m(".flex-grow"),
							m(AppPromo),
						],
						ariaLabel: "search_label",
					})
				},
			},
			ColumnType.Foreground,
			{
				minWidth: layout_size.first_col_min_width,
				maxWidth: layout_size.first_col_max_width,
				headerCenter: "search_label",
			},
		)
		this.resultListColumn = new ViewColumn(
			{
				view: () => {
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.surface_container,
						desktopToolbar: () =>
							m(DesktopListToolbar, [
								this.searchViewModel.listModel
									? [m(SelectAllCheckbox, selectionAttrsForList(this.searchViewModel.listModel))]
									: m(".button-height"),
							]),
						mobileHeader: () => this.renderMobileListHeader(vnode.attrs.header),
						columnLayout: this.getResultColumnLayout(),
					})
				},
			},
			ColumnType.Background,
			{
				minWidth: layout_size.second_col_min_width,
				maxWidth: layout_size.second_col_max_width,
				headerCenter: "searchResult_label",
			},
		)
		this.resultDetailsColumn = new ViewColumn(
			{
				view: () => this.renderDetailsView(vnode.attrs.header),
			},
			ColumnType.Background,
			{
				minWidth: layout_size.third_col_min_width,
				maxWidth: layout_size.third_col_max_width,
			},
		)

		this.viewSlider = new ViewSlider([this.folderColumn, this.resultListColumn, this.resultDetailsColumn], windowFacade)
	}

	view({ attrs }: Vnode<ContactSearchViewAttrs>): Children {
		return m(
			"#search.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.folderColumn.width,
					searchBar: () => this.renderSearchbar(),
					...attrs.header,
					buttons: renderHeaderButtons(),
				}),
				bottomNav: this.renderBottomNav(),
			}),
		)
	}

	getDeleteAndTrashActions(): { deleteAction: (() => unknown) | null; trashAction: (() => unknown) | null } {
		const selectedContacts = this.searchViewModel.getSelectedContacts()
		if (isNotEmpty(selectedContacts)) {
			return {
				deleteAction: () => {
					Dialog.confirm("deleteContacts_msg").then((confirmed) => {
						if (confirmed) {
							this.searchViewModel.deleteContacts(selectedContacts)
						}
					})
				},
				trashAction: null,
			}
		} else {
			return { deleteAction: null, trashAction: null }
		}
	}

	private readonly shortcuts = lazyMemoized<ReadonlyArray<Shortcut>>(() => {
		const deleteOrTrashAction = () => {
			const deleteTrashActions = this.getDeleteAndTrashActions()
			const action = deleteTrashActions.deleteAction ?? deleteTrashActions.trashAction
			action?.()
		}
		return [
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.searchViewModel.listModel),
			{
				key: Keys.N,
				exec: () => {
					locator.contactModel.getContactListId().then((contactListId) => {
						new ContactEditor(locator.entityClient, null, assertNotNull(contactListId)).show()
					})
				},
				enabled: () => locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.ReplyOnly),
				help: "newContact_action",
			},
			{
				key: Keys.DELETE,
				exec: () => {
					deleteOrTrashAction()
				},
				help: "delete_action",
			},
			{
				key: Keys.BACKSPACE,
				exec: () => {
					deleteOrTrashAction()
				},
				help: "delete_action",
			},
		]
	})

	oncreate() {
		this.searchViewModel.init()
		keyManager.registerShortcuts(this.shortcuts())
	}
	onremove() {
		this.searchViewModel.dispose()
		keyManager.unregisterShortcuts(this.shortcuts())
	}
	protected async onNewUrl(args: Record<string, any>, requestedPath: string) {
		await this.searchViewModel.init()
		this.searchViewModel.onNewUrl(args, requestedPath)
		m.redraw()
	}

	private getMainButton(): {
		label: TranslationKey
		click: ClickHandler
	} | null {
		if (Styles.get().isUsingBottomNavigation()) {
			return null
		} else
			return {
				click: () => {
					locator.contactModel.getContactListId().then((contactListId) => {
						new ContactEditor(locator.entityClient, null, assertNotNull(contactListId)).show()
					})
				},
				label: "newContact_action",
			}
	}

	private renderFilterChips(): Children {
		return this.renderCategoryChip("contacts_label", Icons.PeopleFilled)
	}

	private renderCategoryChip(label: TranslationKey, icon: AllIcons): Children {
		return m(FilterChip, {
			label: lang.getTranslation(label),
			icon,
			selected: true,
			chevron: true,
			onClick: createDropdown({
				lazyButtons: () => [
					{
						label: "emails_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.mail)
							m.route.set(href)
						},
						icon: Icons.MailFilled,
					},
					{
						label: "contacts_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.contact)
							m.route.set(href)
						},
						icon: Icons.PeopleFilled,
					},
					{
						label: "calendar_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.calendar)
							m.route.set(href)
						},
						icon: Icons.CalendarFilled,
					},
					!ClientDetector.get().isMailApp()
						? {
								label: "driveView_action",
								click: () => {
									const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.drive)
									m.route.set(href)
								},
								icon: Icons.DriveFilled,
							}
						: null,
				],
			}),
		})
	}
	private renderDetailsView(header: AppHeaderAttrs): Children {
		if (this.searchViewModel.listModel.isSelectionEmpty() && this.viewSlider.focusedColumn === this.resultDetailsColumn) {
			this.viewSlider.focus(this.resultListColumn)
			return null
		}

		const selectedContacts = this.searchViewModel.getSelectedContacts()

		const actions = m(ContactViewerActions, {
			contacts: selectedContacts,
			onEdit: (c: Contact) => new ContactEditor(locator.entityClient, c).show(),
			onDelete: deleteContacts,
			onMerge: confirmMerge,
			onExport: exportContacts,
		})
		const isMultiselect = this.searchViewModel.listModel.state.inMultiselect || selectedContacts.length === 0
		return m(BackgroundColumnLayout, {
			backgroundColor: theme.surface_container,
			desktopToolbar: () => m(DesktopViewerToolbar, actions),
			mobileHeader: () =>
				m(MobileHeader, {
					...header,
					backAction: () => this.viewSlider.focusPreviousColumn(),
					columnType: "other",
					title: "search_label",
					actions: null,
					multicolumnActions: () => actions,
					primaryAction: () => null,
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
						: m(ContactCardViewer, {
								contact: selectedContacts[0],
								onWriteMail: writeMail,
								highlightedStrings: this.searchViewModel.getHighlightedStrings(),
							}),
				),
		})
	}

	private renderMobileListHeader(header: AppHeaderAttrs): Children {
		return this.searchViewModel.listModel && this.searchViewModel.listModel.state.inMultiselect
			? this.renderMultiSelectMobileHeader()
			: this.renderMobileListActionsHeader(header)
	}
	private renderMultiSelectMobileHeader(): Children {
		return m(MultiselectMobileHeader, {
			...selectionAttrsForList(this.searchViewModel.listModel),
			message: getContactSelectionMessage(this.searchViewModel.getSelectedContacts().length),
		})
	}
	private renderMobileListActionsHeader(header: AppHeaderAttrs): Children {
		const rightActions: Children[] = []
		rightActions.push(
			m(EnterMultiselectIconButton, {
				clickAction: () => {
					this.searchViewModel.listModel.enterMultiselect()
				},
			}),
		)
		return m(BaseMobileHeader, {
			left: !Styles.get().isMobileDesktopLayout()
				? m(
						".icon-button",
						m(IconButton, {
							label: "back_action",
							icon: Icons.ChevronLeft,
							click: () => this.routeTo(MAIL_PREFIX),
						}),
					)
				: m(".ml-8"),
			right: rightActions,
			center: m(
				".flex-grow.flex.justify-center",
				{
					class: rightActions.length === 0 ? "mr-12" : "",
				},
				this.renderSearchbar(),
			),
			injections: m(ProgressBar, { progress: header.offlineIndicatorModel.getProgress() }),
		})
	}
	private renderSearchbar(): Children {
		return m(SearchViewSearchBar, {
			placeholder: lang.getTranslationText("searchContacts_placeholder"),
			text: this.searchViewModel.getCurrentQuery(),
			busy: this.searchViewModel.busy,
			onInput: (text: string) => this.searchViewModel.onSearchQueryUpdated(text),
			onClear: () => this.searchViewModel.onSearchQueryUpdated(""),
		})
	}
	private renderFilterBar(): Children {
		return m(".flex.gap-8.pl-16.pr-16.pt-8.pb-8.scroll-x", this.renderFilterChips())
	}

	private getResultColumnLayout(): Children {
		return m(".flex.col.fill-absolute", [
			Styles.get().isDesktopLayout() ? null : this.renderFilterBar(),
			m(
				".rel.flex-grow",
				m(ContactSearchListView, {
					listModel: this.searchViewModel.listModel,
					onSingleSelection: (item) => this.viewSlider.focus(this.resultDetailsColumn),
					highlightedStrings: this.searchViewModel.getHighlightedStrings(),
				} satisfies CommonSearchListViewAttrs<Contact>),
			),
		])
	}

	private renderBottomNav(): Children {
		if (!Styles.get().isSingleColumnLayout()) {
			return m(BottomNav)
		}
		const isInMultiselect = this.searchViewModel.listModel.state.inMultiselect ?? false
		if (!isInMultiselect && this.viewSlider.focusedColumn === this.resultDetailsColumn) {
			return m(MobileActionBar, {
				actions: [
					{
						icon: Icons.PenFilled,
						title: "edit_action",
						action: () => new ContactEditor(locator.entityClient, this.searchViewModel.getSelectedContacts()[0]).show(),
					},
					{
						icon: Icons.TrashFilled,
						title: "delete_action",
						action: () => deleteContacts(this.searchViewModel.getSelectedContacts()),
					},
				],
			})
		} else if (isInMultiselect) {
			return m(
				MobileBottomActionBar,
				m(ContactViewerActions, {
					contacts: this.searchViewModel.getSelectedContacts(),
					onEdit: () => new ContactEditor(locator.entityClient, getFirstOrThrow(this.searchViewModel.getSelectedContacts())).show(),
					onDelete: (contacts: Contact[]) => deleteContacts(contacts, () => this.searchViewModel.listModel.selectNone()),
					onMerge: confirmMerge,
					onExport: exportContacts,
				}),
			)
		}
		return m(BottomNav)
	}
}
