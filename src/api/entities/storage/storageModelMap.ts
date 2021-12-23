const map: Record<string, unknown> = {
	BlobDataGet: () => import('./BlobDataGet'),
	BlobWriteData: () => import('./BlobWriteData'),
	BlobAccessTokenData: () => import('./BlobAccessTokenData'),
	BlobAccessTokenReturn: () => import('./BlobAccessTokenReturn'),
	BlobReferenceDataPut: () => import('./BlobReferenceDataPut'),
	BlobReferenceDataDelete: () => import('./BlobReferenceDataDelete')
}
export default map