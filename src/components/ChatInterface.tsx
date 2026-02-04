'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, MessageSquare } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: string;
  citations?: Citation[];
  createdAt: string;
}

interface Citation {
  id: string;
  textSnippet: string;
  pageNumber?: number;
  documentName: string;
}

export default function ChatInterface({ projectId }: { projectId: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession, sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/chat/sessions?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !activeSession) {
          setActiveSession(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessions([newSession, ...sessions]);
        setActiveSession(newSession.id);
      }
    } catch (e) {
      console.error('Failed to create session:', e);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this chat session?')) return;
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const newSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(newSessions);
        if (activeSession === sessionId) {
          setActiveSession(newSessions[0]?.id || null);
        }
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeSession || isSending) return;

    const messageText = inputMessage;
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession,
          message: messageText,
        }),
      });

      if (res.ok) {
        await fetchSessions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send message');
        setInputMessage(messageText); // Restore message on error
      }
    } catch (e) {
      console.error('Failed to send message:', e);
      setInputMessage(messageText); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentSession = sessions.find(s => s.id === activeSession);

  return (
    <div className="flex h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={createNewSession}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <MessageSquare size={16} />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No chat sessions yet
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`p-3 cursor-pointer border-b border-slate-200 hover:bg-white transition-colors ${
                  activeSession === session.id ? 'bg-white border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-slate-800 truncate flex-1">
                    {session.title}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="text-slate-400 hover:text-red-600 ml-2 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {session.messages.length} messages
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentSession.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p className="text-center">
                    <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                    Start a conversation by asking a question about your documents
                  </p>
                </div>
              ) : (
                currentSession.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 mb-2">Sources:</p>
                          <div className="space-y-1">
                            {msg.citations.map(citation => (
                              <div key={citation.id} className="text-xs text-slate-600">
                                <span className="font-medium">{citation.documentName}</span>
                                {citation.pageNumber && <span className="text-slate-400"> (p. {citation.pageNumber})</span>}
                                <p className="italic mt-0.5">"{citation.textSnippet.substring(0, 150)}..."</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {msg.role === 'assistant' && msg.confidence && (
                        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                          msg.confidence === 'high' ? 'bg-green-100 text-green-800' :
                          msg.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {msg.confidence} confidence
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about your documents..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={isSending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isSending}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  <Send size={16} />
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p>Select a chat or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
