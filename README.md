json-rpc client
===============

[![GitHub license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/pkoretic/json-rpc-client/blob/master/LICENSE)  
[![NPM](https://nodei.co/npm/json-rpc-client.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/json-rpc-client/)

JSON-RPC 2.0 TCP implementation with persistent connections using promises - very fast and without dependencies

## Installation

    npm install json-rpc-client

## Example usage
### Native promise

    var jsonrpc = require('json-rpc-client')

    // create client and connect
    var client = new jsonrpc({ port: 7070, host: '127.0.0.1'})
    client.connect().then(function()
    {
        // send json rpc
        client.send('add', [1,2]).then(function(reply)
        {
            // print complete reply
            console.log(reply)
        },
        //transport errors
        function(error)
        {
            console.error(error)
        })
    },
    function(error)
    {
        console.error(error)
    })

### Generators (using co)

    var jsonrpc = require('json-rpc-client')

    // create client and connect
    var client = new jsonrpc({ port: 7070, host: '127.0.0.1'})

    try
    {
        yield client.connect()

        // send json rpc
        var reply = yield client.send('add', [1,2])

        // print complete reply
        console.log(reply)
    }
    catch(error)
    {
        console.error(error)
    }

## API

    var jsonrpc = require('./jsonrpc')

### jsonrpc (options)

Creates a new RPC connection object.

Options:

* host: Host the client should connect to. Defaults to '127.0.0.1'.
* port: Port the client should connect to. Defaults to '7070'.

### connect
Returns promise which resolves after the connection to the specified host is ready

### send (methodName, parameters, notification)

Sends json data through persisted tcp connection.

methodName: string

parameters: Object/Array with parameters

notification: true/false to make notification request (no reply)

* Promise - object containing reply data along with error

### close

Closes RPC connection and returns promise afterwards.

### Event 'error'
* 'Error Object'

Emitted when an error occurs.

### Event: 'close'
* 'had_error' 'Boolean' true if the socket had a transmission error

Emitted once the RPC connection socket is fully closed. The argument
'had_error' is a boolean which says if there was an error.
