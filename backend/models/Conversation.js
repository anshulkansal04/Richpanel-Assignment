const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  pageId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerProfilePic: {
    type: String
  },
  lastMessageAt: {
    type: Date,
    required: true
  },
  lastMessageText: {
    type: String
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'closed'],
    default: 'open'
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
conversationSchema.index({ pageId: 1, customerId: 1 });
conversationSchema.index({ pageId: 1, lastMessageAt: -1 });
conversationSchema.index({ pageId: 1, status: 1, lastMessageAt: -1 });

// Method to update last message info
conversationSchema.methods.updateLastMessage = function(messageText, timestamp) {
  this.lastMessageAt = timestamp || new Date();
  this.lastMessageText = messageText;
  return this.save();
};

// Method to increment unread count
conversationSchema.methods.incrementUnreadCount = function() {
  this.unreadCount += 1;
  return this.save();
};

// Method to mark as read
conversationSchema.methods.markAsRead = function() {
  this.unreadCount = 0;
  return this.save();
};

// Static method to find or create conversation
conversationSchema.statics.findOrCreateConversation = async function(pageId, customerId, customerName, customerProfilePic) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Try to find existing conversation within 24 hours
  let conversation = await this.findOne({
    pageId,
    customerId,
    lastMessageAt: { $gte: twentyFourHoursAgo }
  });
  
  if (!conversation) {
    // Create new conversation
    conversation = new this({
      pageId,
      customerId,
      customerName,
      customerProfilePic,
      lastMessageAt: new Date()
    });
    await conversation.save();
  } else {
    // Update customer info if provided
    if (customerName && conversation.customerName !== customerName) {
      conversation.customerName = customerName;
    }
    if (customerProfilePic && conversation.customerProfilePic !== customerProfilePic) {
      conversation.customerProfilePic = customerProfilePic;
    }
  }
  
  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation; 