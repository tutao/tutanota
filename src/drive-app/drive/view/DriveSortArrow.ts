import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel } from "./DriveViewModel"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { Icon } from "../../../common/gui/base/Icon"

export interface DriveSortArrowAttrs {
	columnName: string
	driveViewModel: DriveViewModel
}

export class DriveSortArrow implements Component<DriveSortArrowAttrs> {
	view({ attrs: { columnName: thisColumnName, driveViewModel } }: Vnode<DriveSortArrowAttrs>): Children {
		const currentColumnSortOrder = driveViewModel.getCurrentColumnSortOrder()

		let child = m(Icon, {
			icon: Icons.ArrowDropRight,
		})

		if (currentColumnSortOrder !== null && currentColumnSortOrder[0] === thisColumnName) {
			const [columnName, sortOrder] = currentColumnSortOrder
			const arrowToDisplay = sortOrder === "asc" ? Icons.ArrowDropUp : Icons.ArrowDropDown

			child = m(Icon, {
				icon: arrowToDisplay,
			})
		}

		return child
	}
}
