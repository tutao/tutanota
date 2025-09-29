// import {MailViewModel} from "../../../mail-app/mail/view/MailViewModel";
// import type {Mail} from "../../../common/api/entities/tutanota/TypeRefs";
// import {MoveMode} from "../../../mail-app/mail/model/MailModel";
// import {SystemFolderType} from "../../../common/api/common/TutanotaConstants";
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import m, { Children, Component, Vnode } from "mithril"
import { DriveFileRow } from "./DriveFileRow"
import { List, ListAttrs, MultiselectMode } from "../../../common/gui/base/List"
import { size } from "../../../common/gui/size"
import { DriveFolderContentListViewModel } from "./DriveFolderContentListViewModel"
import { ListColumnWrapper } from "../../../common/gui/ListColumnWrapper"

export interface DriveFolderContentListViewAttrs {
	// We would like to not get and hold to the whole MailView eventually
	// but for that we need to rewrite the List
	// onClearFolder: () => unknown
	// onSingleSelection: (file: File) => unknown
	// onSingleInclusiveSelection: ListElementListModel<File>["onSingleInclusiveSelection"]
	folderContentListViewModel: DriveFolderContentListViewModel
}

export class DriveFolderContentListView implements Component<DriveFolderContentListViewAttrs> {
	// vnode: Vnode<MailListViewAttrs>): Children {
	view(vnode: Vnode<DriveFolderContentListViewAttrs>): Children {
		return m(
			ListColumnWrapper,
			{
				headerContent: null,
			},
			m(List, {
				renderConfig: {
					createElement: (dom: Element) => {
						const driveFileRow = new DriveFileRow()
						m.render(dom, driveFileRow.render())
						return driveFileRow
					},
					itemHeight: size.list_row_height,
					multiselectionAllowed: MultiselectMode.Enabled,
					swipe: null,
				},
				state: vnode.attrs.folderContentListViewModel.listModel.state,
				onLoadMore: function (): void {
					//throw new Error("Function not implemented.")
				},
				onRetryLoading: function (): void {
					//throw new Error("Function not implemented.")
				},
				onSingleSelection: function (item: File) {
					//throw new Error("Function not implemented.")
				},
				onSingleTogglingMultiselection: function (item: File) {
					//throw new Error("Function not implemented.")
				},
				onRangeSelectionTowards: function (item: File) {
					//throw new Error("Function not implemented.")
				},
				onStopLoading: function () {
					//throw new Error("Function not implemented.")
				},
			} satisfies ListAttrs<File, DriveFileRow>),
		)
	}
}
