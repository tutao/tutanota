// @generated
#![allow(unused_imports, dead_code, unused_variables)]
use crate::ApiCallError;
use crate::entities::Entity;
use crate::services::{PostService, GetService, PutService, DeleteService, Service, Executor, ExtraServiceParams};
use crate::bindings::rest_client::HttpMethod;
use crate::services::hidden::Nothing;
use crate::entities::generated::drive::DriveCopyServicePostIn;
use crate::entities::generated::drive::DriveFolderServicePostIn;
use crate::entities::generated::drive::DriveFolderServicePostOut;
use crate::entities::generated::drive::DriveFolderServicePutIn;
use crate::entities::generated::drive::DriveFolderServiceDeleteIn;
use crate::entities::generated::drive::DriveCreateData;
use crate::entities::generated::drive::DriveCreateReturn;
use crate::entities::generated::drive::DrivePutIn;
use crate::entities::generated::drive::DriveDeleteIn;
use crate::entities::generated::drive::DriveDeleteOut;
pub struct DriveCopyService;

crate::service_impl!(declare, DriveCopyService, "drive/drivecopyservice", 1);
crate::service_impl!(POST, DriveCopyService, DriveCopyServicePostIn, ());


pub struct DriveFolderService;

crate::service_impl!(declare, DriveFolderService, "drive/drivefolderservice", 1);
crate::service_impl!(POST, DriveFolderService, DriveFolderServicePostIn, DriveFolderServicePostOut);
crate::service_impl!(PUT, DriveFolderService, DriveFolderServicePutIn, ());
crate::service_impl!(DELETE, DriveFolderService, DriveFolderServiceDeleteIn, ());


pub struct DriveService;

crate::service_impl!(declare, DriveService, "drive/driveservice", 1);
crate::service_impl!(POST, DriveService, DriveCreateData, DriveCreateReturn);
crate::service_impl!(PUT, DriveService, DrivePutIn, ());
crate::service_impl!(DELETE, DriveService, DriveDeleteIn, DriveDeleteOut);
