export enum SupportVisibilityMask {
	DesktopOrWebApp = 1 << 0, // 1
	TutaMailMobile = 1 << 1, // 2
	TutaCalendarMobile = 1 << 2, // 4
	FreeUsers = 1 << 3, // 8
	PaidUsers = 1 << 4, // 16
	ShowFasttrackButton = 1 << 5, // 32
}

export function isSupportVisibilityEnabled(visibility: number, mask: SupportVisibilityMask) {
	return !!(visibility & mask)
}
