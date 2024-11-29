// @generated
#![allow(unused_imports, dead_code, unused_variables)]
use crate::ApiCallError;
use crate::entities::Entity;
use crate::services::{PostService, GetService, PutService, DeleteService, Service, Executor, ExtraServiceParams};
use crate::bindings::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::entities::generated::accounting::CustomerAccountReturn;
pub struct CustomerAccountService;

crate::service_impl!(declare, CustomerAccountService, "accounting/customeraccountservice", 7);
crate::service_impl!(GET, CustomerAccountService, (), CustomerAccountReturn);
