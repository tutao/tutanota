#![allow(unused_imports, dead_code, unused_variables)]
use crate::entities::monitor::ReadCounterData;
use crate::entities::monitor::ReadCounterReturn;
use crate::entities::monitor::ReportErrorIn;
use crate::entities::monitor::WriteCounterData;
use crate::entities::Entity;
use crate::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::services::{
	DeleteService, Executor, ExtraServiceParams, GetService, PostService, PutService, Service,
};
use crate::ApiCallError;
pub struct CounterService;

crate::service_impl!(declare, CounterService, "monitor/counterservice", 28);
crate::service_impl!(POST, CounterService, WriteCounterData, ());
crate::service_impl!(GET, CounterService, ReadCounterData, ReadCounterReturn);

pub struct ReportErrorService;

crate::service_impl!(
	declare,
	ReportErrorService,
	"monitor/reporterrorservice",
	28
);
crate::service_impl!(POST, ReportErrorService, ReportErrorIn, ());
