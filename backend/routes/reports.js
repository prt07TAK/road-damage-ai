const express = require('express');
const multer = require('multer');
const DamageReport = require('../models/DamageReport');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// POST - Create new damage report
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    let { location, damageType, severity, session, notes, confidence } = req.body;
    
    if (!location) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
    const imageURL = req.file ? `/uploads/${req.file.filename}` : '';

    // Trigger AI detection if an image is uploaded and no detection results are provided
    if (req.file && (!damageType || damageType === 'Analyzing...')) {
      try {
        const fs = require('fs');
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        const aiResponse = await axios.post(
          `${process.env.AI_MODEL_URL}/detect`,
          formData,
          { headers: formData.getHeaders() }
        );

        if (aiResponse.data.detected) {
          damageType = aiResponse.data.damageType;
          severity = aiResponse.data.severity;
          confidence = aiResponse.data.confidence;
        } else {
          damageType = 'undamaged';
          severity = 'low';
          confidence = aiResponse.data.confidence || 1.0;
        }
      } catch (aiError) {
        console.error('AI detection failed:', aiError.message);
        // Fallback to safe defaults if AI fails
        damageType = 'undamaged';
        severity = 'low';
        confidence = 0.0;
      }
    }

    // Double check that we don't have "Analyzing..." in the final report
    const finalDamageType = (damageType && damageType !== 'Analyzing...') ? damageType : 'undamaged';
    const finalSeverity = (severity && severity !== 'Analyzing...') ? severity : 'low';

    const report = new DamageReport({
      imageURL,
      location: parsedLocation,
      damageType: finalDamageType,
      severity: finalSeverity,
      confidence: confidence || 1.0,
      session: session || null,
      notes
    });

    await report.save();

    // Emit to connected clients
    if (req.app.io) {
      req.app.io.emit('new-damage-detected', {
        id: report._id,
        damageType: report.damageType,
        severity: report.severity,
        location: report.location,
        timestamp: report.timestamp,
        confidence: report.confidence
      });
    }

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - All reports with filters
router.get('/', async (req, res) => {
  try {
    const { damageType, severity, startDate, endDate, status, limit, skip } = req.query;
    let filter = {};

    if (damageType) filter.damageType = damageType;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const limitVal = parseInt(limit) || 50;
    const skipVal = parseInt(skip) || 0;

    const reports = await DamageReport.find(filter)
      .populate('session')
      .sort({ timestamp: -1 })
      .limit(limitVal)
      .skip(skipVal);
    
    const total = await DamageReport.countDocuments(filter);
    
    res.json({ reports, total, limit: limitVal, skip: skipVal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Single report
router.get('/:id', async (req, res) => {
  try {
    const report = await DamageReport.findById(req.params.id).populate('session');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT - Update report status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, repairNotes, repairDate } = req.body;
    
    const report = await DamageReport.findByIdAndUpdate(
      req.params.id,
      { status, repairNotes, repairDate },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE - Remove report
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const report = await DamageReport.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
