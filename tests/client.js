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

// create second client
var client2 = jsonrpc({ port: 7070, host: '127.0.0.1'}, function(error)
{
    if (error)
        return console.log(error)

    client2.send('method', {"param1" : 6, "param2" : 5}, function(reply)
    {
        console.log(reply)
    })

})
