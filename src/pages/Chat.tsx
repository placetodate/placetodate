import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPaperPlane, faCalendar, faHeart, faUser } from '@fortawesome/free-solid-svg-icons';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, QuerySnapshot, DocumentData, FirestoreError, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { MatchProfile } from './Matches';

export type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date | Timestamp;
  isRead?: boolean;
};

type ChatProps = {
  match: MatchProfile;
  currentUserId: string;
  onBack: () => void;
  onNavigate: (view: 'events' | 'matches' | 'profile') => void;
  activeView: 'events' | 'matches' | 'profile';
};

function Chat({ match, currentUserId, onBack, onNavigate, activeView }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const likesCount = 3;

  // Generate a consistent chat room ID from the two user IDs
  // This ensures both users see the same chat room
  const getChatRoomId = (userId1: string, userId2: string) => {
    // Sort IDs to ensure consistent room ID regardless of order
    // This way, User A chatting with User B gets the same room ID as User B chatting with User A
    const sorted = [userId1, userId2].sort();
    return `${sorted[0]}_${sorted[1]}`;
  };

  // Use the actual user ID from the match if available, otherwise fall back to name-based ID
  // For real users, match.userId should be set (their Firebase UID)
  // For sample matches, we'll use a name-based ID as fallback
  const matchUserId = match.userId || match.name.toLowerCase().replace(/\s+/g, '-');
  const chatRoomId = getChatRoomId(currentUserId, matchUserId);
  
  console.log('Chat Room Configuration:', {
    currentUserId,
    matchUserId,
    matchName: match.name,
    hasMatchUserId: !!match.userId,
    chatRoomId
  });

  // Create or update match document when chat is initiated
  useEffect(() => {
    const createOrUpdateMatch = async () => {
      try {
        // Create a match document ID using the same logic as chatRoomId
        const matchDocId = chatRoomId;
        const matchRef = doc(db, 'matches', matchDocId);
        
        // Check if match already exists
        const matchDoc = await getDoc(matchRef);
        
        if (!matchDoc.exists()) {
          // Create new match document
          await setDoc(matchRef, {
            user1Id: currentUserId < matchUserId ? currentUserId : matchUserId,
            user2Id: currentUserId < matchUserId ? matchUserId : currentUserId,
            user1Name: currentUserId < matchUserId ? (match.userId ? 'Current User' : match.name) : match.name,
            user2Name: currentUserId < matchUserId ? match.name : (match.userId ? 'Current User' : match.name),
            createdAt: serverTimestamp(),
            lastMessageAt: serverTimestamp(),
            lastMessage: null,
            unreadCount: {
              [currentUserId]: 0,
              [matchUserId]: 0
            },
            participants: [currentUserId, matchUserId],
            status: 'active'
          }, { merge: true });
          
          console.log('✅ Created new match document:', matchDocId);
        } else {
          // Update existing match - update lastMessageAt
          await setDoc(matchRef, {
            lastMessageAt: serverTimestamp(),
            status: 'active'
          }, { merge: true });
          
          console.log('✅ Updated existing match document:', matchDocId);
        }
      } catch (error: any) {
        console.error('❌ Error creating/updating match:', error);
      }
    };

    // Only create match if we have valid user IDs
    if (currentUserId && matchUserId && currentUserId !== matchUserId) {
      createOrUpdateMatch();
    }
  }, [chatRoomId, currentUserId, matchUserId, match.name, match.userId]);

  useEffect(() => {
    console.log('Setting up listener for chatRoomId:', chatRoomId);
    
    // Subscribe to real-time messages from the messages collection
    // Filter by chatRoomId
    const messagesRef = collection(db, 'messages');
    
    // Try without orderBy first to avoid index issues
    // We'll sort in memory instead
    const q = query(
      messagesRef,
      where('chatRoomId', '==', chatRoomId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        console.log('Received snapshot with', snapshot.size, 'messages');
        const fetchedMessages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          let timestamp: Date;
          
          // Handle Firestore Timestamp
          if (data.timestamp?.toDate) {
            timestamp = data.timestamp.toDate();
          } else if (data.timestamp instanceof Date) {
            timestamp = data.timestamp;
          } else if (data.timestamp?.seconds) {
            // Handle Timestamp object with seconds
            timestamp = new Date(data.timestamp.seconds * 1000);
          } else {
            timestamp = new Date();
          }
          
          fetchedMessages.push({
            id: doc.id,
            text: data.text || '',
            senderId: data.senderId || '',
            timestamp: timestamp,
            isRead: data.isRead || false,
          });
        });
        
        console.log('Processed messages:', fetchedMessages.length);
        console.log('Messages details:', fetchedMessages.map(m => ({
          id: m.id,
          text: m.text,
          senderId: m.senderId,
          isOwn: m.senderId === currentUserId,
          timestamp: m.timestamp
        })));
        console.log('Current User ID:', currentUserId);
        console.log('Match User ID (name-based):', matchUserId);
        
        // Sort by timestamp to ensure correct order
        fetchedMessages.sort((a, b) => {
          const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 
                       (a.timestamp as Timestamp)?.toMillis ? (a.timestamp as Timestamp).toMillis() : 0;
          const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 
                       (b.timestamp as Timestamp)?.toMillis ? (b.timestamp as Timestamp).toMillis() : 0;
          return timeA - timeB;
        });
        
        setMessages(fetchedMessages);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        console.error('Error fetching messages:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('Unsubscribing from messages');
      unsubscribe();
    };
  }, [chatRoomId]);

  const scrollToBottom = () => {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    
    // Don't clear input yet - wait for success
    console.log('=== Sending Message ===');
    console.log('Message text:', messageText);
    console.log('Chat Room ID:', chatRoomId);
    console.log('Current User ID:', currentUserId);
    console.log('Match User ID:', matchUserId);
    console.log('Database:', db);
    
    // Verify user is authenticated
    if (!currentUserId) {
      console.error('❌ No user ID! User not authenticated.');
      alert('You must be logged in to send messages.');
      return;
    }

    try {
      const messagesRef = collection(db, 'messages');
      const messageData = {
        text: messageText,
        senderId: currentUserId,
        chatRoomId: chatRoomId,
        timestamp: serverTimestamp(),
        isRead: false,
      };
      
      console.log('Attempting to save to collection: messages');
      console.log('Message data:', JSON.stringify(messageData, null, 2));
      
      const docRef = await addDoc(messagesRef, messageData);
      
      console.log('✅ Message sent successfully!');
      console.log('Document ID:', docRef.id);
      console.log('Collection: messages');
      console.log('Path: messages/' + docRef.id);
      
      // Update the match document with the latest message info
      try {
        const matchDocId = chatRoomId;
        const matchRef = doc(db, 'matches', matchDocId);
        await setDoc(matchRef, {
          lastMessageAt: serverTimestamp(),
          lastMessage: messageText,
          lastMessageSenderId: currentUserId,
          status: 'active'
        }, { merge: true });
        console.log('✅ Updated match document with latest message');
      } catch (matchError: any) {
        console.error('⚠️ Error updating match document:', matchError);
        // Don't fail the message send if match update fails
      }
      
      console.log('You can view it in Firebase Console > Firestore Database > messages collection');
      console.log('Match document: matches/' + chatRoomId);
      
      // Clear input only after successful save
      setNewMessage('');
      
      // Message will appear via the real-time listener
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error name:', error?.name);
      
      // Check for permission errors
      if (error?.code === 'permission-denied' || error?.code === 7) {
        const errorMsg = 'Permission denied! Your Firestore security rules are blocking writes.\n\n' +
          'Go to Firebase Console > Firestore Database > Rules and add:\n\n' +
          'match /messages/{messageId} {\n' +
          '  allow read, write: if request.auth != null;\n' +
          '}';
        console.error('⚠️', errorMsg);
        alert(errorMsg);
      } else if (error?.code === 'unavailable') {
        alert('Firestore is unavailable. Please check your internet connection.');
      } else {
        alert(`Error sending message: ${error?.message || 'Unknown error'}\n\nCheck browser console for details.`);
      }
      
      // Don't clear input if sending failed
      // setNewMessage is not called, so the text stays
    }
  };

  const formatTime = (timestamp: Date | Timestamp) => {
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button className="icon-button" aria-label="Back" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div className="chat-header-info">
          <img src={match.avatar} alt={match.name} className="chat-header-avatar" />
          <div className="chat-header-text">
            <h1>{match.name}</h1>
            <p className="chat-header-status">Online</p>
          </div>
        </div>
        <span className="header-spacer" aria-hidden="true" />
      </header>

      <main className="chat-messages">
        {isLoading ? (
          <div className="chat-empty-state">
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="chat-messages-list">
            {messages.map((message) => {
              // Check if message is from current user
              // A message is "own" if senderId matches currentUserId
              // Otherwise, it's from the other user (the match)
              const isOwnMessage = message.senderId === currentUserId;
              
              return (
                <div
                  key={message.id}
                  className={`chat-message ${isOwnMessage ? 'own' : 'other'}`}
                >
                  {!isOwnMessage && (
                    <img
                      src={match.avatar}
                      alt={match.name}
                      className="chat-message-avatar"
                    />
                  )}
                  <div className="chat-message-content">
                    <div className="chat-message-bubble">
                      <p>{message.text}</p>
                    </div>
                    <span className="chat-message-time">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          className="chat-send-button"
          disabled={!newMessage.trim()}
          aria-label="Send message"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeView === 'events' ? 'active' : ''}`}
          onClick={() => onNavigate('events')}
        >
          <span className="nav-icon">
            <FontAwesomeIcon icon={faCalendar} />
          </span>
          <span className="nav-label">Events</span>
        </button>
        <button
          className={`nav-item ${activeView === 'matches' ? 'active' : ''}`}
          onClick={() => onNavigate('matches')}
        >
          <span className="nav-icon">
            <FontAwesomeIcon icon={faHeart} />
          </span>
          {likesCount > 0 && <span className="nav-badge">{likesCount}</span>}
          <span className="nav-label">Matches</span>
        </button>
        <button
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          <span className="nav-icon">
            <FontAwesomeIcon icon={faUser} />
          </span>
          <span className="nav-label">Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default Chat;

