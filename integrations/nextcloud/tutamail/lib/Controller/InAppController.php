<?php

namespace OCA\TutaMail\Controller;

use OCP\AppFramework\Http\Attribute\ApiRoute;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\OCSController;
use OCP\IRequest;
use PhpParser\Error;

class InAppController extends OCSController {

    public function __construct(string $AppName, IRequest $request) {
        parent::__construct($AppName, $request);
    }


    /**
     * @return JSONResponse
     */
    #[PublicPage]
	#[NoCSRFRequired]
	#[ApiRoute(verb: 'GET', url: '/api/v1/version')]
	public function version(): JSONResponse
	{
	    $version = [
           	"major" => 1,
           	"minor" => 2,
           	"patch" => 3612610060,
    	];


	    $origin = $this->request->getHeader('Origin');
		if ( $origin != null && $origin != $this->request->getServerHost() ) {
		    $host = parse_url($origin, PHP_URL_HOST);
    		if (!in_array($host, ProxyController::$ALLOWED_ORIGINS, true)) {
                throw new ForbiddenOriginException($origin);
            }
			return new JSONResponse(json_encode($version), 200, ['Access-Control-Allow-Origin' => $origin]);
		} else {
		    return new JSONResponse(json_encode($version));
		}



	}
}
