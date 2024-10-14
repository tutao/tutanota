#![allow(unused_imports, dead_code, unused_variables)]
use crate::entities::accounting::CustomerAccountReturn;
use crate::entities::Entity;
use crate::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::services::{
	DeleteService, Executor, ExtraServiceParams, GetService, PostService, PutService, Service,
};
use crate::ApiCallError;
pub struct CustomerAccountService;

crate::service_impl!(
	declare,
	CustomerAccountService,
	"accounting/customeraccountservice",
	7
);
crate::service_impl!(GET, CustomerAccountService, (), CustomerAccountReturn);
