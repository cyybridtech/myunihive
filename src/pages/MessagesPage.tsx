import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMessages, sendMessage } from '../api/api';
import { Send, ArrowLeft, MessageSquare, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any>({
    admin: [],
    managers: [],
    students: [],
    roommates: [],
    manager: []
  });
  const [managerTab, setManagerTab] = useState<'admin' | 'broadcast' | 'students'>('admin');
  const [studentTab, setStudentTab] = useState<'manager' | 'roommates'>('manager');
  const [searchQuery, setSearchQuery] = useState('');

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
      if (activeChat) {
        loadMessages(activeChat.chat_with_id, true);
        loadChats(true);
      } else {
        loadChats(true);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [user, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-start chat with roommate from roommate finder page
  useEffect(() => {
    if (location.state?.startChatWith) {
      const startChatWith = location.state.startChatWith;
      const startChatName = location.state.startChatName;
      
      const selectChat = async () => {
        let currentChats = chats;
        if (chats.length === 0) {
          try {
            const res = await getMessages();
            if (res.status === 'success') {
              currentChats = res.chats || [];
              if (res.contacts) setContacts(res.contacts);
            }
          } catch (e) {
            console.error(e);
          }
        }
        
        const existingChat = currentChats.find(c => String(c.chat_with_id) === String(startChatWith));
        if (existingChat) {
          handleSelectChat(existingChat);
          if (chats.length === 0) {
            setChats(currentChats);
          }
        } else {
          const virtualChat = {
            chat_with_id: startChatWith,
            chat_with_name: startChatName,
            chat_with_role: 'student',
            unread_count: 0
          };
          setChats([virtualChat, ...currentChats]);
          handleSelectChat(virtualChat);
        }
        // Clear navigation state
        navigate(location.pathname, { replace: true, state: {} });
      };
      
      selectChat();
    }
  }, [location.state]);

  const loadChats = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await getMessages();
      if (res.status === 'success') {
        setChats(res.chats || []);
        if (res.contacts) {
          setContacts(res.contacts);
        }
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
        if (activeChat.chat_with_id === 'broadcast') {
          alert('Broadcast message sent to all students successfully.');
          setMessages([...messages, {
            id: res.message_id,
            sender_id: user?.id,
            receiver_id: 'broadcast',
            content: messageInput,
            created_at: new Date().toISOString()
          }]);
        } else {
          setMessages([...messages, {
            id: res.message_id,
            sender_id: user?.id,
            receiver_id: activeChat.chat_with_id,
            content: messageInput,
            created_at: new Date().toISOString()
          }]);
        }
        setMessageInput('');
      }
    } catch (e) {
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getFilteredContacts = () => {
    let list: any[] = [];
    if (!user) return [];

    if (user.role === 'admin') {
      list = contacts.managers || [];
    } else if (user.role === 'manager' || user.role === 'hostel_manager') {
      if (managerTab === 'admin') {
        list = contacts.admin || [];
      } else if (managerTab === 'broadcast') {
        list = [{
          chat_with_id: 'broadcast',
          chat_with_name: 'Broadcast to Students',
          chat_with_role: 'broadcast',
          unread_count: 0,
          last_message_time: null
        }];
      } else if (managerTab === 'students') {
        list = contacts.students || [];
      }
    } else if (user.role === 'student') {
      if (studentTab === 'manager') {
        list = contacts.manager || [];
      } else if (studentTab === 'roommates') {
        list = contacts.roommates || [];
      }
    }

    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(item => 
      (item.chat_with_name || '').toLowerCase().includes(query) ||
      (item.hostel_name || '').toLowerCase().includes(query) ||
      (item.room_number || '').toLowerCase().includes(query)
    );
  };

  const getChatSubtitle = (chat: any) => {
    if (chat.chat_with_id === 'broadcast') {
      return 'Announcement channel';
    }
    if (chat.chat_with_role === 'admin') {
      return 'System Admin';
    }
    if (chat.chat_with_role === 'manager' || chat.chat_with_role === 'hostel_manager') {
      return chat.hostel_name ? `Manager of ${chat.hostel_name}` : 'Hostel Manager';
    }
    if (chat.room_number) {
      return `Room ${chat.room_number} • ${chat.hostel_name}`;
    }
    if (user?.role === 'student' && chat.chat_with_role === 'student') {
      return 'Roommate';
    }
    return 'Student';
  };

  const shouldShowSearch = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'manager' || user.role === 'hostel_manager') {
      return managerTab === 'students';
    }
    return false;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Please log in to view messages.</p>
      </div>
    );
  }

  const filteredContactsList = getFilteredContacts();

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex-1 flex bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-0">
        
        {/* Sidebar */}
        <div className={`w-full sm:w-1/3 border-r border-gray-100 flex flex-col ${activeChat ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-100">
            <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          </div>

          {/* Role-Specific Tabs */}
          {(user.role === 'manager' || user.role === 'hostel_manager') && (
            <div className="flex border-b border-gray-100 p-2 gap-1 bg-gray-50/50">
              {(['admin', 'broadcast', 'students'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setManagerTab(tab);
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                    managerTab === tab
                      ? 'bg-white text-amber-600 shadow-sm border border-gray-100'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {user.role === 'student' && (
            <div className="flex border-b border-gray-100 p-2 gap-1 bg-gray-50/50">
              {(['manager', 'roommates'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setStudentTab(tab);
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                    studentTab === tab
                      ? 'bg-white text-amber-600 shadow-sm border border-gray-100'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {tab === 'manager' ? 'Hostel Manager' : 'Roommates'}
                </button>
              ))}
            </div>
          )}

          {/* Search bar */}
          {shouldShowSearch() && (
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/30">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
          )}

          {/* Contacts/Chats List */}
          <div className="overflow-y-auto flex-1 p-4 space-y-2">
            {isLoading && filteredContactsList.length === 0 ? (
              <p className="text-center text-gray-500 mt-10 text-sm">Loading contacts...</p>
            ) : filteredContactsList.length === 0 ? (
              <div className="text-center mt-10 text-gray-500 flex flex-col items-center">
                <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm font-semibold">No contacts found.</p>
                {user.role === 'student' && studentTab === 'roommates' && (
                  <p className="text-xs text-gray-400 mt-1 max-w-[80%]">You will see your roommates here once they pay or complete booking in your room.</p>
                )}
              </div>
            ) : (
              filteredContactsList.map(chat => (
                <button
                  key={chat.chat_with_id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 ${
                    activeChat?.chat_with_id === chat.chat_with_id 
                      ? 'bg-amber-50 border border-amber-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center flex-shrink-0">
                    {chat.chat_with_name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{chat.chat_with_name}</h3>
                      {chat.unread_count > 0 && (
                        <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">{chat.unread_count}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {getChatSubtitle(chat)}
                    </p>
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
              <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-white shadow-sm shrink-0 z-10">
                <button onClick={() => setActiveChat(null)} className="sm:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center">
                  {activeChat.chat_with_name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{activeChat.chat_with_name}</h2>
                  <p className="text-xs text-gray-500">{getChatSubtitle(activeChat)}</p>
                </div>
              </div>

              {/* Special warning for broadcast */}
              {activeChat.chat_with_id === 'broadcast' && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-xs text-amber-800 shrink-0">
                  📢 <strong>Broadcast mode:</strong> This message will be sent individually to all students currently residing in your managed hostels.
                </div>
              )}

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {isLoading && messages.length === 0 ? (
                  <p className="text-center text-gray-500">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare className="w-12 h-12 mb-3 text-gray-200" />
                    <p className="text-sm">No messages yet. Send a message to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    const isMine = String(msg.sender_id) === String(user?.id);
                    const msgDate = msg.timestamp || msg.created_at;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${isMine ? 'bg-amber-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                          <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-2 text-right ${isMine ? 'text-amber-100' : 'text-gray-400'}`}>
                            {msgDate ? new Date(msgDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
                    placeholder={activeChat.chat_with_id === 'broadcast' ? "Type announcement..." : "Type your message..."}
                    className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || isSending}
                    className="w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 transition-colors shrink-0"
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
