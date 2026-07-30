import { AppHeaderAttrs, Header } from "../../../../ui/Header"
import { TopLevelAttrs, TopLevelView } from "../../../../ui/base/TopLevelView"
import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import { ColumnType, ViewColumn } from "../../../../ui/base/ViewColumn"
import { DriveSearchViewModel } from "./DriveSearchViewModel"
import m, { Children, Vnode } from "mithril"
import { FolderColumnView } from "../../../common/gui/FolderColumnView"
import { SidebarSection } from "../../../../ui/SidebarSection"
import { layout_size, px } from "../../../../ui/size"
import { DrawerMenuAttrs } from "../../../common/gui/nav/DrawerMenu"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { AllIcons } from "../../../../ui/base/Icon"
import { FilterChip } from "../../../../ui/base/FilterChip"
import { createDropdown } from "../../../../ui/base/Dropdown"
import { SearchCategoryType } from "../../../common/api/worker/search/SearchTypes"
import { Icons } from "../../../../ui/base/icons/Icons"
import { formatDate } from "../../../../ui/utils/Formatter"
import { isSameDayOfDate } from "@tutao/utils"
import { ViewSlider } from "../../../../ui/nav/ViewSlider"
import { windowFacade } from "../../../common/misc/WindowFacade"
import { renderHeaderButtons } from "../../../calendar-app/gui/HeaderButtons"
import { styles } from "../../../../ui/styles"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../../ui/base/BaseSearchBar"
import { isKeyPressed } from "../../../../ui/utils/KeyManager"
import { Keys } from "@tutao/app-env"

export interface DriveSearchViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	makeViewModel: () => DriveSearchViewModel
	drawerAttrs: DrawerMenuAttrs
}

export class DriveSearchView extends BaseTopLevelView implements TopLevelView<DriveSearchViewAttrs> {
	private readonly viewSlider: ViewSlider
	private readonly filtersColumn: ViewColumn
	//private readonly searchResultsColumn: ViewColumn
	private readonly searchViewModel: DriveSearchViewModel
	constructor(vnode: Vnode<DriveSearchViewAttrs>) {
		super()
		this.searchViewModel = vnode.attrs.makeViewModel()
		this.filtersColumn = new ViewColumn(
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
							this.renderAppPromo(),
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
		this.viewSlider = new ViewSlider([this.filtersColumn], windowFacade)
	}
	protected onNewUrl(args: Record<string, any>, requestedPath: string): void {}

	view({ attrs }: Vnode<DriveSearchViewAttrs>): Children {
		return m(
			"#search.main-view",
			m(this.viewSlider, {
				header: m(Header, {
					firstColWidth: this.filtersColumn.width,
					searchBar: () => this.renderSearchbar(),
					...attrs.header,
					buttons: renderHeaderButtons(),
				}),
				bottomNav: this.renderBottomNav(),
			}),
		)
	}

	private renderSearchbar() {
		return m(
			// form wrapper to isolate the search input and prevent it from being autofilled when unrelated buttons are clicked on chrome
			// this is done because chrome doesn't appear to respect `autocomplete="off"` and will autofill the field anyway
			"form.full-width",
			{
				style: {
					maxWidth: styles.isUsingBottomNavigation() ? "" : px(layout_size.second_col_max_width + 50),
				},
				onsubmit: (e: SubmitEvent) => {
					e.stopPropagation()
					e.preventDefault()
				},
			},
			m(BaseSearchBar, {
				placeholder: lang.get("searchEmails_placeholder"),
				text: this.searchViewModel.getCurrentQuery(),
				busy: this.searchViewModel.busy,
				onInput: (text: string) => {
					this.searchViewModel.onSearchQueryUpdated(text)
				},
				onKeyDown: (e) => {
					e.stopPropagation()
					if (isKeyPressed(e.key, Keys.RETURN)) {
						e.preventDefault()
					}
				},
				onClear: () => this.searchViewModel.onSearchQueryUpdated(""),
			} satisfies BaseSearchBarAttrs),
		)
	}

	private getMainButton() {
		return undefined
	}

	private renderFilterChips() {
		return [
			this.renderCategoryChip("driveHome_label", Icons.DriveFilled),
			m(FilterChip, {
				label: lang.makeTranslation(
					"btn:date",
					`${this.searchViewModel.startDate ? formatDate(this.searchViewModel.startDate) : lang.getTranslationText("unlimited_label")} - ${
						isSameDayOfDate(new Date(), this.searchViewModel.endDate)
							? lang.getTranslationText("today_label")
							: formatDate(this.searchViewModel.endDate)
					}`,
				),
				selected: true,
				chevron: false,
				onClick: (_) => this.onDriveDateRangeSelect(),
			}),
		]
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
					{
						label: "driveHome_label",
						click: () => {
							const href = this.searchViewModel.getUrlFromSearchCategory(SearchCategoryType.drive)
							m.route.set(href)
						},
						icon: Icons.DriveFilled,
					},
				],
			}),
		})
	}

	private renderAppPromo() {
		return undefined
	}

	private onDriveDateRangeSelect() {}

	private renderBottomNav() {
		return undefined
	}
}
