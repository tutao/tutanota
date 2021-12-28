const map: Record<string, unknown> = {
    CustomerAccountPosting: () => import('./CustomerAccountPosting'),
    CustomerAccountReturn: () => import('./CustomerAccountReturn')
}
export default map