<?php

declare(strict_types=1);

namespace OCA\TutaMail\Controller;

use OCP\AppFramework\Http\Attribute\ApiRoute;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\DataDisplayResponse;
use OCP\AppFramework\OCSController;
use OCP\Http\Client\IClientService;
use OCP\Http\Client\IResponse;
use OCP\IRequest;
use RuntimeException;

/**
 * @psalm-suppress UnusedClass
 */
class ApiController extends OCSController
{
	private IClientService $clientService;
	private string $TUTADB_SERVER_URL = 'http://frm:9000';

	public function __construct(
			string         $appName,
			IRequest       $request,
			IClientService $clientService,
	)
	{
		parent::__construct($appName, $request);
		$this->clientService = $clientService;
	}

	/**
	 * @throws \Exception
	 */
	#[NoAdminRequired]
	#[ApiRoute(
			verb: 'GET',
			url: '/rest/{tutadbAppName}/{component}',
			requirements: ['component' => '.+'],
	)]
	public function tutaDbGETServiceResourceRedirect(): DataDisplayResponse
	{
		return $this->redirectToTutadbServer();
	}

	/**
	 * @throws \Exception
	 */
	#[NoAdminRequired]
	#[ApiRoute(
			verb: 'POST',
			url: '/rest/{tutadbAppName}/{component}',
			requirements: ['component' => '.+'],
	)]
	public function tutaDbPOSTServiceRedirect(): DataDisplayResponse
	{
		return $this->redirectToTutadbServer();
	}

	/**
	 * @throws \Exception
	 */
	#[NoAdminRequired]
	#[ApiRoute(
			verb: 'DELETE',
			url: '/rest/{tutadbAppName}/{component}',
			requirements: ['component' => '.+'],
	)]
	public function tutaDbDELETERedirect(): DataDisplayResponse
	{
		return $this->redirectToTutadbServer();
	}

	/**
	 * @throws \Exception
	 */
	#[NoAdminRequired]
	#[ApiRoute(
			verb: 'PATCH',
			url: '/rest/{tutadbAppName}/{component}',
			requirements: ['component' => '.+'],
	)]
	public function tutaDbPATCHRedirect(): DataDisplayResponse
	{
		return $this->redirectToTutadbServer();
	}

	/**
	 * @throws \Exception
	 */
	private function redirectToTutadbServer(): DataDisplayResponse
	{
		$request = $this->request;
		$client = $this->clientService->newClient();

		$tutab_path = $this->getRedirectedTutadbPath($request);
		$options = $this->makeTutadbRequstOptions($request);
		$tutabResponse = $client->request($request->getMethod(), $tutab_path, $options);
		return $this->wrapResponseFromTutadb($tutabResponse);

	}

	/**
	 * @throws \Exception
	 */
	private function getRedirectedTutadbPath(IRequest $request): string
	{
		$pathInfo = $request->getPathInfo();
		if ($pathInfo === false) {
			throw new RuntimeException('Could not get path info');
		}
		$tutadbPath = substr($pathInfo, strlen('/apps/tutamail'));
		return $this->TUTADB_SERVER_URL . $tutadbPath;
	}


	public function wrapResponseFromTutadb(IResponse $tutabResponse): DataDisplayResponse
	{
		$response = new DataDisplayResponse();
		return $response
				->setData($tutabResponse->getBody())
				->setHeaders($tutabResponse->getHeaders())
				->addHeader('X-TutaIntegrationPlatform', 'Nextcloud::v1')
				->setStatus($tutabResponse->getStatusCode());
	}

	/**
	 * @param IRequest $request
	 * @return array
	 */
	public function makeTutadbRequstOptions(IRequest $request): array
	{
		$headers = getallheaders();
		if ($headers === false) {
			throw new RuntimeException('Could not get request headers');
		}
		$headers['X-TutaIntegrationPlatform'] = 'Nextcloud::v1';
		unset($headers['OCS-APIRequest']);
		unset($headers['Cookie']);

		$body_target = $request->getMethod() === 'GET' ? 'query' : 'body';

		if ($body_target === 'body') {
			$body = file_get_contents('php://input');
		} else {
			$body = $request->getParams();
			unset($body['_route']);
			unset($body['tutadbAppName']);
			unset($body['component']);
		}

		$options = [
				'headers' => $headers,
				$body_target => $body,
				'http_errors' => false
		];
		return $options;
	}

}
/*
 *
 2026-03-05T15:33:19.350500214Z {"reqId":"uScnpZ7YWpvCj2F0ddvD","level":3,"time":"2026-03-05T15:33:18+00:00","remoteAddr":"192.168.21.5","user":"admin","app":"no app in context","method":"POST","url":"/ocs/v2.php/apps/tutamail/rest/sys/sessionservice","scriptName":"/ocs/v2.php","message":"Tutadb request body2: {\"1212\":\"0\",\"1213\":\"bed-free@tutanota.de\",\"1214\":\"9freUO-QALnxP1N6amLDE7Om_NpEpTWwazRC4u3-UUU\",\"1215\":\"Firefox Browser\",\"1216\":null,\"1217\":null,\"1218\":[],\"1417\":null}","userAgent":"Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0","version":"34.0.0.0","data":[]}

 */