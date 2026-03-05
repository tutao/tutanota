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
	private string $TUTADB_SERVER_URL = 'http://hostname:9000';

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
		$body = $request->getParams();
		unset($body['_route']);
		unset($body['tutadbAppName']);
		unset($body['component']);
		if ($body_target === 'body') {
			$body = json_encode($body);
		}

		$options = [
			'headers' => $headers,
			$body_target => $body
		];
		return $options;
	}

}
