import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMessages, sendMessage } from '../api/api';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadChats();
    // Simple polling for new messages every 10 seconds
    const interval = setInterval(() => {
      if (activeChat) loadMessages(activeChat.chat_with_id, true);
      else loadChats(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [user, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await getMessages();
      if (res.status === 'success') {
        setChats(res.chats || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatWithId: string, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await getMessages(chatWithId);
      if (res.status === 'success') {
        setMessages(res.messages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (chat: any) => {
    setActiveChat(chat);
    loadMessages(chat.chat_with_id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;
    setIsSending(true);
    try {
      const res = await sendMessage(activeChat.chat_with_id, messageInput);
      if (res.status === 'success') {
        setMessages([...messages, {
          id: res.message_id,
          sender_id: user?.id,
          receiver_id: activeChat.chat_with_id,
          content: messageInput,
          created_at: new Date().toISOString()
        }]);
        setMessageInput('');
      }
    } catch (e) {
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Please log in to view messages.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] min-h-[600px] flex bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Sidebar */}
        <div className={`w-full sm:w-1/3 border-r border-gray-100 flex flex-col ${activeChat ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-100">
            <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-2">
            {isLoading && chats.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">Loading chats...</p>
            ) : chats.length === 0 ? (
              <div className="text-center mt-10 text-gray-500 flex flex-col items-center">
                <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
                <p>No conversations yet.</p>
                <p className="text-sm mt-2">Message a hostel manager to start chatting.</p>
              </div>
            ) : (
              chats.map(chat => (
                <button
                  key={chat.chat_with_id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 ${activeChat?.chat_with_id === chat.chat_with_id ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50 border border-transparent'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center flex-shrink-0">
                    {chat.chat_with_name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{chat.chat_with_name}</h3>
                      {chat.unread_count > 0 && (
                        <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{chat.unread_count}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{chat.chat_with_role === 'manager' || chat.chat_with_role === 'admin' ? 'Hostel Manager' : 'Student'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden sm:flex bg-gray-50' : 'flex bg-white'}`}>
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4 text-gray-200" />
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-white">
                <button onClick={() => setActiveChat(null)} className="sm:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center">
                  {activeChat.chat_with_name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{activeChat.chat_with_name}</h2>
                  <p className="text-xs text-gray-500">{activeChat.chat_with_role === 'manager' || activeChat.chat_with_role === 'admin' ? 'Hostel Manager' : 'Student'}</p>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {isLoading && messages.length === 0 ? (
                  <p className="text-center text-gray-500">Loading messages...</p>
                ) : (
                  messages.map((msg: any) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${isMine ? 'bg-amber-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                          <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-2 text-right ${isMine ? 'text-amber-100' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || isSending}
                    className="w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-5 h-5 -ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
