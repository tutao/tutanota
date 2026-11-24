/**
 * DOM helpers for tables that may contain merged cells (colspan/rowspan). All positions are zero-based and refer to the
 * "grid" of the table, i.e. the layout with merged cells expanded to every slot they cover.
 */

/** grid[row][column] is the cell covering that slot, a cell with spans appears in every slot it covers */
export type CellGrid = Array<Array<HTMLTableCellElement | undefined>>

/** inclusive bounds of a rectangle of grid slots */
export interface GridBox {
	top: number
	left: number
	bottom: number
	right: number
}

export function buildGrid(table: HTMLTableElement): CellGrid {
	const grid: CellGrid = []
	Array.from(table.rows).forEach((row, rowIndex) => {
		grid[rowIndex] ??= []
		let column = 0
		for (const cell of Array.from(row.cells)) {
			while (grid[rowIndex][column]) column++
			const rowSpan = Math.max(1, cell.rowSpan)
			const colSpan = Math.max(1, cell.colSpan)
			for (let r = rowIndex; r < rowIndex + rowSpan; r++) {
				grid[r] ??= []
				for (let c = column; c < column + colSpan; c++) grid[r][c] = cell
			}
			column += colSpan
		}
	})
	return grid
}

export function columnCount(grid: CellGrid): number {
	return grid.reduce((max, row) => Math.max(max, row.length), 0)
}

/** @return the slots covered by the cell */
export function getCellBox(grid: CellGrid, cell: HTMLTableCellElement): GridBox | null {
	let box: GridBox | null = null
	grid.forEach((row, r) => {
		row.forEach((candidate, c) => {
			if (candidate !== cell) return
			box =
				box == null
					? { top: r, left: c, bottom: r, right: c }
					: { top: box.top, left: box.left, bottom: Math.max(box.bottom, r), right: Math.max(box.right, c) }
		})
	})
	return box
}

/** @return the smallest rectangle containing both cells that does not cut through any merged cell */
export function getSelectionBox(grid: CellGrid, from: HTMLTableCellElement, to: HTMLTableCellElement): GridBox | null {
	const a = getCellBox(grid, from)
	const b = getCellBox(grid, to)
	if (a == null || b == null) return null
	let box: GridBox = { top: Math.min(a.top, b.top), left: Math.min(a.left, b.left), bottom: Math.max(a.bottom, b.bottom), right: Math.max(a.right, b.right) }
	for (let changed = true; changed; ) {
		changed = false
		for (const cell of getCellsInBox(grid, box)) {
			const cellBox = getCellBox(grid, cell)!
			const grown = {
				top: Math.min(box.top, cellBox.top),
				left: Math.min(box.left, cellBox.left),
				bottom: Math.max(box.bottom, cellBox.bottom),
				right: Math.max(box.right, cellBox.right),
			}
			if (grown.top !== box.top || grown.left !== box.left || grown.bottom !== box.bottom || grown.right !== box.right) {
				box = grown
				changed = true
			}
		}
	}
	return box
}

export function getCellsInBox(grid: CellGrid, box: GridBox): HTMLTableCellElement[] {
	const cells = new Set<HTMLTableCellElement>()
	for (let r = box.top; r <= box.bottom; r++) {
		for (let c = box.left; c <= box.right; c++) {
			const cell = grid[r]?.[c]
			if (cell) cells.add(cell)
		}
	}
	return Array.from(cells)
}

function hasContent(cell: HTMLTableCellElement): boolean {
	return (cell.textContent ?? "").replace(/\u200B/g, "").trim() !== "" || cell.querySelector("img, hr, table") != null
}

/**
 * Merges all cells in the box into the top left one. The content of the other cells is appended to it, empty cells are dropped.
 * @return the merged cell
 */
export function mergeCells(grid: CellGrid, box: GridBox): HTMLTableCellElement | null {
	const target = grid[box.top]?.[box.left]
	if (!target) return null
	const others = getCellsInBox(grid, box).filter((cell) => cell !== target)
	if (others.length === 0) return target
	if (!hasContent(target)) target.replaceChildren()
	for (const cell of others) {
		if (hasContent(cell)) {
			while (cell.firstChild) target.appendChild(cell.firstChild)
		}
		cell.remove()
	}
	if (!target.firstChild) target.innerHTML = "<div><br></div>"
	setSpan(target, "colspan", box.right - box.left + 1)
	setSpan(target, "rowspan", box.bottom - box.top + 1)
	return target
}

