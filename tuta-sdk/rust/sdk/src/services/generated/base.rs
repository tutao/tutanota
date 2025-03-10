// @generated
#![allow(unused_imports, dead_code, unused_variables)]
use crate::ApiCallError;
use crate::entities::Entity;
use crate::services::{PostService, GetService, PutService, DeleteService, Service, Executor, ExtraServiceParams};
use crate::bindings::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::entities::generated::base::ApplicationTypesGetOut;
pub struct ApplicationTypesService;

crate::service_impl!(declare, ApplicationTypesService, "base/applicationtypesservice", 2);
crate::service_impl!(GET, ApplicationTypesService, (), ApplicationTypesGetOut);
