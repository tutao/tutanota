//@flow
import m from "mithril"
import {theme} from "../theme"
import {size} from "../size"
import {NBSP} from "@tutao/tutanota-utils"

type AxisLabel = {
	interval: number;
	formatLabel: (number) => string;
	formatExact: (number) => string;
}

export type LineChartAttrs = {
	data: {
		name: string, color: string, line: boolean, scatter: boolean, coordinates: Array<[number, number]>, // x,y
		maxX: ?number, maxY: ?number, minX: ?number, minY: ?number,
	}[];
	maxX: number;
	maxY: number;
	minX: number;
	minY: number;
	xLabel: AxisLabel;
	yLabel: AxisLabel;
	heightFactor: number;
}

const coordinateSystemWidth = 3840 // UHD-1

export class LineChart implements MComponent<LineChartAttrs> {
	_domWrapper: HTMLElement;
	_domSvg: HTMLElement;
	_domAll: HTMLElement;
	_scale: number;
	_domPositions: HTMLElement;
	_zoom: number;
	_pos: [number, number];
	_offset: [number, number];
	_moving: boolean;
	_viewBox: {x: number, y: number, width: number, height: number};
	_bounds: {x: number, y: number, width: number, height: number};
	_circle: HTMLElement;
	_attrs: LineChartAttrs;

	constructor(vnode: Vnode<LineChartAttrs>) {
		this._scale = 1
		this._zoom = 1
		this._pos = [0, 0]
		this._moving = false
		this._viewBox = {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		}
	}

	_move(e: MouseEvent) {
		this._moving = true
		this._domWrapper.style.cursor = 'pointer'
		e.preventDefault()
	}

	_stopMove(e: MouseEvent) {
		this._moving = false
		this._domWrapper.style.cursor = ''
		e.preventDefault()
	}

	view(vnode: Vnode<LineChartAttrs>): Children {
		const a = vnode.attrs
		this._attrs = a
		const height = coordinateSystemWidth * a.heightFactor
		const xFactor = coordinateSystemWidth / ((a.maxX - a.minX))
		const yFactor = height / ((a.maxY - a.minY))

		return m("div.line-chart-example.mlr-l.mt-l.mb-l", {
				oncreate: vnode => {
					this._domWrapper = vnode.dom
				},
			}, [
				m("div.positions.abs.mlr-l.mt-l.text-pre", {
					oncreate: vnode => this._domPositions = vnode.dom,
					style: {right: '5px', top: 0}
				}),
				m("svg.line-chart", {
						style: {border: `1px solid ${theme.content_border}`},
						oncreate: vnode => {
							this.onDomUpdated(vnode)
							this._domSvg.addEventListener("mousemove", (e: MouseEvent) => this._onMove(e))
							this._domSvg.addEventListener("mousedown", (e: MouseEvent) => this._move(e))
							this._domSvg.addEventListener("mouseup", (e: MouseEvent) => this._stopMove(e))
							this._domSvg.addEventListener("mouseenter", (e: MouseEvent) => {
								if (e.buttons === 1) this._move(e)
							})
							this._domSvg.addEventListener("mouseleave", (e: MouseEvent) => this._stopMove(e))
							this._domSvg.addEventListener("wheel", (e: any) => {
								if (e.ctrlKey) {
									e.deltaY > 0 ? this.zoom(e, -0.3) : this.zoom(e, 0.3)
									e.preventDefault()
								}
							})

						},
						onupdate: vnode => {
							this.onDomUpdated(vnode)
						},
						// good viewbox introduction: https://sarasoueidan.com/blog/svg-coordinate-systems/
						viewBox:
							`${this._pos[0]} ${this._pos[1]} ${this._viewBox.width / this._zoom} ${this._viewBox.height / this._zoom}`,
					},
					this._domSvg === null
						? []
						: m("g",
						{
							oncreate: vnode => {
								this._domAll = vnode.dom
							},
						}, [
							m("circle", {
								oncreate: vnode => this._circle = vnode.dom,
								style: {display: 'none'},
								x: 0,
								y: 0,
								r: 2.5 * this._scale / this._zoom
							}),
							m("g.coordinate-system", [
								m("path", {
									stroke: theme.content_accent,
									fill: 'none',
									'stroke-width': 2 * this._scale / this._zoom,
									d: `M0,0 L0,${height} L${coordinateSystemWidth},${height}`
								}),
								m("g.y-labels", this.renderYLabel(a, height, yFactor)),
								m("g.x-labels", this.renderXLabel(a, height, xFactor)),
							]),
							a.data.map((d) => {
								return d.coordinates.length === 0 ? null : [
									d.line
										? m("g", {
											stroke: d.color,
											'stroke-width': 1 * this._scale / this._zoom,
											fill: 'none',
										},
										m("path", {
											d: d.coordinates.map((xy, i) => {
												return [
													(i === 0 ? 'M' : 'L') + calculateX(xy[0], a, xFactor) + ','
													+ calculateY(height, xy[1], a, yFactor)
												]
											}).join(' ')
										}, m("title", d.name)),
										)
										: null,
									d.scatter
										? m("g", d.coordinates.map(xy => m("circle", {
											fill: d.color,
											cx: calculateX(xy[0], a, xFactor),
											cy: calculateY(height, xy[1], a, yFactor),
											r: 2.5 * this._scale / this._zoom
										}, m("title", d.name))))
										: null,
								]
							}),
						])
				)
			]
		)
	}

