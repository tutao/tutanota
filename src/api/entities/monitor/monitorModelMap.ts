const map: Record<string, unknown> = {
	ReadCounterData: () => import('./ReadCounterData'),
	ReadCounterReturn: () => import('./ReadCounterReturn'),
	WriteCounterData: () => import('./WriteCounterData'),
	ApprovalMail: () => import('./ApprovalMail')
}
export default map