require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const DamageReport = require('./models/DamageReport');
const DroneSession = require('./models/DroneSession');
const connectDB = require('./config/db');

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await DamageReport.deleteMany({});
    await DroneSession.deleteMany({});
    console.log('Existing data cleared.\n');

    // Create users
    console.log('Creating users...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@drone.local',
      password: 'admin123',
      role: 'admin',
      authProvider: 'local',
      department: 'Operations',
      phone: '+91-9876543210'
    });

    const engineerUser = await User.create({
      name: 'Engineer User',
      email: 'engineer@drone.local',
      password: 'engineer123',
      role: 'engineer',
      authProvider: 'local',
      department: 'Field Engineering',
      phone: '+91-9876543211'
    });

    const operatorUser = await User.create({
      name: 'Drone Operator',
      email: 'operator@drone.local',
      password: 'operator123',
      role: 'operator',
      authProvider: 'local',
      department: 'Drone Operations',
      phone: '+91-9876543212'
    });

    console.log('  ✓ Admin:    admin@drone.local / admin123');
    console.log('  ✓ Engineer: engineer@drone.local / engineer123');
    console.log('  ✓ Operator: operator@drone.local / operator123\n');

    // Create drone sessions
    console.log('Creating drone sessions...');
    const session1 = await DroneSession.create({
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
      status: 'completed',
      totalDistance: 12.5,
      totalDamages: 5,
      area: 'NH-44 Highway Section A',
      operator: operatorUser._id,
      droneId: 'DRN-001',
      latitude: 28.6139,
      longitude: 77.2090,
      altitude: 50,
      battery: 45,
      speed: 15,
      connectionStatus: 'disconnected',
      damageSummary: { cracks: 2, potholes: 2, undamaged: 1 },
      severitySummary: { high: 2, medium: 2, low: 1 }
    });

    const session2 = await DroneSession.create({
      startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5400000),
      status: 'completed',
      totalDistance: 8.3,
      totalDamages: 3,
      area: 'MG Road Section B',
      operator: operatorUser._id,
      droneId: 'DRN-002',
      latitude: 28.6328,
      longitude: 77.2197,
      altitude: 45,
      battery: 62,
      speed: 12,
      connectionStatus: 'disconnected',
      damageSummary: { cracks: 1, potholes: 1, undamaged: 1 },
      severitySummary: { high: 1, medium: 1, low: 1 }
    });

    const session3 = await DroneSession.create({
      startTime: new Date(),
      status: 'active',
      totalDistance: 3.2,
      totalDamages: 1,
      area: 'Ring Road Section C',
      operator: operatorUser._id,
      droneId: 'DRN-001',
      latitude: 28.5535,
      longitude: 77.2588,
      altitude: 55,
      battery: 88,
      speed: 18,
      connectionStatus: 'connected',
      damageSummary: { cracks: 0, potholes: 1, undamaged: 0 },
      severitySummary: { high: 1, medium: 0, low: 0 }
    });

    console.log('  ✓ Session 1: NH-44 Highway Section A (completed)');
    console.log('  ✓ Session 2: MG Road Section B (completed)');
    console.log('  ✓ Session 3: Ring Road Section C (active)\n');

    // Create damage reports
    console.log('Creating damage reports...');
    const reports = [
      {
        imageURL: '/uploads/sample-pothole-1.jpg',
        location: { lat: 28.6139, lng: 77.2090 },
        damageType: 'pothole',
        severity: 'high',
        confidence: 0.94,
        status: 'reported',
        session: session1._id,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Large pothole detected on NH-44 near KM marker 156'
      },
      {
        imageURL: '/uploads/sample-crack-1.jpg',
        location: { lat: 28.6180, lng: 77.2120 },
        damageType: 'crack',
        severity: 'medium',
        confidence: 0.87,
        status: 'assigned',
        session: session1._id,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 900000),
        notes: 'Longitudinal crack spanning 3 meters'
      },
      {
        imageURL: '/uploads/sample-pothole-2.jpg',
        location: { lat: 28.6200, lng: 77.2150 },
        damageType: 'pothole',
        severity: 'high',
        confidence: 0.91,
        status: 'in-progress',
        session: session1._id,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1800000),
        notes: 'Cluster of potholes near intersection'
      },
      {
        imageURL: '/uploads/sample-crack-2.jpg',
        location: { lat: 28.6220, lng: 77.2180 },
        damageType: 'crack',
        severity: 'medium',
        confidence: 0.82,
        status: 'resolved',
        session: session1._id,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2700000),
        notes: 'Alligator cracking on road surface',
        repairNotes: 'Patched and sealed',
        repairDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        imageURL: '/uploads/sample-undamaged.jpg',
        location: { lat: 28.6240, lng: 77.2200 },
        damageType: 'undamaged',
        severity: 'low',
        confidence: 0.96,
        status: 'reported',
        session: session1._id,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3200000),
        notes: 'Road section in good condition'
      },
      {
        imageURL: '/uploads/sample-pothole-3.jpg',
        location: { lat: 28.6328, lng: 77.2197 },
        damageType: 'pothole',
        severity: 'high',
        confidence: 0.89,
        status: 'reported',
        session: session2._id,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        notes: 'Deep pothole causing traffic disruption on MG Road'
      },
      {
        imageURL: '/uploads/sample-crack-3.jpg',
        location: { lat: 28.6350, lng: 77.2220 },
        damageType: 'crack',
        severity: 'low',
        confidence: 0.75,
        status: 'reported',
        session: session2._id,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1200000),
        notes: 'Minor surface crack'
      },
      {
        imageURL: '/uploads/sample-undamaged-2.jpg',
        location: { lat: 28.6370, lng: 77.2240 },
        damageType: 'undamaged',
        severity: 'low',
        confidence: 0.98,
        status: 'reported',
        session: session2._id,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2400000),
        notes: 'Recently repaved section'
      },
      {
        imageURL: '/uploads/sample-pothole-4.jpg',
        location: { lat: 28.5535, lng: 77.2588 },
        damageType: 'pothole',
        severity: 'high',
        confidence: 0.92,
        status: 'reported',
        session: session3._id,
        timestamp: new Date(),
        notes: 'Active detection - pothole on Ring Road'
      }
    ];

    await DamageReport.insertMany(reports);
    console.log(`  ✓ Created ${reports.length} damage reports`);
    console.log('    - 4 potholes (3 high, 1 high)');
    console.log('    - 3 cracks (1 medium, 1 medium, 1 low)');
    console.log('    - 2 undamaged sections\n');

    // Update sessions with report references
    const session1Reports = await DamageReport.find({ session: session1._id });
    session1.reports = session1Reports.map(r => r._id);
    await session1.save();

    const session2Reports = await DamageReport.find({ session: session2._id });
    session2.reports = session2Reports.map(r => r._id);
    await session2.save();

    const session3Reports = await DamageReport.find({ session: session3._id });
    session3.reports = session3Reports.map(r => r._id);
    await session3.save();

    console.log('='.repeat(50));
    console.log('Database seeded successfully!');
    console.log('='.repeat(50));
    console.log('\nLogin credentials:');
    console.log('  Admin:    admin@drone.local / admin123');
    console.log('  Engineer: engineer@drone.local / engineer123');
    console.log('  Operator: operator@drone.local / operator123');
    console.log('\nYou can now start the backend with: npm run dev');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
