const express = require('express');
const FacebookController = require('../controllers/facebookController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes (no authentication required)

// @route   GET /api/facebook/webhook
// @desc    Webhook verification
// @access  Public
router.get('/webhook', FacebookController.verifyWebhook);

// @route   POST /api/facebook/webhook
// @desc    Handle webhook events
// @access  Public
router.post('/webhook', FacebookController.handleWebhook);

// Protected routes (authentication required)

// @route   POST /api/facebook/pages/available
// @desc    Get available Facebook pages for user
// @access  Private
router.post('/pages/available', authenticateToken, FacebookController.getAvailablePages);

// @route   POST /api/facebook/pages/connect
// @desc    Connect a Facebook page
// @access  Private
router.post('/pages/connect', authenticateToken, FacebookController.connectPage);

// @route   GET /api/facebook/pages
// @desc    Get user's connected Facebook pages
// @access  Private
router.get('/pages', authenticateToken, FacebookController.getConnectedPages);

// @route   DELETE /api/facebook/pages/:pageId
// @desc    Disconnect a Facebook page
// @access  Private
router.delete('/pages/:pageId', authenticateToken, FacebookController.disconnectPage);

// @route   GET /api/facebook/pages/:pageId/conversations
// @desc    Get conversations for a Facebook page
// @access  Private
router.get('/pages/:pageId/conversations', authenticateToken, FacebookController.getConversations);

// @route   GET /api/facebook/conversations/:conversationId/messages
// @desc    Get messages for a conversation
// @access  Private
router.get('/conversations/:conversationId/messages', authenticateToken, FacebookController.getMessages);

// @route   POST /api/facebook/conversations/:conversationId/messages
// @desc    Send a message in a conversation
// @access  Private
router.post('/conversations/:conversationId/messages', authenticateToken, FacebookController.sendMessage);

// @route   GET /api/facebook/test-auth
// @desc    Test authentication (temporary debug endpoint)
// @access  Private
router.get('/test-auth', authenticateToken, FacebookController.testAuth);

module.exports = router;