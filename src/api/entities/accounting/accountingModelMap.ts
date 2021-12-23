//@flow
const map: {[string]: () => mixed} = {
    CustomerAccountPosting: () => import('./CustomerAccountPosting'),
    CustomerAccountReturn: () => import('./CustomerAccountReturn')
}
export default map