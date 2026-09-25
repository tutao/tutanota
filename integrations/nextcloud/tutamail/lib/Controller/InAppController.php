<?php

namespace OCA\TutaMail\Controller;

use OCP\AppFramework\Http\Attribute\ApiRoute;
use OCP\AppFramework\Http\Attribute\CORS;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\OCSController;
use OCP\IRequest;

class InAppController extends OCSController {

    public function __construct(string $AppName, IRequest $request) {
        parent::__construct($AppName, $request);
    }


    /**
     * @return JSONResponse
     */
    #[PublicPage]
	#[NoCSRFRequired]
	#[CORS]
	#[ApiRoute(verb: 'GET', url: '/api/v1/version')]
	public function version(): JSONResponse
	{
    	$version = [
           	"major" => 0,
           	"minor" => 1,
           	"patch" => 0,
    	];
	    return new JSONResponse(json_encode($version));
	}
}
