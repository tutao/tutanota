#![allow(unused_imports, dead_code, unused_variables)]
use crate::entities::storage::BlobAccessTokenPostIn;
use crate::entities::storage::BlobAccessTokenPostOut;
use crate::entities::storage::BlobGetIn;
use crate::entities::storage::BlobPostOut;
use crate::entities::storage::BlobReferenceDeleteIn;
use crate::entities::storage::BlobReferencePutIn;
use crate::entities::Entity;
use crate::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::services::{
	DeleteService, Executor, ExtraServiceParams, GetService, PostService, PutService, Service,
};
use crate::ApiCallError;
pub struct BlobAccessTokenService;

crate::service_impl!(
	declare,
	BlobAccessTokenService,
	"storage/blobaccesstokenservice",
	9
);
crate::service_impl!(
	POST,
	BlobAccessTokenService,
	BlobAccessTokenPostIn,
	BlobAccessTokenPostOut
);

pub struct BlobReferenceService;

crate::service_impl!(
	declare,
	BlobReferenceService,
	"storage/blobreferenceservice",
	9
);
crate::service_impl!(PUT, BlobReferenceService, BlobReferencePutIn, ());
crate::service_impl!(DELETE, BlobReferenceService, BlobReferenceDeleteIn, ());

pub struct BlobService;

crate::service_impl!(declare, BlobService, "storage/blobservice", 9);
crate::service_impl!(POST, BlobService, (), BlobPostOut);
crate::service_impl!(GET, BlobService, BlobGetIn, ());
