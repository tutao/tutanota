const map = {
    UsageTestAssignment: () => import('./UsageTestAssignment.js'),
    UsageTestAssignmentIn: () => import('./UsageTestAssignmentIn.js'),
    UsageTestAssignmentOut: () => import('./UsageTestAssignmentOut.js'),
    UsageTestMetricConfig: () => import('./UsageTestMetricConfig.js'),
    UsageTestMetricConfigValue: () => import('./UsageTestMetricConfigValue.js'),
    UsageTestMetricData: () => import('./UsageTestMetricData.js'),
    UsageTestParticipationIn: () => import('./UsageTestParticipationIn.js'),
    UsageTestStage: () => import('./UsageTestStage.js')
}
export default map