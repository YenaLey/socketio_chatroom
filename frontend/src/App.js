import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './App.css';

// 서버에 연결된 socket.io 클라이언트 인스턴스 생성
const socket = io('http://localhost:5000');

const Chat = () => {
  const location = useLocation();
  const nickname = location.state.nickname;
  const [chats, setChats] = useState([]);
  const [numberUsers, setNumberUsers] = useState(0);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [Msg, setMessage] = useState('');

  const handleLogin = useCallback((data) => {
    setIsConnected(true);
    setNumberUsers(data.numUsers);
    setChats((prevChats) => [...prevChats, { username: nickname, message: "내가 왔다!" }]);
    console.log('방에 입장하였습니다.');
  }, [nickname]);
  
  const handleUserJoined = useCallback((data) => {
    setChats((prevChats) => [...prevChats, { username: data.username, message: "내가 왔다!" }]);
    setNumberUsers(data.numUsers);
    console.log(`${data.username}님이 입장하셨습니다.`);
  }, []);
  
  const handleUserLeft = useCallback((data) => {
    setChats((prevChats) => [...prevChats, { username: data.username, message: "내가 간다!" }]);
    setNumberUsers(data.numUsers);
    console.log(`${data.username}님이 나가셨습니다.`);
  }, []);
  
  const handleNewMessage = useCallback((data) => {
    setChats((prevChats) => [...prevChats, { username: data.username, message: data.message }]);
    console.log(`${data.username} : ${data.message}`);
  }, []);
  
  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    console.log("서버의 연결이 끊겼습니다.");
  }, []);

  useEffect(() => {
    // 본인이 입장했을 때 처리
    socket.emit('add user', nickname);

    socket.on('login', handleLogin); // 본인이 로그인 되었을 때 처리
    socket.on('user joined', handleUserJoined); // 다른 사람이 입장했을 때 처리
    socket.on('user left', handleUserLeft); // 다른 사람이 나갔을 때 처리
    socket.on('new message', handleNewMessage); // 다른 사람의 메시지를 받을 때 처리
    socket.on('disconnect', handleDisconnect); // 서버의 연결이 끊겼을 때 처리

    // 클린업 함수: 컴포넌트 언마운트 시 이벤트 핸들러 해제
    return () => {
      socket.off('login', handleLogin);
      socket.off('user joined', handleUserJoined);
      socket.off('user left', handleUserLeft);
      socket.off('new message', handleNewMessage);
      socket.off('disconnect', handleDisconnect);
    };
  }, [nickname, handleLogin, handleUserJoined, handleUserLeft, handleNewMessage, handleDisconnect]);

  const sendMessage = () => {
    if (Msg.trim() !== '') {
      socket.emit('new message', Msg); // 본인의 메시지를 서버에 전송
      setChats((prevChats) => [...prevChats, { username: nickname, message: Msg }]);
      console.log(`${nickname} : ${Msg}`);
      setMessage('');
    }
  };

  const activeEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  const onChange = (e) => {
    setMessage(e.target.value);
  };

  return (
    <>
      <p>My ID: {`${socket.id}`}</p>
      <div className="chat-container">
        <p className="number-users">{numberUsers}/3</p>
        <div className="chat-box">
          {
            chats.map((val, index) => (
              <div key={index} className={`chat ${val.username === nickname ? 'me' : ''}`}>
                <h6>{val.username}</h6>
                <p>{val.message}</p>
              </div>
            ))
          }
        </div>
        <div className="chat-input">
          <input
            onChange={onChange}
            onKeyDown={(e) => activeEnter(e)}
            className="inputMessage"
            placeholder="Type here..." />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div >
    </>
  );
};

const Login = () => {
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/chat', { state: { nickname } });
  };

  const activeEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  }

  return (
    <div className="login-container">
      <img src="/wizard.png" alt="wizard" />
      <h1>LOGIN</h1>
      <input
        type="text"
        placeholder="Enter your nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onKeyDown={(e) => activeEnter(e)}
      />
      <button onClick={handleLogin}>Join Chat</button>
    </div>
  );
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  </Router>
);

export default App;
