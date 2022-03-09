const map = {
    BlobAccessTokenData: () => import('./BlobAccessTokenData.js'),
    BlobAccessTokenReturn: () => import('./BlobAccessTokenReturn.js'),
    BlobDataGet: () => import('./BlobDataGet.js'),
    BlobReferenceDataDelete: () => import('./BlobReferenceDataDelete.js'),
    BlobReferenceDataPut: () => import('./BlobReferenceDataPut.js'),
    BlobWriteData: () => import('./BlobWriteData.js')
}
export default map