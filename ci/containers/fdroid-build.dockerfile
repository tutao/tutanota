FROM registry.gitlab.com/fdroid/docker-executable-fdroidserver:master

COPY fdroid-build.sh /

ENTRYPOINT ["bash", "/fdroid-build.sh"]