package main

import (
	"TutamailProxy/routes"
	"flag"
	"log"
)

func main() {
	targetHost := flag.String("targetHost", "http://localhost:9000", "target host for tutadb")
	listenAddress := flag.String("listenAddress", "0.0.0.0:10070", "Address to listen on for new connections")
	flag.Parse()

	server := routes.NewTutaProxy(*targetHost)
	server.RegisterExAppEssentials()
	server.RegisterExtensionApi()
	server.RegisterTutaProxy()

	log.Println("Starting TutamailProxy...")
	server.Run(*listenAddress)
}
