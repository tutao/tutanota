type Point = { x: number; y: number }
type Range = readonly [number, number]

export const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number): Point => {
	const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180

	return {
		x: centerX + radius * Math.cos(angleInRadians),
		y: centerY + radius * Math.sin(angleInRadians),
	}
}

export const drawArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number): string => {
	const start = polarToCartesian(x, y, radius, endAngle)
	const end = polarToCartesian(x, y, radius, startAngle)

	const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

	return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ")
}

export const scaleValue = (value: number, from: Range, to: Range): number => {
	const scale = (to[1] - to[0]) / (from[1] - from[0])
	const capped = Math.min(from[1], Math.max(from[0], value)) - from[0]
	return ~~(capped * scale + to[0])
}