	_onMove(e: MouseEvent) {
		if (this._moving) {
			let x = this._pos[0] - e.movementX * this._scale / this._zoom
			let y = this._pos[1] - e.movementY * this._scale / this._zoom
			this.setPosition(x, y)
		}

		// update position labels (right top)
		let {x, y} = this.getMousePosition(e)
		let a = this._attrs
		const height = coordinateSystemWidth * a.heightFactor
		const xFactor = coordinateSystemWidth / ((a.maxX - a.minX))
		const yFactor = height / ((a.maxY - a.minY))
		const formattedY = a.yLabel.formatExact(a.maxY - (y / yFactor))
		const formattedX = a.xLabel.formatExact(a.minX + (x / xFactor))
		this._domPositions.innerText = formattedY + "\n" + formattedX
	}

	renderYLabel(a: LineChartAttrs, height: number, yFactor: number): Children {
		return [...Array(Math.round((a.maxY - a.minY) / a.yLabel.interval)).keys()].map(i => {
			let y = calculateY(height, a.minY + i * a.yLabel.interval, a, yFactor)
			return [
				i > 0 ? m("path", {
					stroke: theme.content_border,
					fill: 'none',
					'stroke-width': 0.5 * this._scale / this._zoom,
					d: `M0,${y} L${coordinateSystemWidth},${y}`
				}) : null,
				m("text", {
					dy: 7,
					y: y,
					'font-size': size.font_size_base * this._scale / this._zoom,
					'alignment-baseline': 'middle',
					'text-anchor': 'end'
				}, NBSP + a.yLabel.formatLabel(a.minY + i * a.yLabel.interval) + NBSP),
			]
		})
	}

	renderXLabel(a: LineChartAttrs, height: number, xFactor: number): Children {
		return [...Array(Math.round((a.maxX - a.minX) / a.xLabel.interval)).keys()].map(i => {
			let x = calculateX(a.minX + i * a.xLabel.interval, a, xFactor)
			return i > 0 ? [
				m("path", {
					stroke: theme.content_border,
					fill: 'none',
					'stroke-width': 0.5 * this._scale / this._zoom,
					d: `M${x},0 L${x},${height}`
				}),
				m("text", {
					dy: 25,
					y: height,
					x: x,
					'font-size': size.font_size_base * this._scale / this._zoom,
					'alignment-baseline': 'hanging',
					'text-anchor': 'middle'
				}, NBSP + a.xLabel.formatLabel(i * a.xLabel.interval) + NBSP),
			] : null
		})
	}

	getMousePosition(e: MouseEvent): {x: number, y: number} {
		let offset = (e.currentTarget: any).getBoundingClientRect()
		return {
			x: ((e.clientX - offset.left) * this._scale / this._zoom) + this._pos[0],
			y: ((e.clientY - offset.top) * this._scale / this._zoom) + this._pos[1]
		}
	}

	setPosition(x: number, y: number) {
		this._pos = [x, y]
		this._domSvg.setAttribute("viewBox", `${x} ${y} ${this._viewBox.width / this._zoom} ${this._viewBox.height / this._zoom}`)
	}

	zoom(e: MouseEvent, step: number) {
		let offset = (e.currentTarget: any).getBoundingClientRect()
		let currentMousePosition = {
			x: ((e.clientX - offset.left) * this._scale / this._zoom),
			y: ((e.clientY - offset.top) * this._scale / this._zoom)
		}
		this._zoom += step
		if (this._zoom > 1) {
			let newMousePosition = {
				x: ((e.clientX - offset.left) * this._scale / this._zoom),
				y: ((e.clientY - offset.top) * this._scale / this._zoom)
			}
			let delta = {
				x: (currentMousePosition.x - newMousePosition.x),
				y: (currentMousePosition.y - newMousePosition.y)
			}
			this.setPosition(this._pos[0] + delta.x, this._pos[1] + delta.y)
		} else {
			this._zoom = 1
			this.setPosition(this._bounds.x, this._bounds.y)
		}
	}

	onDomUpdated(vnode: Vnode<LineChartAttrs>) {
		this._domSvg = vnode.dom
		// _domSvg is actually SVGGraphicsElement but flow doesn't have the definition
		this._bounds = (this._domSvg: any).getBBox()
		this._pos = [this._bounds.x, this._bounds.y]
		this._viewBox = this._bounds
		this._offset = [this._domWrapper.offsetLeft, this._domWrapper.offsetTop]
		const newScale = this._viewBox.width / this._domSvg.clientWidth
		if (Math.round(newScale * 100) / 100 !== Math.round(this._scale * 100) / 100) {
			this._scale = newScale
			m.redraw()
		}
	}
}

/*  the svg coordinate system starts at 0,0 (x,y) in the upper left corner. Negative values are out
 *  of the visible area. The y-axis is inverted in comparison to our diagram data (top is 0, largest
 *  value is at the bottom. That is why y-values are inverted in the visible range
 */
function calculateX(x: number, a: LineChartAttrs, xFactor: number) {
	//console.log(x, xFactor, a)
	return Math.round((x - a.minX) * xFactor)
}

function calculateY(height: number, y: number, a: LineChartAttrs, yFactor: number) {
	return Math.round((height) - ((y - a.minY) * yFactor))
}


