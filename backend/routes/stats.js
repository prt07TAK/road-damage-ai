const express = require('express');
const DamageReport = require('../models/DamageReport');
const DroneSession = require('../models/DroneSession');

const router = express.Router();

// GET - Summary statistics
router.get('/summary', async (req, res) => {
  try {
    const totalReports = await DamageReport.countDocuments();
    const totalSessions = await DroneSession.countDocuments();
    
    const reports = await DamageReport.find();
    const damageTypeBreakdown = reports.reduce((acc, report) => {
      const type = report.damageType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const severityBreakdown = {
      high: reports.filter(r => r.severity === 'high').length,
      medium: reports.filter(r => r.severity === 'medium').length,
      low: reports.filter(r => r.severity === 'low').length
    };

    const statusBreakdown = {
      reported: reports.filter(r => r.status === 'reported').length,
      assigned: reports.filter(r => r.status === 'assigned').length,
      inProgress: reports.filter(r => r.status === 'in-progress').length,
      resolved: reports.filter(r => r.status === 'resolved').length
    };

    res.json({
      totalReports,
      totalSessions,
      damageTypeBreakdown,
      severityBreakdown,
      statusBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Trend data (last 30 days)
router.get('/trends', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const reports = await DamageReport.find({
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: 1 });

    // Group by date
    const trends = {};
    reports.forEach(report => {
      const date = report.timestamp.toISOString().split('T')[0];
      if (!trends[date]) {
        trends[date] = { date, count: 0, high: 0, medium: 0, low: 0 };
      }
      trends[date].count += 1;
      trends[date][report.severity] += 1;
    });

    const trendArray = Object.values(trends);
    res.json(trendArray);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
