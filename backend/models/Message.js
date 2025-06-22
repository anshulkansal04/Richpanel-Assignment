const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String
  },
  senderProfilePic: {
    type: String
  },
  content: {
    text: String,
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'file', 'location', 'template']
      },
      url: String,
      payload: mongoose.Schema.Types.Mixed
    }]
  },
  timestamp: {
    type: Date,
    required: true
  },
  isFromPage: {
    type: Boolean,
    required: true,
    default: false
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'location', 'postback', 'quick_reply', 'template'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  metadata: {
    mid: String,
    seq: Number,
    watermark: Number,
    read: Boolean,
    prior_message: mongoose.Schema.Types.Mixed
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ messageId: 1 });
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ isFromPage: 1, timestamp: -1 });

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.metadata.read = true;
  return this.save();
};

// Method to update delivery status
messageSchema.methods.updateStatus = function(status, metadata = {}) {
  this.status = status;
  this.metadata = { ...this.metadata, ...metadata };
  return this.save();
};

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = function(conversationId, limit = 50, skip = 0) {
  return this.find({ conversationId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('replyTo', 'content timestamp senderName')
    .populate('agentId', 'name email');
};

// Static method to get recent messages for a page
messageSchema.statics.getRecentMessages = function(pageId, limit = 100) {
  return this.aggregate([
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversationId',
        foreignField: '_id',
        as: 'conversation'
      }
    },
    {
      $match: {
        'conversation.pageId': pageId
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 