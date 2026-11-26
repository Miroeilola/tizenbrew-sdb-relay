// tizenbrew-sdb-relay – TizenBrew service module.
//
// Keeps the TV's developer-mode Host PC IP at 127.0.0.1 (which TizenBrew needs)
// while still letting one development machine use sdb: the relay listens on
// LISTEN_PORT and pipes allowed connections to the local sdbd, which then sees
// them coming from 127.0.0.1.
//
// Written in ES5 on purpose: older Tizen TVs run the service on Node.js 4.
'use strict';

var net = require('net');
var http = require('http');

// ---- configuration -------------------------------------------------------
var LISTEN_PORT = 26102;          // sdb connect <tv-ip>:26102
var STATUS_PORT = 26103;          // JSON status, bound to 127.0.0.1 only
var TARGET_HOST = '127.0.0.1';
var TARGET_PORT = 26101;          // sdbd
var ALLOWED = ['10.10.20.183'];   // only these source IPs may connect
// --------------------------------------------------------------------------

var state = {
    version: '0.1.0',
    started: new Date().toISOString(),
    listenPort: LISTEN_PORT,
    allowed: ALLOWED,
    listening: false,
    error: null,
    active: 0,
    accepted: 0,
    lastAccepted: null,
    rejected: []
};

function normalize(addr) {
    return String(addr || '').replace(/^::ffff:/, '');
}

function remember(list, entry, max) {
    list.unshift(entry);
    if (list.length > max) list.length = max;
}

var relay = net.createServer(function (client) {
    var addr = normalize(client.remoteAddress);

    if (ALLOWED.indexOf(addr) === -1) {
        remember(state.rejected, { addr: addr, at: new Date().toISOString() }, 10);
        client.destroy();
        return;
    }

    state.accepted++;
    state.active++;
    state.lastAccepted = { addr: addr, at: new Date().toISOString() };

    var upstream = net.connect(TARGET_PORT, TARGET_HOST);
    var closed = false;

    function done() {
        if (closed) return;
        closed = true;
        state.active--;
        client.destroy();
        upstream.destroy();
    }

    client.setNoDelay(true);
    upstream.setNoDelay(true);
    client.pipe(upstream);
    upstream.pipe(client);
    client.on('error', done);
    upstream.on('error', done);
    client.on('close', done);
    upstream.on('close', done);
});

relay.on('error', function (e) {
    state.listening = false;
    state.error = String(e);
});

relay.listen(LISTEN_PORT, '0.0.0.0', function () {
    state.listening = true;
    state.error = null;
});

var status = http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(state));
});

status.on('error', function (e) {
    state.statusError = String(e);
});

status.listen(STATUS_PORT, '127.0.0.1');
