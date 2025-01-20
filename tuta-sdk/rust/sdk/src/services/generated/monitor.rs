// @generated
#![allow(unused_imports, dead_code, unused_variables)]
use crate::ApiCallError;
use crate::entities::Entity;
use crate::services::{PostService, GetService, PutService, DeleteService, Service, Executor, ExtraServiceParams};
use crate::bindings::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::entities::generated::monitor::WriteCounterData;
use crate::entities::generated::monitor::ReadCounterData;
use crate::entities::generated::monitor::ReadCounterReturn;
use crate::entities::generated::monitor::ReportErrorIn;
pub struct CounterService;

crate::service_impl!(declare, CounterService, "monitor/counterservice", 30);
crate::service_impl!(POST, CounterService, WriteCounterData, ());
crate::service_impl!(GET, CounterService, ReadCounterData, ReadCounterReturn);


pub struct ReportErrorService;

crate::service_impl!(declare, ReportErrorService, "monitor/reporterrorservice", 30);
crate::service_impl!(POST, ReportErrorService, ReportErrorIn, ());
