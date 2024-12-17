// @generated
#![allow(unused_imports, dead_code, unused_variables)]
use crate::ApiCallError;
use crate::entities::Entity;
use crate::services::{PostService, GetService, PutService, DeleteService, Service, Executor, ExtraServiceParams};
use crate::bindings::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::entities::generated::storage::BlobAccessTokenPostIn;
use crate::entities::generated::storage::BlobAccessTokenPostOut;
use crate::entities::generated::storage::BlobReferencePutIn;
use crate::entities::generated::storage::BlobReferenceDeleteIn;
use crate::entities::generated::storage::BlobPostOut;
use crate::entities::generated::storage::BlobGetIn;
pub struct BlobAccessTokenService;

crate::service_impl!(declare, BlobAccessTokenService, "storage/blobaccesstokenservice", 11);
crate::service_impl!(POST, BlobAccessTokenService, BlobAccessTokenPostIn, BlobAccessTokenPostOut);


pub struct BlobReferenceService;

crate::service_impl!(declare, BlobReferenceService, "storage/blobreferenceservice", 11);
crate::service_impl!(PUT, BlobReferenceService, BlobReferencePutIn, ());
crate::service_impl!(DELETE, BlobReferenceService, BlobReferenceDeleteIn, ());


pub struct BlobService;

crate::service_impl!(declare, BlobService, "storage/blobservice", 11);
crate::service_impl!(POST, BlobService, (), BlobPostOut);
crate::service_impl!(GET, BlobService, BlobGetIn, ());
