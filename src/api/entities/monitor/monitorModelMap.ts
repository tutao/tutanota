const map = {
    ApprovalMail: () => import('./ApprovalMail.js'),
    ReadCounterData: () => import('./ReadCounterData.js'),
    ReadCounterReturn: () => import('./ReadCounterReturn.js'),
    WriteCounterData: () => import('./WriteCounterData.js')
}
export default map