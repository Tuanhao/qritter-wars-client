'use strict'

const io = require('socket.io-client')
const config = require('./config.js')
const request = require('request')

let playerId
const socketArguments = `apiId=${config.apiId}&apiSecret=${config.apiSecret}`
const socket = io.connect(`http://${config.host}:${config.socketPort}`, { query: socketArguments })

let createOptions = (endpoint, method, body) => {
  // we need to return all options that the request module expects
  // for an http request. 'uri' is the location of the request, 'method'
  // is what http method we want to use (most likely GET or POST). headers
  // are the http headers we want attached to our request
  let options = {
    uri: `http://${config.host}:${config.apiPort}/${endpoint}`,
    method: method.toUpperCase(),
    headers: {
      "Authorization": `Basic ${apiKey}`,
      "Content-Type": "application/json"
    }
  }

  if (body != null) {
    // if a body has been specified we want to add it to the http request
    options.body = JSON.stringify(body)
  }

  return options
}

let getGame = (gameId) => {
    return new Promise((resolve, reject) => {
        // we want to perform a GET request to the games/:id API
        // to retrieve information about the given game
        let options = createOptions(`games/${gameId}`, "GET")

        request.get(options, (error, res, body) => {
          if (error || res.statusCode !== 200) {
            console.error("Error Getting Game", error || res.body)
            reject(error)
          } else {
            resolve(JSON.parse(body))
          }
        })
    })
}

let preformMove = () => {
    let body = {
        action: 'attack'
    }
      let options = createOptions("moves", "POST", body)
      request.post(options, (error, res, body) => {
        if (error || res.statusCode !== 200) {
          console.log("Error Performing Move", error || res.body)
        } else {
          console.log(`attack performed successfully`)
        }
      })
}

socket.on('connect', (data) => {
    console.log('connnected')
})

socket.on('invalid', (error) => {
    console.log('error', error)
})

socket.on('success', (data) => {
    playerId = data.id
    console.log(playerId)
})

socket.on('start game', (game) => {
    getGame(game.id)
        .then((gameData) => {
            if(gameData.current === playerId) {
                console.log('Our turn')
            }
        })
        .catch((error) => {
            console.log('Start game error', error)
        })   
})

socket.on('move played', (move) => {
    if (move.player != playerId) {
        console.log(`opponent performed ${move.result}`)
        performMove()
    }
})

socket.on('game over', (gameData) => {
    if (gameData.game.winner === playerId) {
        console.log('WE WON');
    } else {
        console.log('WE LOST');
    }
})

