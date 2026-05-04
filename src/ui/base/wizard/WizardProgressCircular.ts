import m, { Component, Vnode } from "mithril"
import { WizardProgressAttrs } from "./WizardProgress"
import { drawArc, scaleValue } from "./WizardProgressUtils"
import { theme } from "../../theme"
import { px } from "../../size"

type ProgressSegment = {
	total: number
	filled: number
}

type Arc = {
	centerX: number
	centerY: number
	start: number
	end: number
	isComplete: boolean
	filled: number
}

export interface WizardProgressCircularAttrs extends WizardProgressAttrs {
	size: number
	lineWidth: number
}

export class WizardProgressCircular implements Component<WizardProgressCircularAttrs> {
	private arcs: Arc[] = []

	view({ attrs: { progressState, onClick, labelMaxLength, size, lineWidth } }: Vnode<WizardProgressCircularAttrs>) {
		const segments = progressState
			.filter((step) => step.isEnabled)
			.map((progressViewItem, idx) => {
				return {
					total: 1,
					filled: idx <= progressViewItem.currentIndex ? 1 : 0,
				}
			})

		const arcSpacing = 20
		const totalArcSize = 360
		const radius = size / 2 - lineWidth

		const totalArcs = segments.length

		const totalSpaces = totalArcs
		const totalSpacing = totalSpaces * arcSpacing

		const arcSize = (totalArcSize - totalSpacing) / totalArcs
		const arcsStart = 90 - totalArcSize / 2

		const margin = 0

		this.arcs = segments.map((goal, index) => {
			const newArc: Arc = {
				centerX: radius + lineWidth + margin,
				centerY: radius + lineWidth + margin,
				start: arcsStart + index * arcSize,
				end: arcsStart + arcSize + index * arcSize,
				isComplete: goal.total === goal.filled,
				filled: 0,
			}

			if (index !== 0) {
				newArc.start += arcSpacing * index
				newArc.end += arcSpacing * index
			}

			newArc.filled = scaleValue(goal.filled, [0, goal.total], [newArc.start, newArc.end])

			return newArc
		})
		let filledCount = 0
		return m(".rel", { style: { width: px(size), height: px(size) } }, [
			m("svg.circular-progress", { width: size, height: size, style: { transform: `rotate(${arcSpacing / 2}deg)` } }, [
				this.arcs.map((arc, index) => {
					if (arc.filled !== arc.start) filledCount++
					return m("g", { key: index.toString() }, [
						m("path", {
							fill: "none",
							stroke: theme.surface_container_highest,
							"stroke-width": lineWidth,
							"stroke-linecap": "round",
							d: drawArc(arc.centerX, arc.centerY, radius, arc.start, arc.end),
						}),

						arc.filled > arc.start
							? m("path", {
									fill: "none",
									// stroke: arc.isComplete ? theme.outline : theme.surface_container_highest,
									stroke: theme.outline,
									"stroke-width": lineWidth,
									"stroke-linecap": "round",
									d: drawArc(arc.centerX, arc.centerY, radius, arc.start, arc.filled),
								})
							: null,
					])
				}),
			]),
			m(
				".abs.font-mdio",
				{
					style: {
						top: "53%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						color: theme.on_surface_variant,
					},
				},
				filledCount,
			),
		])
	}
}
