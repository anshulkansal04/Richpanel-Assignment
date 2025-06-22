const mongoose = require('mongoose');

const facebookPageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pageId: {
    type: String,
    required: true,
    unique: true
  },
  pageName: {
    type: String,
    required: true
  },
  pageAccessToken: {
    type: String,
    required: true
  },
  pageProfilePicture: {
    type: String
  },
  category: {
    type: String
  },
  about: {
    type: String
  },
  website: {
    type: String
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  webhookVerified: {
    type: Boolean,
    default: false
  },
  permissions: [{
    permission: String,
    status: String
  }],
  lastSyncAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster lookups
facebookPageSchema.index({ userId: 1 });
facebookPageSchema.index({ pageId: 1 });
facebookPageSchema.index({ userId: 1, isActive: 1 });

// Method to update last sync time
facebookPageSchema.methods.updateLastSync = function() {
  this.lastSyncAt = new Date();
  return this.save();
};

const FacebookPage = mongoose.model('FacebookPage', facebookPageSchema);

module.exports = FacebookPage; 