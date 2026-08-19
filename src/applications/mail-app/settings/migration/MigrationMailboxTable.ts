import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../../../ui/theme"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { TertiaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { MigrationMailboxRowView, MigrationMailboxTableRow } from "./MigrationMailboxTableRow"

const GRID_COLUMNS = "32px minmax(160px, 1fr) minmax(200px, 1.5fr) 140px 180px"

function compareString(s1: string, s2: string): number {
	return s1.toLowerCase().localeCompare(s2.toLowerCase())
}

/** Column a `MigrationMailboxTable` can be sorted by - mirrors Drive's `SortColumn`/`SortingPreference` concept. */
const enum MigrationSortColumn {
	name = "name",
	mailAddress = "mailAddress",
	status = "status",
}
type SortOrder = "asc" | "desc"
interface MigrationSortingPreference {
	column: MigrationSortColumn
	order: SortOrder
}

const SORT_COMPARATORS: Record<MigrationSortColumn, (a: MigrationMailboxRowView, b: MigrationMailboxRowView) => number> = {
	[MigrationSortColumn.name]: (a, b) => compareString(a.name, b.name),
	[MigrationSortColumn.mailAddress]: (a, b) => compareString(a.mailAddress, b.mailAddress),
	[MigrationSortColumn.status]: (a, b) => parseInt(a.status) - parseInt(b.status),
}

export interface MigrationMailboxTableAttrs {
	rows: ReadonlyArray<MigrationMailboxRowView>
	onDownloadSelectedCredentials?: (rows: ReadonlyArray<MigrationMailboxRowView>) => unknown
}

/**
 * The migration status table: sortable columns and checkbox multiselect (with a small bulk-action bar),
 * mirroring the concepts the Drive app's file table uses (`DriveViewModel`'s `SortingPreference`/`sort()`,
 * `ListModel`'s `selectedItems`/`inMultiselect`) at a scale appropriate for a small, fully-in-memory table
 * (no virtualization/pagination).
 */
export class MigrationMailboxTable implements Component<MigrationMailboxTableAttrs> {
	private selectedIds = new Set<string>()
	private revealedIds = new Set<string>()
	private sortingPreference: MigrationSortingPreference = { column: MigrationSortColumn.name, order: "asc" }

	view({ attrs }: Vnode<MigrationMailboxTableAttrs>): Children {
		const rows = this.sortedRows(attrs.rows)
		const selectedRows = rows.filter((row) => this.selectedIds.has(row.mailAddress))

		return m(".mt-8", [
			selectedRows.length > 0 ? this.renderSelectionBar(selectedRows, attrs) : null,
			m(".mt-8", { style: { display: "grid", "grid-template-columns": GRID_COLUMNS } }, [
				this.renderHeader(rows),
				rows.map((row) =>
					m(MigrationMailboxTableRow, {
						key: row.mailAddress,
						row,
						selected: this.selectedIds.has(row.mailAddress),
						onToggleSelected: () => this.toggleRow(row.mailAddress),
						revealed: this.revealedIds.has(row.mailAddress),
						onToggleRevealed: () => this.toggleRevealed(row.mailAddress),
					}),
				),
			]),
		])
	}

	private renderHeader(rows: ReadonlyArray<MigrationMailboxRowView>): Children {
		return m(".small.pb-8", { style: { display: "grid", "grid-template-columns": "subgrid", "grid-column": "1 / 6", color: theme.on_surface_variant } }, [
			m(
				"div",
				m("input.checkbox", {
					type: "checkbox",
					checked: this.areAllSelected(rows),
					onchange: () => this.toggleSelectAll(rows),
				}),
			),
			this.renderHeaderCell("migrationColumnUser_label", MigrationSortColumn.name),
			this.renderHeaderCell("migrationColumnTutaAddress_label", MigrationSortColumn.mailAddress),
			this.renderHeaderCell("migrationColumnStatus_label", MigrationSortColumn.status),
			m("div", lang.getTranslationText("migrationColumnPassword_label")),
		])
	}

	private renderHeaderCell(label: Parameters<typeof lang.getTranslationText>[0], column: MigrationSortColumn): Children {
		const isSorted = this.sortingPreference.column === column
		return m("button.flex.items-center.gap-4.b", { style: { color: theme.on_surface_variant, cursor: "pointer" }, onclick: () => this.sort(column) }, [
			lang.getTranslationText(label),
			isSorted
				? m(Icon, {
						icon: Icons.ArrowRight,
						size: IconSize.PX20,
						style: { fill: theme.on_surface_variant, transform: `rotate(${this.sortingPreference.order === "asc" ? "270deg" : "90deg"})` },
					})
				: null,
		])
	}

	private renderSelectionBar(selectedRows: ReadonlyArray<MigrationMailboxRowView>, attrs: MigrationMailboxTableAttrs): Children {
		return m(".flex.items-center.justify-between.pb-8", [
			m(".small.b", lang.getTranslation("itemsSelected_label", { "{number}": selectedRows.length }).text),
			attrs.onDownloadSelectedCredentials && selectedRows.some((row) => row.initialPassword)
				? m(TertiaryButton, {
						label: "migrationDownloadCredentials_action",
						onclick: () => attrs.onDownloadSelectedCredentials!(selectedRows),
					})
				: null,
		])
	}

	private sortedRows(rows: ReadonlyArray<MigrationMailboxRowView>): MigrationMailboxRowView[] {
		const comparator = SORT_COMPARATORS[this.sortingPreference.column]
		const sorted = rows.slice().sort(comparator)
		return this.sortingPreference.order === "asc" ? sorted : sorted.reverse()
	}

	private sort(column: MigrationSortColumn): void {
		if (this.sortingPreference.column === column) {
			this.sortingPreference = { column, order: this.sortingPreference.order === "asc" ? "desc" : "asc" }
		} else {
			this.sortingPreference = { column, order: "asc" }
		}
	}

	private toggleRow(id: string): void {
		if (this.selectedIds.has(id)) {
			this.selectedIds.delete(id)
		} else {
			this.selectedIds.add(id)
		}
	}

	private toggleRevealed(id: string): void {
		if (this.revealedIds.has(id)) {
			this.revealedIds.delete(id)
		} else {
			this.revealedIds.add(id)
		}
	}

	private areAllSelected(rows: ReadonlyArray<MigrationMailboxRowView>): boolean {
		return rows.length > 0 && rows.every((row) => this.selectedIds.has(row.mailAddress))
	}

	private toggleSelectAll(rows: ReadonlyArray<MigrationMailboxRowView>): void {
		if (this.areAllSelected(rows)) {
			this.selectedIds.clear()
		} else {
			for (const row of rows) {
				this.selectedIds.add(row.mailAddress)
			}
		}
	}
}
