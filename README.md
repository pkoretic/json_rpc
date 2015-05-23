json-rpc client
===============

[![GitHub license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/pkoretic/json-rpc-client/blob/master/LICENSE)  
[![NPM](https://nodei.co/npm/json-rpc-client.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/json-rpc-client/)

JSON-RPC 2.0 TCP implementation with persistent connections - very fast and without dependencies

## Installation

    npm install json-rpc-client

## Example usage
    var jsonrpc = require('./jsonrpc')

    // create client and connect
    var client = jsonrpc({ port: 7070, host: '127.0.0.1'}, function(error)
    {
        // check if connection failed
        if (error)
            return console.log(error)

        client.send('method', {"param1" : 4, "param2" : 2}, function(reply)
        {
            // print complete reply
            console.log(reply)
        })

        setTimeout(function()
        {
            console.log("sending")
            client.send('method', {"param1" : 1, "param2" : 4}, function(reply)
            {
                // explicitly check for error in reply
                if (!reply.error)
                    console.log(reply.result)
            })
        }, 6000)

        // skip callback to make notification
        client.send('method', {"param1" : 2, "param2" : 5})
        client.send('method', {"param1" : 4, "param2" : 8})

        // non-existing method
        client.send('error', {"param1" : 4, "param2" : 2}, function(reply)
        {
            // reply.error
            console.log(reply)
        })
    })

    // catch generic errors
    client.on('error', function(error)
    {
        console.log(error)
    })

    client.on('close', function()
    {
        console.log('close called')
    })

## API

    var jsonrpc = require('./jsonrpc')

### jsonrpc (options, callback)

Creates a new RPC connection to the server.

Options:

* host: Host the client should connect to. Defaults to '127.0.0.1'.
* port: Port the client should connect to. Defaults to '7070'.

Callback: Invoked after the connection to the specified host is ready

### send (methodName, parameters, callback)

Sends json data through persisted tcp connection.

methodName: string

parameters: Object with parameters

Callback:

* reply - object containing reply data along with error

### close (callback)

Closes RPC connection and returns callback afterwards.

### Event 'error'
* 'Error Object'

Emitted when an error occurs.

### Event: 'close'
* 'had_error' 'Boolean' true if the socket had a transmission error

Emitted once the RPC connection socket is fully closed. The argument
'had_error' is a boolean which says if there was an error.
