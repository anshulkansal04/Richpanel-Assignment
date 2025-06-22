import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { facebookAPI } from '../services/api';
import UserMenu from '../components/UserMenu';

const Dashboard = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pageInfo, setPageInfo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (pageId) {
      fetchConversations();
      fetchPageInfo();
    }
  }, [pageId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchPageInfo = async () => {
    try {
      const response = await facebookAPI.getConnectedPages();
      if (response.success) {
        const page = response.data.pages.find(p => p.id === pageId);
        setPageInfo(page);
      }
    } catch (error) {
      console.error('Failed to fetch page info:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await facebookAPI.getConversations(pageId);
      if (response.success) {
        setConversations(response.data.conversations);
        if (response.data.conversations.length > 0) {
          setSelectedConversation(response.data.conversations[0]);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await facebookAPI.getMessages(conversationId);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const response = await facebookAPI.sendMessage(selectedConversation.id, {
        message: newMessage.trim()
      });
      
      if (response.success) {
        // Add the new message to the local state immediately
        const newMsg = {
          id: Date.now(), // Temporary ID
          message: newMessage.trim(),
          from: {
            id: pageId,
            name: pageInfo?.name || 'Page'
          },
          created_time: new Date().toISOString(),
          isFromPage: true
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        toast.success('Message sent successfully');
        
        // Refresh messages to get the actual message from server
        setTimeout(() => {
          fetchMessages(selectedConversation.id);
        }, 1000);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const UserAvatar = ({ user, size = 'w-10 h-10' }) => {
    if (user?.profile_pic) {
      return (
        <img
          src={user.profile_pic}
          alt={user.name || 'User'}
          className={`${size} rounded-full object-cover border-2 border-white shadow-sm`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return (
      <div className={`${size} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow-sm`}>
        {getInitials(user?.name || user?.first_name)}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600 text-sm">Loading conversations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/manage')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Conversations</span>
          </h1>
        </div>
        <UserMenu />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Conversations Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Conversations</h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                    selectedConversation?.id === conversation.id 
                      ? 'bg-blue-50 border-l-blue-500' 
                      : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <UserAvatar user={conversation.participant} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate text-sm">
                          {conversation.participant?.name || 'Unknown User'}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessage?.created_time && formatTime(conversation.lastMessage.created_time)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate leading-tight">
                        {conversation.lastMessage?.message || 'No messages'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          Facebook DM
                        </span>
                        {conversation.unreadCount > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <UserAvatar user={selectedConversation.participant} size="w-12 h-12" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {selectedConversation.participant?.name || 'Unknown User'}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                        Offline
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end space-x-2 ${
                      message.from?.id === pageId || message.isFromPage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* User avatar for incoming messages */}
                    {!(message.from?.id === pageId || message.isFromPage) && (
                      <div className="flex-shrink-0">
                        <UserAvatar user={message.from} size="w-8 h-8" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        message.from?.id === pageId || message.isFromPage
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <p className={`text-xs mt-2 ${
                        message.from?.id === pageId || message.isFromPage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_time)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedConversation.participant?.name || 'user'}...`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      disabled={isSending}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors duration-200 flex items-center justify-center"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 text-sm">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Customer Details Panel */}
        {selectedConversation && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Customer Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="text-center">
                <UserAvatar user={selectedConversation.participant} size="w-16 h-16" />
                <h3 className="mt-3 text-lg font-semibold text-gray-900">
                  {selectedConversation.participant?.name || 'Unknown User'}
                </h3>
                <div className="flex items-center justify-center mt-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-500">Offline</span>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                    Call
                  </button>
                  <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                    Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Customer details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedConversation.participant?.email || 'NA'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">First Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedConversation.participant?.first_name || 
                       selectedConversation.participant?.name?.split(' ')[0] || 
                       'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedConversation.participant?.last_name || 
                       selectedConversation.participant?.name?.split(' ').slice(1).join(' ') || 
                       'Unknown'}
                    </p>
                  </div>
                  {selectedConversation.participant?.locale && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Language</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedConversation.participant.locale}
                      </p>
                    </div>
                  )}
                  {selectedConversation.participant?.timezone && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Timezone</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedConversation.participant.timezone}
                      </p>
                    </div>
                  )}
                </div>
                <button className="w-full mt-6 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View more details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            fontSize: '14px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default Dashboard;
