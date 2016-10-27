'use strict'

const io = require('socket.io-client')
const config = require('./config.js')
const request = require('request')

let playerId
let myHealth;
let yourHealth;
const socketArguments = `apiId=${config.apiId}&apiSecret=${config.apiSecret}`
const socket = io.connect(`http://${config.host}:${config.socketPort}`, { query: socketArguments })

let createOptions = (endpoint, method, body) => {
  let options = {
    uri: `http://${config.host}:${config.apiPort}/${endpoint}`,
    method: method.toUpperCase(),
    headers: {
      "Authorization": `Basic ${apiKey}`,
      "Content-Type": "application/json"
    }
  }
  if (body != null) {
    options.body = JSON.stringify(body)
  }
  return options
}

let getHealth = (gameId) => {
    return new Promise((resolve, reject) => {
        let gameObject;
        getGame(gameId)
            .then((game) => {
                gameObject = game;
                let options = createOptions(`players/${game.player1}`, 'GET')
                request.get(options, (error, res, body) => {
                    if (error || res.statusCode !== 200) {
                        console.error('Error getting player', error || res.body)
                        reject(error)
                    } else {
                        if (game.player1 === playerId) {
                            myHealth = res.health
                        } else {
                            yourHealth = res.health
                        }
                    }
                })
                options = createOptions(`players/${game.player2}`, 'GET')
                request.get(options, (error, res, body) => {
                    if (error || res.statusCode !== 200) {
                        console.error('Error getting player', error || res.body)
                        reject(error)
                    } else {
                        if (game.player1 === playerId) {
                            myHealth = res.health
                        } else {
                            yourHealth = res.health
                        }
                    }
                })
            })
            .catch((error) => {
                console.log('Cant get game');
            })
    })
}

let getGame = (gameId) => {
    return new Promise((resolve, reject) => {
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

let performMove = (gameId) => {
    let body = { action: 'attack' };
    getHealth(gameId)
        .then((game) => {
            console.log(game);
            console.log('myHealth', myHealth)
            console.log('yourHealth', yourHealth)

          let options = createOptions("moves", "POST", body)
          request.post(options, (error, res, body) => {
            if (error || res.statusCode !== 200) {
              console.log("Error Performing Move", error || res.body)
            } else {
              console.log(`attack performed successfully`)
            }
          })
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
    console.log('Game started:')
    let gameId = game.id
    getGame(game.id)
        .then((gameData) => {
            if(gameData.current === playerId) {
                console.log('Our turn')
                preformMove(gameId)
            } else {
                console.log('Their turn')
            }
        })
        .catch((error) => {
            console.log('Start game error', error)
        })   
})

socket.on('move played', (move) => {
    if (move.player != playerId) {
        console.log(`opponent performed ${move.result}`)
        performMove(move.game)
    }
})

socket.on('game over', (gameData) => {
    if (gameData.game.winner === playerId) {
        console.log('WE WON');
    } else {
        console.log('WE LOST');
    }
})

