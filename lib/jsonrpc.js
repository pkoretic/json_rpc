/*
 * Author: Petar Koretic <petar.koretic@gmail.com>
 *
 * The MIT License (MIT)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var util = require('util')
var events = require("events")
var net = require('net')

// TODO:
// json rpc batch
// console logging
// unix socket testing
// tests, examples, documentation

/*
    For TCP sockets, options argument should be an object which specifies:
        @port: Port the client should connect to. Defaults to 9090.
        @host: Host the client should connect to. Defaults to 'localhost'.
        @localAddress: Local interface to bind to for network connections.

    For UNIX domain sockets, options argument should be an object which specifies:
        @path: Path the client should connect to (Required).

    Common options:
        @allowHalfOpen: if true, the socket won't automatically send a FIN packet
        when the other end of the socket sends a FIN packet. Defaults to false. See
        'end' event for more information.

    Options correspond to:
    http://nodejs.org/api/net.html#net_net_connect_options_connectionlistener
*/

var jsonrpc_client = function(options, connect_callback)
{
    var opts = options || {}

    // TCP connection by default

    if (typeof opts.path == 'undefined')
    {
        if (typeof opts.host == 'undefined')
            opts.host = '127.0.0.1'

        if (typeof opts.port == 'undefined')
            opts.port = 5080

    }

    //
    // do we reconnect if connection broke
    // default: true
    if (typeof opts.reconnect == 'undefined')
        opts.reconnect = true


    //
    // maximum number of retries before giving up
    // default: 0 - unlimited
    if (typeof opts.reconnect_count == 'undefined')
        opts.reconnect_count = 0

    //
    // interval in miliseconds between reconnects
    // default: 1000
    if (typeof opts.reconnect_interval == 'undefined')
        opts.reconnect_interval = 1000

    var rpc_message_id = 1
    var reply_messages_queue = []
    var messages_buffer = ''

    var connection_ready = false
    var connection_valid = false
    var reconnect_count = 0

    var self = this

    this._client = net.connect(opts, function()
    {
        connection_ready = true
        connection_valid = true

        connect_callback(null)
    })

    set_events()

    function set_events()
    {
        self._client.setEncoding('utf8')
        self._client.on('data', function(data)
        {
            messages_buffer += data.trim()

            /*
             * we get chunks of message or whole message which we buffer:
             *
             * whole message:
             * <-- {"jsonrpc": "2.0", "result": -19, "id": 1}
             *
             * whole message and chunk of next one:
             * <-- {"jsonrpc": "2.0", "result": -19, "id": 2} { "jsonrpc"
             *
             * so we search for messages by matching for first '}' from start of buffer
             */

            for (var end_pos; (end_pos = messages_buffer.indexOf('}', end_pos + 1)) !== -1;)
            {
                var chunk = messages_buffer.substring(messages_buffer, end_pos + 1)

                try
                {
                    // throws if not valid json
                    var msg = JSON.parse(chunk)

                    // valid message, get and remove from buffer
                    messages_buffer = messages_buffer.substring(end_pos + 1).trim()
                    end_pos = 0

                    if (!msg.id)
                        return self.emit('error', 'message has no id')

                    if (typeof reply_messages_queue[msg.id] !== 'function')
                        return self.emit('error', 'invalid callback for message: ' + msg.id)

                    // valid callback for this reply
                    // call it and invalidate it in queue
                    reply_messages_queue[msg.id](msg)
                    delete reply_messages_queue[msg.id]
                }
                catch(e){}
            }
        })

        self._client.on('close', function(had_error)
        {
            connection_valid = false

            console.log("closing:" + opts.reconnect)
            if (opts.reconnect)
            {
                if (opts.reconnect_count && (reconnect_count++ > opts.reconnect_count))
                    return self.emit('close', "tcp reconnect tries exceded")

                function on_connected()
                {
                    self.emit('reconnect')
                    reconnect_count = 0
                    connection_valid = true
                }

                self._client = new net.Socket({fd:self._client.fd})

                if (typeof opts.path != 'undefined')
                {
                    console.log("connecting path")
                    return setTimeout(function()
                    {
                        set_events()
                        self._client.connect(opts.path, on_connected)
                    }, opts.reconnect_interval)
                }
                else
                {
                    console.log("connecting host/port")
                    return setTimeout(function()
                    {
                        set_events()
                        self._client.connect(opts.port, opts.host, on_connected)
                    }, opts.reconnect_interval)
                }
            }

            if (connection_ready)
                return self.emit('close', had_error)
        })

        self._client.on('error', function(error)
        {
            connection_valid = false
            console.log("error:" + error)

            if (!connection_ready)
                connect_callback(error)
            else
                self.emit('error', error)
        })
    }

    this.send = function(method, params, reply_callback, notification)
    {
        if (!connection_valid)
        {
            var error = {"code" : 32100, "message" : "connection is not valid"}
            reply_callback && reply_callback(error)
            self.emit('error', error)
            return
        }

        var rpc_message = { "jsonrpc": "2.0", "method": method }
        params && (rpc_message["params"] = params)

        if (reply_callback && !notification)
        {
            rpc_message["id"] = rpc_message_id
            reply_messages_queue[rpc_message_id++] = reply_callback
        }

        self._client.write(JSON.stringify(rpc_message))
    }

    this.close = function(close_callback)
    {
        self.opts.reconnect = false

        self._client.end(close_callback)
    }
}

util.inherits(jsonrpc_client, events.EventEmitter)

module.exports = function(opts, callback)
{
    if (!arguments.length)
        return

    if (typeof callback === 'undefined' && opts !== 'undefined')
        callback = opts

    if (typeof callback != 'function')
        return

    return new jsonrpc_client(opts, callback)
}
