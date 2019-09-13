//@flow
const map: {[string]: () => mixed} = {
    ReadCounterData: () => import('./ReadCounterData'),
    ReadCounterReturn: () => import('./ReadCounterReturn'),
    WriteCounterData: () => import('./WriteCounterData'),
    ApprovalMail: () => import('./ApprovalMail')
}
export default map