function setSpan(cell: HTMLTableCellElement, attribute: "colspan" | "rowspan", value: number) {
	if (value > 1) cell.setAttribute(attribute, String(value))
	else cell.removeAttribute(attribute)
}

/** Splits a merged cell back into single cells, the new cells are created with {@param createCell}. */
export function splitCell(grid: CellGrid, table: HTMLTableElement, cell: HTMLTableCellElement, createCell: () => HTMLTableCellElement) {
	const box = getCellBox(grid, cell)
	if (box == null || (box.top === box.bottom && box.left === box.right)) return
	cell.removeAttribute("colspan")
	cell.removeAttribute("rowspan")
	for (let r = box.top; r <= box.bottom; r++) {
		for (let c = box.left; c <= box.right; c++) {
			if (r === box.top && c === box.left) continue
			insertCellAt(grid, table, r, c, createCell(), cell)
		}
	}
}

/**
 * Inserts the cell into the DOM row so that it appears in the grid column {@param column}.
 * The positions of the other cells are taken from {@param grid}, cells in {@param ignore} are not used as reference.
 */
export function insertCellAt(
	grid: CellGrid,
	table: HTMLTableElement,
	row: number,
	column: number,
	cell: HTMLTableCellElement,
	...ignore: HTMLTableCellElement[]
) {
	const tr = table.rows[row]
	let reference: HTMLTableCellElement | null = null
	for (let c = column + 1; c < (grid[row]?.length ?? 0); c++) {
		const candidate = grid[row][c]
		if (candidate && candidate.parentElement === tr && !ignore.includes(candidate)) {
			reference = candidate
			break
		}
	}
	tr.insertBefore(cell, reference)
}

// ---- column widths

/** @return the current width of every grid column in px */
export function measureColumnWidths(table: HTMLTableElement, grid: CellGrid): number[] {
	const columns = columnCount(grid)
	const tableRect = table.getBoundingClientRect()
	const edges: number[] = []
	for (let c = 0; c < columns; c++) {
		// the right edge of the column is the right edge of any cell that ends in it
		let edge: number | null = null
		for (let r = 0; r < grid.length && edge == null; r++) {
			const cell = grid[r][c]
			if (cell && getCellBox(grid, cell)?.right === c) edge = cell.getBoundingClientRect().right
		}
		edges.push(edge ?? (c === columns - 1 ? tableRect.right : (edges[c - 1] ?? tableRect.left)))
	}
	return edges.map((edge, c) => edge - (c === 0 ? tableRect.left : edges[c - 1]))
}

/** Writes the widths (in percent of the table width) to a colgroup, which is what a table with a fixed layout uses. */
export function setColumnWidths(table: HTMLTableElement, percentages: number[]) {
	let colgroup = table.querySelector(":scope > colgroup")
	if (!colgroup) {
		colgroup = document.createElement("colgroup")
		table.insertBefore(colgroup, table.firstChild)
	}
	while (colgroup.children.length < percentages.length) colgroup.appendChild(document.createElement("col"))
	while (colgroup.children.length > percentages.length) colgroup.lastElementChild!.remove()
	percentages.forEach((percentage, index) => ((colgroup!.children[index] as HTMLElement).style.width = `${Math.round(percentage * 100) / 100}%`))
}

/** Keeps a colgroup in sync after a column was inserted at the position (the new column gets an equal share). */
export function insertColumnWidth(table: HTMLTableElement, grid: CellGrid, afterColumn: number) {
	const colgroup = table.querySelector(":scope > colgroup")
	if (!colgroup) return
	const widths = Array.from(colgroup.children).map((col) => parseFloat((col as HTMLElement).style.width) || 100 / colgroup.children.length)
	const share = 100 / (widths.length + 1)
	const scaled = widths.map((width) => (width * (100 - share)) / 100)
	scaled.splice(afterColumn + 1, 0, share)
	setColumnWidths(table, scaled)
}

export function removeColumnWidth(table: HTMLTableElement, column: number) {
	const colgroup = table.querySelector(":scope > colgroup")
	if (!colgroup) return
	const widths = Array.from(colgroup.children).map((col) => parseFloat((col as HTMLElement).style.width) || 0)
	widths.splice(column, 1)
	const total = widths.reduce((sum, width) => sum + width, 0)
	if (widths.length === 0 || total <= 0) return colgroup.remove()
	setColumnWidths(
		table,
		widths.map((width) => (width / total) * 100),
	)
}
