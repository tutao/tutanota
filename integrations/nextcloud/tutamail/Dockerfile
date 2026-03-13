FROM golang:latest

COPY ex_app/go.mod ${GOPATH}/app/
COPY ex_app/main.go ${GOPATH}/app/


WORKDIR ${GOPATH}/app/

ENTRYPOINT ["go", "run", "main.go", "--targetHost", "https://app.test.tuta.com"]