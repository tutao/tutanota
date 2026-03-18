# Tuta Mail

This is the official Tuta Mail plugin for nextcloud.

## Setting up nextcloud container for development

### Install Docker

1) for Debian 13 use: `sudo apt install docker.io docker-compose`
2) Add yourself to docker group: `sudo usermod -aG docker $USER`
3) Logout-Login or reboot. Run `groups` to make sure you are in the docker group
4) start the docker daemon: `sudo systemct start docker`

### Setup and configure the nextcloud dev containers

1) Clone the official nextcloud dev containers: `git clone https://github.com/juliusknorr/`nextcloud-docker-dev
2) In `nextcloud-docker-dev` run the`./bootstart.sh` script.
3) In `docker-compose.yml` add these two lines under services>nextcloud>volumes,
   and make sure to replace
   `/path/to/tutanota/repository` with the correct path:
   ```yaml
       - '/path/to/tutanota/repository/integrations/nextcloud/tutamail:/var/www/html/apps-extra/tutamail'
       - '/path/to/tutanota/repository/build/:/var/www/html/apps-extra/tutamail/js'
   ```
4) Start the nextcloud container:
    * `docker compose up -d nextcloud` to start nextcloud
    * `rm .env` and run `./bootstrap.sh` again if something goes wrong.
5) Visit `http://nextcloud.local` from your browser
6) Under Admin Settings in Nextcloud, activate install the "manual_install" deploy daemon.

## How to build the plugin (Local Dev)

1. [Setup](#setting-up-nextcloud-container-for-development) the nextcloud-docker-dev environment
2. Clone this repo into `nextcloud-docker-dev/workspace/server/apps-extra/` and name it `tutamail`
3. Build the Tuta Web App in `nextcloud-docker-dev/workspace/server/apps-extra/tutamail`

```bash
npm ci
node make --integrate-nextcloud
```
4. Run the ExApp Proxy:
```bash
cd `/path/to/nextcloud-docker-dev/workspace/server/apps-extra/tutamail/`
go run main.go -targetHost "https://app.tuta.com"
```



## PHP IDE Setup

1. Use phpStorm ( You can download from your jetbrains toolbox)
2. Make sure [docker_dev setup is up and running](#setting-up-nextcloud-container-for-development)
3. Add php interpreter from running `php-dev` container
    * Goto Settings > PHP > Composer
    * In execution section, Click the three-dot icon and a new dialog will appear to add
      a php cli interpreter
    * Add new interpreter from docker image: `ghcr.io/juliusknorr/nextcloud-dev-php82:latest`
    * Apply and close the interpreter dialog
4. Specify path to composer executable
    * In Settings > Php > Composer > Execution section,
    * Select `ghcr.io/juliusknorr/nextcloud-dev-php82:latest` from dropdown for CLI interpreter
    * Put `/usr/local/bin/composer` as the composer executable path

## Resources

### Documentation for developers:

- General documentation and tutorials: https://nextcloud.com/developer
- Technical documentation: https://docs.nextcloud.com/server/latest/developer_manual

### Help for developers:

- Official community chat: https://cloud.nextcloud.com/call/xs25tz5y
- Official community forum: https://help.nextcloud.com/c/dev/11
