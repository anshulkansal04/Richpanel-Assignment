const axios = require('axios');
const crypto = require('crypto');
const FacebookPage = require('../models/FacebookPage');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

class FacebookService {
  constructor() {
    this.graphAPI = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      timeout: 10000
    });
  }

  // Exchange short-lived token for long-lived user access token
  async exchangeForLongLivedToken(shortLivedToken) {
    try {
      const response = await this.graphAPI.get('/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: shortLivedToken
        }
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error exchanging token:', error.response?.data || error.message);
      throw new Error('Failed to exchange token');
    }
  }

  // Get user's pages with page access tokens
  async getUserPages(userAccessToken) {
    try {
      const response = await this.graphAPI.get('/me/accounts', {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,access_token,category,about,website,phone,emails,picture{url},tasks'
        }
      });

      return response.data.data.filter(page => 
        page.tasks && page.tasks.includes('MANAGE')
      );
    } catch (error) {
      console.error('Error fetching pages:', error.response?.data || error.message);
      throw new Error('Failed to fetch pages');
    }
  }

  // Get page information
  async getPageInfo(pageId, pageAccessToken) {
    try {
      const response = await this.graphAPI.get(`/${pageId}`, {
        params: {
          access_token: pageAccessToken,
          fields: 'id,name,category,about,website,phone,emails,picture{url},fan_count,is_verified'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching page info:', error.response?.data || error.message);
      throw new Error('Failed to fetch page info');
    }
  }

  // Subscribe page to webhook
  async subscribePageToWebhook(pageId, pageAccessToken) {
    try {
      const response = await this.graphAPI.post(`/${pageId}/subscribed_apps`, {
        subscribed_fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads'
      }, {
        params: {
          access_token: pageAccessToken
        }
      });
      return response.data.success;
    } catch (error) {
      console.error('Error subscribing to webhook:', error.response?.data || error.message);
      throw new Error('Failed to subscribe to webhook');
    }
  }

  // Send message to customer
  async sendMessage(pageAccessToken, recipientId, messageData) {
    try {
      const payload = {
        recipient: { id: recipientId },
        message: messageData,
        messaging_type: 'RESPONSE'
      };

      const response = await this.graphAPI.post('/me/messages', payload, {
        params: {
          access_token: pageAccessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      throw new Error('Failed to send message');
    }
  }

  // Send text message
  async sendTextMessage(pageAccessToken, recipientId, text) {
    return this.sendMessage(pageAccessToken, recipientId, { text });
  }

  // Send image message
  async sendImageMessage(pageAccessToken, recipientId, imageUrl) {
    const messageData = {
      attachment: {
        type: 'image',
        payload: {
          url: imageUrl,
          is_reusable: true
        }
      }
    };
    return this.sendMessage(pageAccessToken, recipientId, messageData);
  }

  // Send template message
  async sendTemplateMessage(pageAccessToken, recipientId, templatePayload) {
    const messageData = {
      attachment: {
        type: 'template',
        payload: templatePayload
      }
    };
    return this.sendMessage(pageAccessToken, recipientId, messageData);
  }

  // Get user profile information from message/conversation context
  async getUserProfileFromContext(userId, pageAccessToken, conversationId = null) {
    console.log(`Attempting to fetch profile for user ${userId} from context...`);
    
    // Try to get user data from conversation context if available
    if (conversationId) {
      try {
        const response = await this.graphAPI.get(`/${conversationId}`, {
          params: {
            access_token: pageAccessToken,
            fields: 'participants'
          }
        });
        
        const participant = response.data.participants.data.find(p => p.id === userId);
        if (participant && participant.name) {
          console.log('Found user data from conversation context:', participant);
          const nameParts = participant.name.split(' ');
          return {
            id: participant.id,
            name: participant.name,
            first_name: nameParts[0] || 'Unknown',
            last_name: nameParts.slice(1).join(' ') || 'User',
            profile_pic: null, // Try to get this separately
            locale: null,
            timezone: null,
            gender: null
          };
        }
      } catch (contextError) {
        console.log('Could not get user from conversation context:', contextError.message);
      }
    }

    // Fall back to direct profile fetching
    return this.getUserProfile(userId, pageAccessToken);
  }

  // Get user profile information
  async getUserProfile(userId, pageAccessToken) {
    console.log(`Attempting to fetch profile for user ${userId}...`);
    
    // Try multiple approaches to get user profile data
    const approaches = [
      // Approach 1: Standard user profile with all fields
      async () => {
        const response = await this.graphAPI.get(`/${userId}`, {
          params: {
            access_token: pageAccessToken,
            fields: 'name,first_name,last_name,profile_pic,id'
          }
        });
        return response.data;
      },
      
      // Approach 2: Basic user profile (name + id only)
      async () => {
        const response = await this.graphAPI.get(`/${userId}`, {
          params: {
            access_token: pageAccessToken,
            fields: 'name,id'
          }
        });
        return response.data;
      },
      
      // Approach 3: Get profile through page conversation context
      async () => {
        const response = await this.graphAPI.get(`/${userId}`, {
          params: {
            access_token: pageAccessToken,
            fields: 'name'
          }
        });
        return response.data;
      }
    ];

    let userProfile = null;
    let profilePicUrl = null;

    // Try each approach until one works
    for (let i = 0; i < approaches.length; i++) {
      try {
        console.log(`Trying approach ${i + 1} for user ${userId}...`);
        userProfile = await approaches[i]();
        console.log(`Approach ${i + 1} successful:`, userProfile);
        break;
      } catch (error) {
        console.log(`Approach ${i + 1} failed:`, error.response?.data?.error?.message || error.message);
        continue;
      }
    }

    // Try to get profile picture separately (often works even when other fields fail)
    try {
      const picResponse = await this.graphAPI.get(`/${userId}/picture`, {
        params: {
          access_token: pageAccessToken,
          redirect: false,
          height: 200,
          width: 200
        }
      });
      profilePicUrl = picResponse.data.url;
      console.log('Profile picture fetched successfully');
    } catch (picError) {
      console.log('Profile picture not available:', picError.response?.data?.error?.message || picError.message);
    }

    // If we got some data, process it
    if (userProfile && userProfile.name) {
      const fullName = userProfile.name;
      const nameParts = fullName.split(' ');
      const firstName = userProfile.first_name || nameParts[0] || 'Unknown';
      const lastName = userProfile.last_name || nameParts.slice(1).join(' ') || 'User';

      const result = {
        id: userProfile.id || userId,
        first_name: firstName,
        last_name: lastName,
        name: fullName,
        profile_pic: profilePicUrl,
        locale: userProfile.locale || null,
        timezone: userProfile.timezone || null,
        gender: userProfile.gender || null
      };

      console.log('Final user profile:', result);
      return result;
    }

    // If all approaches failed, return default data
    console.log(`All approaches failed for user ${userId}, returning default profile`);
    return {
      id: userId,
      first_name: 'Unknown',
      last_name: 'User',
      name: 'Unknown User',
      profile_pic: profilePicUrl, // May still have profile picture even if name failed
      locale: null,
      timezone: null,
      gender: null
    };
  }

  // Process incoming webhook message
  async processWebhookMessage(webhookData) {
    try {
      for (const entry of webhookData.entry) {
        const pageId = entry.id;
        
        // Find the Facebook page in our database
        const facebookPage = await FacebookPage.findOne({ pageId, isActive: true });
        if (!facebookPage) {
          console.log(`Page ${pageId} not found or inactive`);
          continue;
        }

        // Process messaging events
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await this.processMessagingEvent(messagingEvent, facebookPage);
          }
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  // Process individual messaging event
  async processMessagingEvent(event, facebookPage) {
    try {
      const senderId = event.sender.id;
      const pageId = facebookPage.pageId;

      // Skip messages from the page itself
      if (senderId === pageId) return;

      // Get user profile
      const userProfile = await this.getUserProfile(senderId, facebookPage.pageAccessToken);
      const customerName = `${userProfile.first_name} ${userProfile.last_name}`.trim();

      // Find or create conversation
      const conversation = await Conversation.findOrCreateConversation(
        pageId,
        senderId,
        customerName,
        userProfile.profile_pic
      );

      // Process different types of events
      if (event.message) {
        await this.processIncomingMessage(event, conversation, facebookPage);
      } else if (event.delivery) {
        await this.processDeliveryEvent(event, conversation);
      } else if (event.read) {
        await this.processReadEvent(event, conversation);
      } else if (event.postback) {
        await this.processPostbackEvent(event, conversation, facebookPage);
      }
    } catch (error) {
      console.error('Error processing messaging event:', error);
    }
  }

  // Process incoming message
  async processIncomingMessage(event, conversation, facebookPage) {
    const message = event.message;
    const timestamp = new Date(event.timestamp);

    // Create message record
    const messageData = {
      conversationId: conversation._id,
      messageId: message.mid,
      senderId: event.sender.id,
      senderName: conversation.customerName,
      senderProfilePic: conversation.customerProfilePic,
      content: {
        text: message.text || '',
        attachments: this.parseAttachments(message.attachments)
      },
      timestamp,
      isFromPage: false,
      messageType: this.getMessageType(message),
      metadata: {
        mid: message.mid,
        seq: message.seq
      }
    };

    const newMessage = new Message(messageData);
    await newMessage.save();

    // Update conversation
    await conversation.updateLastMessage(message.text || '[Attachment]', timestamp);
    await conversation.incrementUnreadCount();

    return newMessage;
  }

  // Process delivery event
  async processDeliveryEvent(event, conversation) {
    const delivery = event.delivery;
    
    // Update message delivery status
    await Message.updateMany(
      {
        conversationId: conversation._id,
        'metadata.mid': { $in: delivery.mids }
      },
      {
        status: 'delivered',
        'metadata.watermark': delivery.watermark
      }
    );
  }

  // Process read event
  async processReadEvent(event, conversation) {
    const read = event.read;
    
    // Mark messages as read
    await Message.updateMany(
      {
        conversationId: conversation._id,
        timestamp: { $lte: new Date(read.watermark) }
      },
      {
        status: 'read',
        'metadata.read': true
      }
    );
  }

  // Process postback event
  async processPostbackEvent(event, conversation, facebookPage) {
    // Handle postback events (button clicks, etc.)
    const postback = event.postback;
    
    const messageData = {
      conversationId: conversation._id,
      messageId: `postback_${Date.now()}`,
      senderId: event.sender.id,
      senderName: conversation.customerName,
      content: {
        text: postback.title || postback.payload
      },
      timestamp: new Date(event.timestamp),
      isFromPage: false,
      messageType: 'postback',
      metadata: {
        payload: postback.payload
      }
    };
    const newMessage = new Message(messageData);
    await newMessage.save();

    await conversation.updateLastMessage(postback.title || '[Postback]', new Date(event.timestamp));
  }

  // Fetch conversations from Facebook API
  async getPageConversations(pageId, pageAccessToken, limit = 20) {
    try {
      console.log(`Fetching conversations for page ${pageId}...`);
      
      const response = await this.graphAPI.get(`/${pageId}/conversations`, {
        params: {
          access_token: pageAccessToken,
          fields: 'id,updated_time,participants,can_reply,is_subscribed,message_count,unread_count',
          limit
        }
      });

      console.log(`Found ${response.data.data.length} conversations`);

      const conversations = [];
      for (const conv of response.data.data) {
        try {
          // Get the participant who is not the page
          const participant = conv.participants.data.find(p => p.id !== pageId);
          if (participant) {
            console.log(`Processing conversation ${conv.id} with participant ${participant.id}`);
            
            // Get user profile with enhanced error handling
            let userProfile;
            try {
              userProfile = await this.getUserProfileFromContext(participant.id, pageAccessToken, conv.id);
            } catch (profileError) {
              console.error(`Failed to get profile for participant ${participant.id}:`, profileError.message);
              // Create fallback profile data
              userProfile = {
                id: participant.id,
                first_name: 'Unknown',
                last_name: 'User',
                name: participant.name || 'Unknown User',
                profile_pic: null,
                locale: null,
                timezone: null,
                gender: null
              };
            }
            
            // Get the last message
            let lastMessage = null;
            try {
              const messages = await this.getConversationMessages(conv.id, pageAccessToken, 1);
              if (messages.length > 0) {
                lastMessage = {
                  message: messages[0].message,
                  created_time: messages[0].created_time
                };
              }
            } catch (msgError) {
              console.log(`Could not fetch last message for conversation ${conv.id}:`, msgError.message);
              lastMessage = {
                message: 'No recent messages',
                created_time: conv.updated_time
              };
            }
            
            conversations.push({
              id: conv.id,
              participant: {
                id: participant.id,
                name: userProfile.name || `${userProfile.first_name} ${userProfile.last_name}`.trim(),
                first_name: userProfile.first_name,
                last_name: userProfile.last_name,
                profile_pic: userProfile.profile_pic,
                locale: userProfile.locale,
                timezone: userProfile.timezone,
                gender: userProfile.gender
              },
              lastMessage,
              unreadCount: conv.unread_count || 0,
              updated_time: conv.updated_time,
              can_reply: conv.can_reply,
              message_count: conv.message_count
            });
            
            console.log(`Added conversation with user: ${userProfile.name}`);
          }
        } catch (convError) {
          console.error(`Error processing conversation ${conv.id}:`, convError.message);
          
          // Try to add conversation with minimal data to avoid losing it completely
          try {
            const participant = conv.participants.data.find(p => p.id !== pageId);
            if (participant) {
              conversations.push({
                id: conv.id,
                participant: {
                  id: participant.id,
                  name: participant.name || 'Unknown User',
                  first_name: 'Unknown',
                  last_name: 'User',
                  profile_pic: null,
                  locale: null,
                  timezone: null,
                  gender: null
                },
                lastMessage: {
                  message: 'Unable to load message',
                  created_time: conv.updated_time
                },
                unreadCount: conv.unread_count || 0,
                updated_time: conv.updated_time,
                can_reply: conv.can_reply,
                message_count: conv.message_count
              });
              console.log(`Added conversation with minimal data for ${participant.id}`);
            }
          } catch (fallbackError) {
            console.error(`Could not create fallback conversation for ${conv.id}:`, fallbackError.message);
          }
        }
      }

      console.log(`Successfully processed ${conversations.length} conversations`);
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error.response?.data || error.message);
      
      // Provide more specific error information
      let errorMessage = 'Failed to fetch conversations';
      if (error.response?.data?.error) {
        const fbError = error.response.data.error;
        if (fbError.code === 190) {
          errorMessage = 'Facebook access token expired. Please reconnect your page.';
        } else if (fbError.code === 200) {
          errorMessage = 'Insufficient permissions to access conversations. Please reconnect your page with proper permissions.';
        } else if (fbError.code === 100) {
          errorMessage = 'Invalid Facebook page ID or the page no longer exists.';
        } else {
          errorMessage = `Facebook API Error: ${fbError.message || 'Unknown error'}`;
        }
      }
      
      const customError = new Error(errorMessage);
      customError.facebookError = error.response?.data?.error;
      throw customError;
    }
  }

  // Fetch messages from a conversation
  async getConversationMessages(conversationId, pageAccessToken, limit = 50) {
    try {
      console.log(`Fetching messages for conversation ${conversationId}...`);
      
      const response = await this.graphAPI.get(`/${conversationId}/messages`, {
        params: {
          access_token: pageAccessToken,
          fields: 'id,message,from,created_time,attachments',
          limit
        }
      });

      console.log(`Found ${response.data.data.length} messages`);

      // Enhance messages with user profile information
      const messages = [];
      for (const msg of response.data.data) {
        try {
          let senderProfile = null;
          
          // Try to get sender profile if it's not the page and we have sender info
          if (msg.from && msg.from.id) {
            try {
              senderProfile = await this.getUserProfile(msg.from.id, pageAccessToken);
            } catch (profileError) {
              console.log(`Could not fetch profile for sender ${msg.from.id}:`, profileError.message);
              // Create fallback profile from existing data
              senderProfile = {
                id: msg.from.id,
                name: msg.from.name || 'Unknown User',
                first_name: msg.from.name ? msg.from.name.split(' ')[0] : 'Unknown',
                last_name: msg.from.name ? msg.from.name.split(' ').slice(1).join(' ') || 'User' : 'User',
                profile_pic: null
              };
            }
          }

          messages.push({
            id: msg.id,
            message: msg.message || '[Attachment]',
            from: {
              id: msg.from?.id,
              name: senderProfile?.name || msg.from?.name || 'Unknown',
              first_name: senderProfile?.first_name,
              last_name: senderProfile?.last_name,
              profile_pic: senderProfile?.profile_pic
            },
            created_time: msg.created_time,
            attachments: msg.attachments
          });
        } catch (msgError) {
          console.error(`Error processing message ${msg.id}:`, msgError.message);
          // Add message with basic info if profile fetch fails
          messages.push({
            id: msg.id,
            message: msg.message || '[Attachment]',
            from: {
              id: msg.from?.id || null,
              name: msg.from?.name || 'Unknown',
              first_name: msg.from?.name ? msg.from.name.split(' ')[0] : 'Unknown',
              last_name: msg.from?.name ? msg.from.name.split(' ').slice(1).join(' ') || 'User' : 'User',
              profile_pic: null
            },
            created_time: msg.created_time,
            attachments: msg.attachments
          });
        }
      }

      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error.response?.data || error.message);
      throw new Error('Failed to fetch messages');
    }
  }

  // Get conversation participants
  async getConversationParticipants(conversationId, pageAccessToken) {
    try {
      const response = await this.graphAPI.get(`/${conversationId}`, {
        params: {
          access_token: pageAccessToken,
          fields: 'participants'
        }
      });
      
      return response.data.participants.data;
    } catch (error) {
      console.error('Error fetching conversation participants:', error.response?.data || error.message);
      throw new Error('Failed to fetch conversation participants');
    }
  }

  // Helper methods
  parseAttachments(attachments) {
    if (!attachments) return [];
    
    return attachments.map(attachment => ({
      type: attachment.type,
      url: attachment.payload?.url,
      payload: attachment.payload
    }));
  }

  getMessageType(message) {
    if (message.attachments && message.attachments.length > 0) {
      return message.attachments[0].type;
    }
    if (message.quick_reply) {
      return 'quick_reply';
    }
    return 'text';
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha1', process.env.FACEBOOK_APP_SECRET)
      .update(payload, 'utf8')
      .digest('hex');
    
    return signature === `sha1=${expectedSignature}`;
  }
}

module.exports = new FacebookService();