import m, {Children, Component, Vnode} from "mithril"
import {assertMainOrNode} from "../../../../common/api/common/Env"
import {downcast, TypeRef} from "@tutao/tutanota-utils"
import {ListModel} from "../../../../common/misc/ListModel.js"
import {List, ListAttrs, MultiselectMode, RenderConfig} from "../../../../common/gui/base/List.js"
import {size} from "../../../../common/gui/size.js"
import {CalendarEvent,} from "../../../../common/api/entities/tutanota/TypeRefs.js"
import ColumnEmptyMessageBox from "../../../../common/gui/base/ColumnEmptyMessageBox.js"
import {BootIcons} from "../../../../common/gui/base/icons/BootIcons.js"
import {lang} from "../../../../common/misc/LanguageViewModel.js"
import {theme} from "../../../../common/gui/theme.js"
import {VirtualRow} from "../../../../common/gui/base/ListUtils.js"
import {styles} from "../../../../common/gui/styles.js"
import {KindaCalendarRow} from "../../view/CalendarRow.js"

assertMainOrNode()

export class SearchResultListEntry {
    constructor(readonly entry: CalendarEvent) {
    }

    get _id(): IdTuple {
        return this.entry._id
    }
}

export interface SearchListViewAttrs {
    listModel: ListModel<SearchResultListEntry>
    onSingleSelection: (item: SearchResultListEntry) => unknown
    isFreeAccount: boolean
    cancelCallback: () => unknown | null
}

export class SearchListView implements Component<SearchListViewAttrs> {
    private listModel: ListModel<SearchResultListEntry>

    constructor({attrs}: Vnode<SearchListViewAttrs>) {
        this.listModel = attrs.listModel
    }

    view({attrs}: Vnode<SearchListViewAttrs>): Children {
        this.listModel = attrs.listModel
        const icon = BootIcons.Calendar;
        const renderConfig = this.calendarRenderConfig;

        return attrs.listModel.isEmptyAndDone()
            ? m(ColumnEmptyMessageBox, {
                icon,
                message: () =>
                    lang.get("searchNoResults_msg") + "\n" + (attrs.isFreeAccount ? lang.get("goPremium_msg") : lang.get("switchSearchInMenu_label")),
                color: theme.list_message_bg,
            })
            : m(List, {
                state: attrs.listModel.state,
                renderConfig,
                onLoadMore: () => {
                    attrs.listModel?.loadMore()
                },
                onRetryLoading: () => {
                    attrs.listModel?.retryLoading()
                },
                onSingleSelection: (item: SearchResultListEntry) => {
                    attrs.listModel?.onSingleSelection(item)
                    attrs.onSingleSelection(item)
                },
                onSingleTogglingMultiselection: (item: SearchResultListEntry) => {
                    attrs.listModel.onSingleInclusiveSelection(item, styles.isSingleColumnLayout())
                },
                onRangeSelectionTowards: (item: SearchResultListEntry) => {
                    attrs.listModel.selectRangeTowards(item)
                },
                onStopLoading() {
                    if (attrs.cancelCallback != null) {
                        attrs.cancelCallback()
                    }

                    attrs.listModel.stopLoading()
                },
            } satisfies ListAttrs<SearchResultListEntry, SearchResultListRow>)
    }

    private readonly calendarRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
        itemHeight: size.list_row_height,
        multiselectionAllowed: MultiselectMode.Disabled,
        swipe: null,
        createElement: (dom: HTMLElement) => {
            const row: SearchResultListRow = new SearchResultListRow(new KindaCalendarRow(dom))
            m.render(dom, row.render())
            return row
        },
    }
}

export class SearchResultListRow implements VirtualRow<SearchResultListEntry> {
    top: number
    // set from List
    domElement: HTMLElement | null = null

    // this is our own entry which we need for some reason (probably easier to deal with than a lot of sum type entries)
    private _entity: SearchResultListEntry | null = null
    get entity(): SearchResultListEntry | null {
        return this._entity
    }

    private _delegate: KindaCalendarRow

    constructor(delegate: KindaCalendarRow) {
        this._delegate = delegate
        this.top = 0
    }

    update(entry: SearchResultListEntry, selected: boolean, isInMultiSelect: boolean): void {
        this._delegate.domElement = this.domElement!
        this._entity = entry

        this._delegate.update(downcast(entry.entry), selected, isInMultiSelect)
    }

    render(): Children {
        return this._delegate.render()
    }
}
