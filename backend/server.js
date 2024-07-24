// 모듈 및 패키지 불러오기
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

// 서버 생성
const app = express();
const server = http.createServer(app);

// cors 설정
app.use(cors({
  origin: 'http://localhost:3000'
}));

// socket.io 서버 생성 및 설정
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000"
  }
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 전역 변수
let numUsers = 0;

// socket.io 이벤트 처리
io.on('connection', (socket) => { //예약된 이벤트
  let addedUser = false;

  socket.on('new message', (data) => { //본인이 메세지를 받을 때
    console.log(`${socket.username} : ${data}`);
    socket.broadcast.emit('new message', { //본인 제외 다른 사람에게 메세지를 보냄
      username: socket.username,
      message: data
    });
  });

  socket.on('add user', (username) => { //본인이 입장할 때
    if (addedUser) return;
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', { //본인이 로그인 됨
      numUsers: numUsers
    });
    socket.broadcast.emit('user joined', { //본인 제외 다른 사람에게 입장을 알림
      username: socket.username,
      numUsers: numUsers
    });
  });

  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  socket.on('disconnect', () => { //예약된 이벤트 (클라이언트의 연결이 끊긴 경우)
    if (addedUser) {
      --numUsers;
      socket.broadcast.emit('user left', { //본인 제외 다른 사람에게 퇴장을 알림
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

// 서버 시작
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
