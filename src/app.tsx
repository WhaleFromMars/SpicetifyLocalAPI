async function main() {
    while (!Spicetify?.showNotification) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Initialize WebSocket connection
    console.log("trying connection")
    const player = Spicetify.Player

    function connectWebSocket() {
        const socket = new WebSocket('ws://localhost:8080')

        socket.onopen = () => {
            console.log('WebSocket connection established')

            //send the current player state
            var data = player.data
            if (data != null) {
                socket.send('playerState|' + JSON.stringify(data))
            }
        }

        socket.onmessage = (event) => {
            const message = event.data as string
            handleCommand(message, socket)
        }

        socket.onclose = () => {
            console.log('WebSocket connection closed, retrying in 1 second...')
            setTimeout(connectWebSocket, 1000)
        }

        socket.onerror = (error) => {
            console.error('WebSocket error:', error)
            socket.close()
        }

        //its here, I dont know what it does
        player.addEventListener("appchange", (event) => {
            if (event && event.data) {
                socket.send('something|' + JSON.stringify(event.data))
            }
        })

        let lastProgressUpdate = 0
        let lastProgress = 0

        player.addEventListener("onprogress", (event) => {
            if (event && event.data) {
                const currentTime = Date.now()
                const currentProgress = event.data

                // Check if progress has changed and at least 1 second has passed
                if (currentProgress !== lastProgress && currentTime - lastProgressUpdate >= 250) {
                    socket.send('progress|' + currentProgress)
                    lastProgressUpdate = currentTime
                    lastProgress = currentProgress
                }
            }
        })

        player.addEventListener("onplaypause", (event) => {
            if (event && event.data) {
                socket.send('playerState|' + JSON.stringify(event.data))
            }
        })

        player.addEventListener("songchange", (event) => {
            if (event && event.data) {

                socket.send('playerState|' + JSON.stringify(event.data))
            }
        })
    }

    function handleCommand(message: string, socket: WebSocket) {
        console.log(message)
        const [command, param] = message.split('|')
        switch (command) {
            case 'ping':
                socket.send('pong')
                break
            case 'pong':
                break
            case 'pause':
                player.pause()
                break
            case 'play':
                player.play()
                break
            case 'playUri':
                if (param) {
                    console.log(param)
                    player.playUri(param)
                }
                break
            case 'volume':
                if (param) {
                    const volume = parseInt(param, 10)
                    player.setVolume(volume)
                }
                break
            case 'repeat':
                if (param) {
                    const repeatMode = parseInt(param, 10)
                    Spicetify.Player.setRepeat(repeatMode)
                }
                break
            case 'mute':
                if (param) {
                    const mute = param === 'true'
                    Spicetify.Player.setMute(mute)
                }
                break
            case 'shuffle':
                if (param) {
                    const shuffle = param === 'true'
                    Spicetify.Player.setShuffle(shuffle)
                }
                break
            case 'getProgress':
                const progress = Spicetify.Player.getProgress()
                socket.send(`progress|${progress.toString()}`)
                break
            case 'getMarket':
                const market = Spicetify.Platform.user

            default:
                console.warn('Unknown command:', command)
        }
    }

    // Start the WebSocket connection
    connectWebSocket()
    console.log(Spicetify.Platform.user.get("market"))
    console.log(Spicetify.Platform.user.data)
    console.log("connected client")
    Spicetify.showNotification('WebSocket client started!')
}

export default main
