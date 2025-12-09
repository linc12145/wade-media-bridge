// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();

// Simple health check route
app.get('/', (req, res) => {
  res.send('Wade media bridge is up');
});

const server = http.createServer(app);

// WebSocket server for Twilio Media Streams
const wss = new WebSocket.Server({ server, path: '/twilio' });

wss.on('connection', (ws, req) => {
  console.log('Twilio Media Stream connected');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event === 'start') {
        console.log('Stream started:', msg.start);
     } else if (msg.event === 'media') {
       console.log(
	'media frame seq:',
	msg.sequenceNumber, 
	'chunk:',
	msg.media && msg.media.chunk
	);
    } else if (msg.event === 'stop'){
	console.log('stream stopped:', msg.stop);
    } else {
	console.log('Other event:', msg.event);
    } catch (err) {
      console.error('Error parsing Twilio WS message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Twilio Media Stream disconnected');
  });

  ws.on('error', (err) => {
    console.error('Twilio WS error:', err);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Wade media bridge listening on port ${PORT}`);
});
