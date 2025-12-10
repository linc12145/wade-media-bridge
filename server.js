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

  // NEW: open a WebSocket out to Wade (Vapi) for this call
  const vapiUrl = process.env.VAPI_WADE_WS_URL;
  const vapiApiKey = process.env.VAPI_API_KEY;

  if (!vapiUrl || !vapiApiKey) {
    console.error('VAPI_WADE_WS_URL or VAPI_API_KEY not set in env!');
  } else {
    try {
      const vapiWs = new WebSocket(vapiUrl, {
        headers: {
          // Adjust header shape later if Vapi expects something different
          Authorization: `Bearer ${vapiApiKey}`
        }
      });

      // Store on ws so we can reference it later if needed
      ws.vapiWs = vapiWs;

      vapiWs.on('open', () => {
        console.log('Vapi WS connected for this call');
      });

      vapiWs.on('message', (msg) => {
        // For now just log that Vapi sent something
        console.log('Vapi WS message (length):', msg.length);
        // Later we’ll pipe this back to Twilio as audio
      });

      vapiWs.on('close', (code, reason) => {
        console.log('Vapi WS closed:', code, String(reason || ''));
      });

      vapiWs.on('error', (err) => {
        console.error('Vapi WS error:', err);
      });
    } catch (err) {
      console.error('Error creating Vapi WS:', err);
    }
  }

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.event === 'start') {
        console.log('--- Twilio stream STARTED ---');
        console.log('streamSid:', data.start.streamSid);
        console.log('callSid:', data.start.callSid);

        if (data.start.customParameters) {
          console.log('customParameters:', data.start.customParameters);
        } else {
          console.log('No customParameters present');
        }

      } else if (data.event === 'media') {
        // Optional: throttle if too noisy
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

    // If we have a Vapi WS for this call, close it too
    if (ws.vapiWs && ws.vapiWs.readyState === WebSocket.OPEN) {
      ws.vapiWs.close(1000, 'Twilio stream closed');
    }
  });

  ws.on('error', (err) => {
    console.error('Twilio WS error:', err);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Wade media bridge listening on port ${PORT}`);
});
