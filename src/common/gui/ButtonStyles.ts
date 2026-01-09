export type ButtonVariant = "primary" | "secondary" | "tertiary"
export type ButtonSize = "sm" | "md" | "lg"
export type ButtonWidth = "full" | "flex"

const sizeClassBySize: Record<ButtonSize, string> = {
	sm: "base-button-sm",
	md: "base-button-md",
	lg: "base-button-lg",
}

const variantClasses: Record<ButtonVariant, string[]> = {
	primary: ["accent-bg"],
	secondary: ["tutaui-button-outline"],
	tertiary: ["tutaui-button-ghost"],
}

export interface ButtonStyleConfig {
	variant: ButtonVariant
	size?: ButtonSize
	width?: ButtonWidth
	className?: string
	disabled?: boolean
}

export function resolveButtonClasses(config: ButtonStyleConfig): string[] {
	const classes: string[] = ["button-content", "border-radius", "text-center", "flex", "justify-center", "items-center", "gap-8"]

	if (config.disabled) {
		classes.push("disabled-button")
	} else {
		classes.push(...variantClasses[config.variant])
	}

	const width = config.width ?? "full"
	if (width === "flex") {
		classes.push("plr-48")
	} else {
		classes.push("full-width", "plr-8")
	}

	if (config.size) {
		const sizeClass = sizeClassBySize[config.size]
		if (sizeClass) classes.push(sizeClass)
	} else {
		classes.push(sizeClassBySize["md"])
	}

	if (config.className) {
		classes.push(config.className)
	}

	return classes
}
