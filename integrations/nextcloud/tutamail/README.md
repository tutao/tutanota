# Tuta Mail

The official Tuta Mail App for Nextcloud!

It allows you to use the Tuta web client inside Nextcloud. Additionally it offer a couple of integrations

## Tuta integrations with Nextcloud

Currently, there are two integrations with Nextcloud with more to come. You can

- save an attachment to your Nextcloud server
- generate a Nextcloud Talk room link in the location field of a Tuta calendar event.

These integrations work whether you use your Tuta account inside Nextcloud or on desktop/mobile/web.

In order to activate these integrations, you need to enable the Nextcloud plugin _from within your Tuta_ account:

- Go to Settings -> Plugins (Under Admin Settings)
- Enable the Nextcloud plugin
- Enter your Nextcloud URL and the folder name for saving attachments

## Setting up nextcloud container for development

### Install Docker

1) for Debian 13 use: `sudo apt install docker.io docker-compose`
2) Add yourself to docker group: `sudo usermod -aG docker $USER`
3) Logout-Login or reboot. Run `groups` to make sure you are in the docker group
4) start the docker daemon: `sudo systemct start docker`

### Setup and configure the nextcloud dev containers

1) Clone the official nextcloud dev containers: `git clone https://github.com/juliusknorr/`nextcloud-docker-dev
2) In `nextcloud-docker-dev` run the`./bootstart.sh` script.
3) In `docker-compose.yml` add these two lines under services>nextcloud>volumes, and make sure to replace
   `/path/to/tutanota/repository` with the correct path:
   ```yaml
       - '${HOME}/dev/repositories/tutanota/integrations/nextcloud/tutamail:/var/www/html/apps/tutamail'
       - '${HOME}/dev/repositories/tutanota/build/:/var/www/html/apps/tutamail/js'
   ```
4) Start the nextcloud container:
    * `docker compose up -d nextcloud` to start nextcloud
    * `rm .env` and run `./bootstrap.sh` again if something goes wrong.
5) Visit `http://nextcloud.local` from your browser

## PHP IDE Setup (PhpStorm)

1. Make sure [docker_dev setup is up and running](#setting-up-nextcloud-container-for-development)
2. Add php interpreter from running `php-dev` container
    * Goto Settings > PHP > Composer
    * In execution section, Click the three-dot icon and a new dialog will appear to add a php cli interpreter
    * Add new interpreter from docker image: `ghcr.io/juliusknorr/nextcloud-dev-php82:latest`
    * Apply and close the interpreter dialog
3. Specify path to composer executable
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
