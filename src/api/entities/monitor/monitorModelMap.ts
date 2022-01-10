const map = {
    ReadCounterData: () => import('./ReadCounterData.js'),
    ReadCounterReturn: () => import('./ReadCounterReturn.js'),
    WriteCounterData: () => import('./WriteCounterData.js'),
    ApprovalMail: () => import('./ApprovalMail.js')
}
export default map