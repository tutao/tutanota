const map = {
    BlobAccessTokenPostIn: () => import('./BlobAccessTokenPostIn.js'),
    BlobAccessTokenPostOut: () => import('./BlobAccessTokenPostOut.js'),
    BlobArchiveRef: () => import('./BlobArchiveRef.js'),
    BlobGetIn: () => import('./BlobGetIn.js'),
    BlobId: () => import('./BlobId.js'),
    BlobPostOut: () => import('./BlobPostOut.js'),
    BlobReadData: () => import('./BlobReadData.js'),
    BlobReferenceDeleteIn: () => import('./BlobReferenceDeleteIn.js'),
    BlobReferencePutIn: () => import('./BlobReferencePutIn.js'),
    BlobServerAccessInfo: () => import('./BlobServerAccessInfo.js'),
    BlobServerUrl: () => import('./BlobServerUrl.js'),
    BlobWriteData: () => import('./BlobWriteData.js'),
    InstanceId: () => import('./InstanceId.js')
}
export default map