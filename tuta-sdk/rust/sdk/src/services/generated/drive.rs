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
use crate::entities::generated::drive::DriveItemPostIn;
use crate::entities::generated::drive::DriveItemPostOut;
use crate::entities::generated::drive::DriveItemPutIn;
use crate::entities::generated::drive::DriveItemDeleteIn;
use crate::entities::generated::drive::DrivePostIn;
pub struct DriveCopyService;

crate::service_impl!(declare, DriveCopyService, "drive/drivecopyservice", 1);
crate::service_impl!(POST, DriveCopyService, DriveCopyServicePostIn, ());


pub struct DriveFolderService;

crate::service_impl!(declare, DriveFolderService, "drive/drivefolderservice", 1);
crate::service_impl!(POST, DriveFolderService, DriveFolderServicePostIn, DriveFolderServicePostOut);
crate::service_impl!(PUT, DriveFolderService, DriveFolderServicePutIn, ());
crate::service_impl!(DELETE, DriveFolderService, DriveFolderServiceDeleteIn, ());


pub struct DriveItemService;

crate::service_impl!(declare, DriveItemService, "drive/driveitemservice", 1);
crate::service_impl!(POST, DriveItemService, DriveItemPostIn, DriveItemPostOut);
crate::service_impl!(PUT, DriveItemService, DriveItemPutIn, ());
crate::service_impl!(DELETE, DriveItemService, DriveItemDeleteIn, ());


pub struct DriveService;

crate::service_impl!(declare, DriveService, "drive/driveservice", 1);
crate::service_impl!(POST, DriveService, DrivePostIn, ());
