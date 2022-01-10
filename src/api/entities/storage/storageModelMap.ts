const map = {
    BlobDataGet: () => import('./BlobDataGet.js'),
    BlobWriteData: () => import('./BlobWriteData.js'),
    BlobAccessTokenData: () => import('./BlobAccessTokenData.js'),
    BlobAccessTokenReturn: () => import('./BlobAccessTokenReturn.js'),
    BlobReferenceDataPut: () => import('./BlobReferenceDataPut.js'),
    BlobReferenceDataDelete: () => import('./BlobReferenceDataDelete.js')
}
export default map