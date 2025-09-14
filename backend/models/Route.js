const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  stopId: {
    type: String,
    required: [true, 'Stop ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Stop name is required'],
    trim: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: [true, 'Stop latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: [true, 'Stop longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  order: {
    type: Number,
    required: [true, 'Stop order is required'],
    min: [1, 'Stop order must be at least 1']
  },
  estimatedTime: {
    type: Number, // Minutes from route start
    required: [true, 'Estimated time is required'],
    min: [0, 'Estimated time cannot be negative']
  },
  facilities: [{
    type: String,
    enum: ['Shelter', 'Seating', 'Digital Display', 'Wheelchair Access', 'Restroom', 'Parking']
  }]
}, { _id: false });

const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true,
    unique: true
  },
  routeNumber: {
    type: String,
    required: [true, 'Route number is required'],
    trim: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  stops: [stopSchema],
  totalDistance: {
    type: Number,
    required: [true, 'Total distance is required'],
    min: [0, 'Total distance cannot be negative']
  },
  estimatedDuration: {
    type: Number, // Total time in minutes
    required: [true, 'Estimated duration is required'],
    min: [1, 'Estimated duration must be at least 1 minute']
  },
  operatingHours: {
    start: {
      type: String,
      required: [true, 'Operating start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    end: {
      type: String,
      required: [true, 'Operating end time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    }
  },
  frequency: {
    type: Number, // Minutes between buses
    required: [true, 'Frequency is required'],
    min: [1, 'Frequency must be at least 1 minute']
  },
  fare: {
    adult: {
      type: Number,
      required: [true, 'Adult fare is required'],
      min: [0, 'Fare cannot be negative']
    },
    student: {
      type: Number,
      default: function() { return this.fare.adult * 0.5; }
    },
    senior: {
      type: Number,
      default: function() { return this.fare.adult * 0.5; }
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance', 'Seasonal'],
    default: 'Active'
  },
  routeType: {
    type: String,
    enum: ['City', 'Express', 'Intercity', 'Shuttle'],
    default: 'City'
  },
  color: {
    type: String,
    default: '#007bff', // Hex color for map display
    match: [/^#[0-9A-F]{6}$/i, 'Invalid hex color format']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total stops count
routeSchema.virtual('totalStops').get(function() {
  return this.stops ? this.stops.length : 0;
});

// Virtual for average speed
routeSchema.virtual('averageSpeed').get(function() {
  return Math.round((this.totalDistance / (this.estimatedDuration / 60)) * 100) / 100; // km/h
});

// Index for geospatial queries on stops
routeSchema.index({ 'stops.coordinates.latitude': 1, 'stops.coordinates.longitude': 1 });
routeSchema.index({ routeNumber: 1 });
routeSchema.index({ status: 1 });

// Pre-save middleware to sort stops by order
routeSchema.pre('save', function(next) {
  if (this.isModified('stops')) {
    this.stops.sort((a, b) => a.order - b.order);
  }
  next();
});

// Static method to find routes by area
routeSchema.statics.findByArea = function(latitude, longitude, radius = 5000) {
  return this.find({
    'stops.coordinates.latitude': {
      $gte: latitude - (radius / 111000),
      $lte: latitude + (radius / 111000)
    },
    'stops.coordinates.longitude': {
      $gte: longitude - (radius / (111000 * Math.cos(latitude * Math.PI / 180))),
      $lte: longitude + (radius / (111000 * Math.cos(latitude * Math.PI / 180)))
    },
    status: 'Active'
  });
};

// Instance method to get next stop
routeSchema.methods.getNextStop = function(currentStopOrder) {
  const nextStop = this.stops.find(stop => stop.order > currentStopOrder);
  return nextStop || this.stops[0]; // Return first stop if at end (circular route)
};

// Instance method to calculate distance between two stops
routeSchema.methods.getDistanceBetweenStops = function(stopId1, stopId2) {
  const stop1 = this.stops.find(stop => stop.stopId === stopId1);
  const stop2 = this.stops.find(stop => stop.stopId === stopId2);
  
  if (!stop1 || !stop2) return null;
  
  const R = 6371; // Earth's radius in km
  const dLat = (stop2.coordinates.latitude - stop1.coordinates.latitude) * Math.PI / 180;
  const dLon = (stop2.coordinates.longitude - stop1.coordinates.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(stop1.coordinates.latitude * Math.PI / 180) * Math.cos(stop2.coordinates.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

module.exports = mongoose.model('Route', routeSchema);
