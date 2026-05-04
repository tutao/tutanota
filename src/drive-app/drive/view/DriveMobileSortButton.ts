import m, { Children, Component, Vnode } from "mithril"
import { SortColumn, SortingPreference } from "./DriveViewModel"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { Icons } from "../../../ui/base/icons/Icons"
import { createDropdown, DropdownButtonAttrs } from "../../../ui/base/Dropdown"
import { IconButton } from "../../../ui/base/IconButton"

export interface DriveMobileSortButtonAttrs {
	readonly currentSort: SortingPreference
	readonly onSort: (property: SortColumn) => unknown
}

export class DriveMobileSortButton implements Component<DriveMobileSortButtonAttrs> {
	view({ attrs: { currentSort, onSort } }: Vnode<DriveMobileSortButtonAttrs>): Children {
		const ascText = lang.getTranslationText("sortAscending_label")
		const descText = lang.getTranslationText("sortDescending_label")

		const sortOptions = [
			{ column: SortColumn.name, translationKey: "name_label" as const, testId: "test_mobileSortNameButton" },
			{ column: SortColumn.mimeType, translationKey: "type_label" as const, testId: "test_mobileSortTypeButton" },
			{ column: SortColumn.size, translationKey: "size_label" as const, testId: "test_mobileSortSizeButton" },
			{ column: SortColumn.date, translationKey: "date_label" as const, testId: "test_mobileSortDateButton" },
		]

		const buttons = sortOptions.map((option) => {
			// yeah champ, look at you, you are sorting, proud of you
			const iAmSorting = currentSort.column === option.column

			const labelText = lang.getTranslationText(option.translationKey)
			const sortOrderText = iAmSorting ? (currentSort.order === "asc" ? `(${ascText})` : `(${descText})`) : ""
			const sortOrderIcon = iAmSorting ? (currentSort.order === "asc" ? Icons.ArrowUp : Icons.ArrowDown) : undefined

			return {
				label: lang.makeTranslation(option.testId, `${labelText} ${sortOrderText}`),
				text: option.translationKey,
				icon: sortOrderIcon,
				click: () => onSort(option.column),
			} satisfies DropdownButtonAttrs
		})

		return m(IconButton, {
			title: "sortBy_label",
			icon: Icons.OrderedList,
			click: (e: MouseEvent, dom: HTMLElement) => {
				createDropdown({
					lazyButtons: () => buttons,
				})(e, dom)
			},
		})
	}
}
