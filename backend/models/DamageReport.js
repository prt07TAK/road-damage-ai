const mongoose = require('mongoose');

const DamageReportSchema = new mongoose.Schema({
  imageURL: {
    type: String,
    required: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  damageType: {
    type: String,
    enum: ['crack', 'pothole', 'rutting', 'patch', 'debris', 'undamaged', 'intact'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', 'normal'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  status: {
    type: String,
    enum: ['reported', 'assigned', 'in-progress', 'resolved'],
    default: 'reported'
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DroneSession'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: String,
  repairNotes: String,
  repairDate: Date
}, { timestamps: true });

DamageReportSchema.index({ 'location.lat': 1, 'location.lng': 1 });
DamageReportSchema.index({ damageType: 1, severity: 1 });
DamageReportSchema.index({ timestamp: -1 });

module.exports = mongoose.model('DamageReport', DamageReportSchema);
