package main

import (
	"TutamailProxy/routes"
	"flag"
	"log"
)

func main() {
	targetHost := flag.String("targetHost", "http://localhost:9000", "target host for tutadb")
	listenAddress := "0.0.0.0:10070"
	flag.Parse()

	server := routes.NewTutaProxy(*targetHost)
	server.RegisterExAppEssentials()
	server.RegisterExtensionApi()
	server.RegisterTutaProxy()

	log.Println("Starting TutamailProxy...")
	server.Run(listenAddress)
}
