'use strict'

var jsonrpc = require('../')
var co = require('co')

// create client and connect
var client = new jsonrpc({ port: 7070, host: '127.0.0.1'})

co(function*()
{
    try
    {
        yield client.connect()

        console.log("sending 'add'")
        let reply = yield client.send('add', [1,2])

        // print complete reply
        console.log("'add' reply:", reply)

        // add 'true' as last argument to make notification, also returns promise
        yield client.send('hello', { date: +new Date() }, true)

        // send and receive 3 concurrently
        let results = yield Promise.all(
        [
            client.send('add', [1,2]),
            client.send('add', [2,3]),
            client.send('add', [3,4]),
        ])

        // replies array
        console.log("concurrent reply for 1: ",results[0])
        console.log("concurrent reply for 2: ",results[1])
        console.log("concurrent reply for 3: ",results[2])

        // send and received 3 serially
        for(var i = 0; i < 3; i++)
            console.log("serial reply for %d:", i + 1, yield client.send('add', [i, i+1]))

    }
    catch(error)
    {
        console.log("errors:", error)
    }

    // catch generic errors for client
    client.on('error', function(error)
    {
        console.log(error)
    })

    // catch close event
    client.on('close', function()
    {
        console.log('close called')
    })

})
