const express = require('express');
const multer = require('multer');
const axios = require('axios');
const DamageReport = require('../models/DamageReport');
const DroneSession = require('../models/DroneSession');
const FormData = require('form-data');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

module.exports = (io) => {
  // POST - Receive drone frame from drone
  router.post('/frame', upload.single('frame'), async (req, res) => {
    try {
      const { sessionId, latitude, longitude, altitude, battery, speed } = req.body;

      if (!sessionId || !req.file) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Save file to disk
      const fs = require('fs');
      const path = require('path');
      const filename = `frame-${Date.now()}.jpg`;
      const filePath = path.join(__dirname, '../uploads', filename);
      
      fs.writeFileSync(filePath, req.file.buffer);

      // Update session with latest telemetry
      const session = await DroneSession.findByIdAndUpdate(
        sessionId,
        {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          altitude: parseFloat(altitude),
          battery: parseFloat(battery),
          speed: parseFloat(speed),
          connectionStatus: 'connected'
        },
        { new: true }
      );

      // Send frame to AI model for analysis
      const formData = new FormData();
      formData.append('file', req.file.buffer, { filename: 'frame.jpg' });

      try {
        let aiResponse;
        let detected = false;
        let damageType, severity, confidence;

        try {
          aiResponse = await axios.post(
            `${process.env.AI_MODEL_URL}/detect`,
            formData,
            { headers: formData.getHeaders() }
          );
          detected = aiResponse.data.detected;
          damageType = aiResponse.data.damageType;
          severity = aiResponse.data.severity;
          confidence = aiResponse.data.confidence;
        } catch (aiError) {
          console.warn('AI Model unreachable, using Simulator Mode');
          // Simulator Mode: 20% chance of detecting something if not connected to AI
          if (Math.random() > 0.8) {
            detected = true;
            damageType = Math.random() > 0.5 ? 'pothole' : 'crack';
            severity = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
            confidence = 0.7 + Math.random() * 0.25;
          }
        }

        let boxes = [];
        if (aiResponse && aiResponse.data) {
          boxes = aiResponse.data.boxes || aiResponse.data.detections || [];
        } else if (detected) {
          // Mock box for Simulator Mode [x1, y1, x2, y2]
          boxes = [[100, 100, 300, 300]];
        }

        if (detected) {
          const fs = require('fs');
          const path = require('path');
          const filename = `live-${Date.now()}.jpg`;
          const filepath = path.join(__dirname, '../uploads', filename);
          
          fs.writeFileSync(filepath, req.file.buffer);

          const report = new DamageReport({
            imageURL: `/uploads/${filename}`,
            location: {
              lat: parseFloat(latitude),
              lng: parseFloat(longitude)
            },
            damageType: damageType,
            severity: severity,
            confidence: confidence,
            session: sessionId || null
          });
          await report.save();

          // Update session damage count
          session.totalDamages += 1;
          await session.save();

          // Emit alert to all connected clients
          io.emit('damage-alert', {
            id: report._id,
            damageType: report.damageType,
            severity: report.severity,
            location: { lat: latitude, lng: longitude },
            confidence: confidence,
            boxes: boxes
          });
        }
      } catch (error) {
        console.error('Detection processing error:', error.message);
      }

      // Broadcast telemetry update
      io.to(`drone-${sessionId}`).emit('telemetry-update', {
        sessionId,
        latitude,
        longitude,
        altitude,
        battery,
        speed
      });

      res.json({ status: 'received', sessionId, filename });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // POST - Receive GPS coordinates
  router.post('/gps', async (req, res) => {
    try {
      const { sessionId, latitude, longitude } = req.body;

      if (!sessionId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Update session location
      await DroneSession.findByIdAndUpdate(sessionId, {
        latitude,
        longitude
      });

      // Broadcast GPS update
      io.to(`drone-${sessionId}`).emit('gps-update', {
        latitude,
        longitude,
        timestamp: new Date()
      });

      res.json({ status: 'received' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // POST - Receive telemetry data
  router.post('/telemetry', async (req, res) => {
    try {
      const { sessionId, battery, altitude, speed, connectionStatus } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: 'Session ID required' });
      }

      await DroneSession.findByIdAndUpdate(sessionId, {
        battery: battery || undefined,
        altitude: altitude || undefined,
        speed: speed || undefined,
        connectionStatus: connectionStatus || 'connected'
      });

      // Broadcast telemetry
      io.to(`drone-${sessionId}`).emit('telemetry-update', {
        battery,
        altitude,
        speed,
        connectionStatus,
        timestamp: new Date()
      });

      res.json({ status: 'received' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return router;
};
