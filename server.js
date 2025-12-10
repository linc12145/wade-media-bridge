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

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.event === 'start') {
        console.log('--- Twilio stream STARTED ---');
        console.log('streamSid:', data.start.streamSid);
        console.log('callSid:', data.start.callSid);

        // Custom parameters from Twilio Function
        if (data.start.customParameters) {
          console.log('customParameters:', data.start.customParameters);
        } else {
          console.log('No customParameters present');
        }

      } else if (data.event === 'media') {
        // Optional: throttle or comment this out if too noisy
        // console.log('media frame', data.media.sequenceNumber);
      } else if (data.event === 'stop') {
        console.log('--- Twilio stream STOPPED ---');
        console.log('reason:', data.stop && data.stop.reason);
      }
    } catch (err) {
      console.error('Error parsing Twilio message:', err);
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
