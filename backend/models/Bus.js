const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Route ID is required']
  },
  currentLocation: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  occupancy: {
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Total seats must be at least 1']
    },
    occupiedSeats: {
      type: Number,
      required: [true, 'Occupied seats is required'],
      min: [0, 'Occupied seats cannot be negative'],
      validate: {
        validator: function(value) {
          return value <= this.occupancy.totalSeats;
        },
        message: 'Occupied seats cannot exceed total seats'
      }
    },
    status: {
      type: String,
      enum: ['Available', 'Nearly Full', 'Overcrowded'],
      default: function() {
        const occupancyRate = this.occupancy.occupiedSeats / this.occupancy.totalSeats;
        if (occupancyRate < 0.7) return 'Available';
        if (occupancyRate < 0.9) return 'Nearly Full';
        return 'Overcrowded';
      }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance', 'Out of Service'],
    default: 'Active'
  },
  driver: {
    name: String,
    phoneNumber: String,
    licenseNumber: String
  },
  speed: {
    type: Number,
    default: 0,
    min: [0, 'Speed cannot be negative']
  },
  direction: {
    type: Number, // Bearing in degrees (0-360)
    min: 0,
    max: 360
  },
  nextStopId: {
    type: String,
    default: null
  },
  estimatedArrival: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for occupancy percentage
busSchema.virtual('occupancyPercentage').get(function() {
  return Math.round((this.occupancy.occupiedSeats / this.occupancy.totalSeats) * 100);
});

// Virtual for available seats
busSchema.virtual('availableSeats').get(function() {
  return this.occupancy.totalSeats - this.occupancy.occupiedSeats;
});

// Index for geospatial queries
busSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });
busSchema.index({ routeId: 1, status: 1 });
busSchema.index({ busNumber: 1 });

// Pre-save middleware to update occupancy status
busSchema.pre('save', function(next) {
  if (this.isModified('occupancy.occupiedSeats') || this.isModified('occupancy.totalSeats')) {
    const occupancyRate = this.occupancy.occupiedSeats / this.occupancy.totalSeats;
    if (occupancyRate < 0.7) {
      this.occupancy.status = 'Available';
    } else if (occupancyRate < 0.9) {
      this.occupancy.status = 'Nearly Full';
    } else {
      this.occupancy.status = 'Overcrowded';
    }
    this.occupancy.lastUpdated = new Date();
  }
  
  if (this.isModified('currentLocation')) {
    this.currentLocation.lastUpdated = new Date();
  }
  
  next();
});

// Static method to find buses by route
busSchema.statics.findByRoute = function(routeId) {
  return this.find({ routeId, status: 'Active' }).populate('routeId');
};

// Static method to find nearby buses
busSchema.statics.findNearby = function(latitude, longitude, maxDistance = 5000) {
  return this.find({
    'currentLocation.latitude': {
      $gte: latitude - (maxDistance / 111000),
      $lte: latitude + (maxDistance / 111000)
    },
    'currentLocation.longitude': {
      $gte: longitude - (maxDistance / (111000 * Math.cos(latitude * Math.PI / 180))),
      $lte: longitude + (maxDistance / (111000 * Math.cos(latitude * Math.PI / 180)))
    },
    status: 'Active'
  });
};

module.exports = mongoose.model('Bus', busSchema);
