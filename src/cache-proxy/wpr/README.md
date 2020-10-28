go get -u github.com/catapult-project/catapult
go get -u github.com/urfave/cli
go get -u golang.org/x/net/http2

rm ./platforms/darwin/wpr && env GOOS=darwin GOARCH=amd64 go build -o ./platforms/darwin/wpr $GOPATH/src/github.com/catapult-project/catapult/web_page_replay_go/src/wpr.go 

rm ./platforms/linux/wpr && env GOOS=linux GOARCH=amd64 go build -o ./platforms/linux/wpr $GOPATH/src/github.com/catapult-project/catapult/web_page_replay_go/src/wpr.go 
