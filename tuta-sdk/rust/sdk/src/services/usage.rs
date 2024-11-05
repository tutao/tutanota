#![allow(unused_imports, dead_code, unused_variables)]
use crate::entities::usage::UsageTestAssignmentIn;
use crate::entities::usage::UsageTestAssignmentOut;
use crate::entities::usage::UsageTestParticipationIn;
use crate::entities::Entity;
use crate::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::services::{
	DeleteService, Executor, ExtraServiceParams, GetService, PostService, PutService, Service,
};
use crate::ApiCallError;
pub struct UsageTestAssignmentService;

crate::service_impl!(
	declare,
	UsageTestAssignmentService,
	"usage/usagetestassignmentservice",
	2
);
crate::service_impl!(
	POST,
	UsageTestAssignmentService,
	UsageTestAssignmentIn,
	UsageTestAssignmentOut
);
crate::service_impl!(
	PUT,
	UsageTestAssignmentService,
	UsageTestAssignmentIn,
	UsageTestAssignmentOut
);

pub struct UsageTestParticipationService;

crate::service_impl!(
	declare,
	UsageTestParticipationService,
	"usage/usagetestparticipationservice",
	2
);
crate::service_impl!(
	POST,
	UsageTestParticipationService,
	UsageTestParticipationIn,
	()
);
