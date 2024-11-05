#![allow(unused_imports, dead_code, unused_variables)]
use crate::entities::generated::monitor::ReadCounterData;
use crate::entities::generated::monitor::ReadCounterReturn;
use crate::entities::generated::monitor::ReportErrorIn;
use crate::entities::generated::monitor::WriteCounterData;
use crate::entities::Entity;
use crate::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::services::{
	DeleteService, Executor, ExtraServiceParams, GetService, PostService, PutService, Service,
};
use crate::ApiCallError;
pub struct CounterService;

crate::service_impl!(declare, CounterService, "monitor/counterservice", 29);
crate::service_impl!(POST, CounterService, WriteCounterData, ());
crate::service_impl!(GET, CounterService, ReadCounterData, ReadCounterReturn);

pub struct ReportErrorService;

crate::service_impl!(
	declare,
	ReportErrorService,
	"monitor/reporterrorservice",
	29
);
crate::service_impl!(POST, ReportErrorService, ReportErrorIn, ());
