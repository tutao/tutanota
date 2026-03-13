.DEFAULT_GOAL := help

GITHUB_USERNAME := kibibytium

APP_ID := tutamail
APP_NAME := TutaMail
APP_VERSION := 1.0.0
APP_SECRET := 12345
APP_PORT := 10070

JSON_INFO := "{\"id\":\"$(APP_ID)\",\"name\":\"$(APP_NAME)\",\"daemon_config_name\":\"manual_install\",\"version\":\"$(APP_VERSION)\",\"secret\":\"$(APP_SECRET)\",\"port\":$(APP_PORT),\"routes\":[{\"url\":\".*\",\"verb\":\"GET, POST, PUT, DELETE\",\"access_level\":1,\"headers_to_exclude\":[]}]}"

.PHONY: help
help:
	@echo "  Welcome to $(APP_NAME) $(APP_VERSION)!"
	@echo " "
	@echo "  Please use \`make <target>\` where <target> is one of"
	@echo " "
	@echo "  build-push        builds CPU images and uploads them to ghcr.io"
	@echo " "
	@echo "  > Next commands are only for the dev environment with nextcloud-docker-dev!"
	@echo "  > They must be run from the host you are developing on, not in a Nextcloud container!"
	@echo " "
	@echo "  > Commands for manual registration of ExApp($(APP_NAME) should be running!):"
	@echo " "
	@echo "  register          performs registration of running $(APP_NAME) into the 'manual_install' deploy daemon."


.PHONY: build-push
build-push:
	docker login ghcr.io
	docker buildx build --push --platform linux/arm64/v8,linux/amd64 --tag ghcr.io/$(GITHUB_USERNAME)/$(APP_ID):latest .

.PHONY: register
register:
	docker exec master-nextcloud-1 sudo -u www-data php occ app_api:app:unregister $(APP_ID) --silent --force || true
	docker exec master-nextcloud-1 sudo -u www-data php occ app_api:app:register $(APP_ID) manual_install --json-info $(JSON_INFO) --wait-finish

.PHONY: build
build:
	go build main.go -o ../../../build/tutamail_proxy