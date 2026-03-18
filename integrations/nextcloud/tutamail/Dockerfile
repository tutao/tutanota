FROM golang:latest

RUN mkdir -p $GOPATH/app

COPY ex_app/ ${GOPATH}/app/
COPY --chmod=775 healthcheck.sh /

EXPOSE 10070

WORKDIR ${GOPATH}/app

ENTRYPOINT ["go", "run", "main.go", "--targetHost", "https://app.tuta.com"]

HEALTHCHECK --interval=2s --timeout=2s --retries=300 CMD /healthcheck.sh