var jsonrpc = require('../')

// create client and connect
var client = new jsonrpc({ port: 7070, host: '127.0.0.1'})

client.connect().then(function()
{
    console.log("sending 'add'")
    client.send('add', [1,2]).then(function(reply)
    {
        // print complete reply
        console.log("'add' reply:", reply)
    },
    // transport errors
    function(error)
    {
        console.log("'add' error:", error)
    })

    // simulate later action
    setTimeout(function()
    {
        console.log("sending 'params'")
        client.send('params', {"param1" : 1, "param2" : 4}).then(function(reply)
        {
            // explicitly check for server errors in reply
            if (!reply.error)
                console.log("'params' reply result:", reply.result)
        },
        function(error)
        {
            console.log("'params' error:", error)
        })
    }, 6000)

    // add 'true' as last argument to make notification, also returns promise
    client.send('hello', { date: +new Date() }, true)

    // non-existing method
    client.send('error', {"param1" : 4, "param2" : 2}).then(function(reply)
    {
        // reply.error will contain error message
        console.log(reply)
    },
    function(error)
    {
        console.log("'error' error:", error)
    })
},
// connect error
function(error)
{
    console.error(error)
})

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

// create second client
//var client2 = new jsonrpc({ port: 7070, host: '127.0.0.1'})
//client2.connect().then(function()
//{
//    client2.send('add', [3,5]).then(function(reply)
//    {
//        console.log("second client reply:", reply)
//    },
//    function(error)
//    {
//        console.error("second client send error", error)
//    })
//},
//function(error)
//{
//    console.log("second client connection failed:", error)
//})
