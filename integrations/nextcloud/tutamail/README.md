# Tuta Mail

This is the official Tuta Mail plugin for nextcloud.

## Setting up nextcloud container for development

1) Install docker:
    * for Debian 13 use: `sudo apt install docker.io docker-compose`
    * Add yourself to docker group: `sudo usermod -aG docker $USER`
    * Logout-Login or reboot. Run `groups` to make sure you are in the docker group
    * start the docker daemon: `sudo systemct start docker`
2) Clone the official nextcloud dev containers: `git clone https://github.com/juliusknorr/`nextcloud-docker-dev
3) In `nextcloud-docker-dev` run the`./bootstart.sh` script.
4) In `docker-compose.yml` add these two lines under services>nextcloud>volumes,
   and make sure to replace
   `/path/to/tutanota/repository` with the correct path:
   ```yaml
       - '/path/to/tutanota/repository/integrations/nextcloud/tutamail:/var/www/html/apps-extra/tutamail'
       - '/path/to/tutanota/repository/build/:/var/www/html/apps-extra/tutamail/js'
   ```
5) Start the nextcloud container:
    * `docker compose up -d nextcloud` to start nextcloud
    * `rm .env` and run `./bootstrap.sh` again if something goes wrong.
6) Visit `http://nextcloud.local` from your browser

## Plugin Usage

1. [Setup](#setting-up-nextcloud-container-for-development) the nextcloud-docker-dev environment
2. Clone this repo into *nextcloud-docker-dev/workspace/server/apps-extra/* and name it `tutamail`

```bash
git clone git@gitlab:tuta/nextcloud-plugins.git nextcloud-docker-dev/workspace/server/apps-extra/tutamail
```

3. Make sure that the tuta monorepo is linked as a submodule `git submodule update`
4. Run `npm ci` from *apps-extra/tutamail*
5. Run `npm ci` from *apps-extra/tutamail/tuta*
6. Follow instruction
   from [tutanota client project](https://github.com/tutao/tutanota/blob/master/doc/BUILDING.md#build-steps)
   on how to build the client but pass the flag `--integrate-nextcloud`. Example:

```bash
npm ci
npm run build-packages
node make --integrate-nextcloud
```

## IDE Setup

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

## TODO

Once your app is ready follow the [instructions](https://nextcloudappstore.readthedocs.io/en/latest/developer.html) to
upload it to the Appstore.

## Resources

### Documentation for developers:

- General documentation and tutorials: https://nextcloud.com/developer
- Technical documentation: https://docs.nextcloud.com/server/latest/developer_manual

### Help for developers:

- Official community chat: https://cloud.nextcloud.com/call/xs25tz5y
- Official community forum: https://help.nextcloud.com/c/dev/11
