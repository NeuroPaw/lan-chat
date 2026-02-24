const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// 存储在线用户
const onlineUsers = new Map();
const messageHistory = [];
const MAX_HISTORY = 100;

// 获取局域网IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// 静态文件服务
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 获取本机IP接口
app.get('/ip', (req, res) => {
  res.send(LOCAL_IP);
});

// 文件上传接口
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`
  });
});

// Socket.io 连接处理
io.on('connection', (socket) => {
  const clientIp = socket.handshake.headers['x-forwarded-for'] || 
                   socket.handshake.address || 
                   '未知';
  
  console.log(`[连接] ${clientIp} 已连接, Socket ID: ${socket.id}`);
  
  // 用户加入
  socket.on('join', (userData) => {
    const user = {
      id: socket.id,
      name: userData.name || `用户${socket.id.slice(-4)}`,
      ip: clientIp,
      joinedAt: new Date()
    };
    onlineUsers.set(socket.id, user);
    
    // 发送历史消息
    socket.emit('history', messageHistory);
    
    // 广播用户加入
    io.emit('userJoined', {
      user: user,
      onlineCount: onlineUsers.size,
      onlineUsers: Array.from(onlineUsers.values())
    });
    
    console.log(`[加入] ${user.name} (${clientIp})`);
  });
  
  // 接收文本消息
  socket.on('chatMessage', (data) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    const message = {
      id: uuidv4(),
      type: 'text',
      text: data.text,
      user: user,
      timestamp: new Date()
    };
    
    messageHistory.push(message);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }
    
    io.emit('message', message);
    console.log(`[消息] ${user.name}: ${data.text.slice(0, 50)}...`);
  });
  
  // 接收图片消息
  socket.on('imageMessage', (data) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    const message = {
      id: uuidv4(),
      type: 'image',
      url: data.url,
      filename: data.filename,
      user: user,
      timestamp: new Date()
    };
    
    messageHistory.push(message);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }
    
    io.emit('message', message);
    console.log(`[图片] ${user.name}: ${data.filename}`);
  });
  
  // 接收文件消息
  socket.on('fileMessage', (data) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    
    const message = {
      id: uuidv4(),
      type: 'file',
      url: data.url,
      filename: data.filename,
      originalname: data.originalname,
      size: data.size,
      user: user,
      timestamp: new Date()
    };
    
    messageHistory.push(message);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }
    
    io.emit('message', message);
    console.log(`[文件] ${user.name}: ${data.originalname}`);
  });
  
  // 用户断开
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      io.emit('userLeft', {
        user: user,
        onlineCount: onlineUsers.size,
        onlineUsers: Array.from(onlineUsers.values())
      });
      console.log(`[离开] ${user.name} (${clientIp})`);
    }
  });
});

const PORT = 3000;
const LOCAL_IP = getLocalIP();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 局域网聊天室已启动！`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📱 本机访问: http://localhost:${PORT}`);
  console.log(`🌐 局域网访问: http://${LOCAL_IP}:${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`💡 同一WiFi下的设备可以用上面的局域网链接访问`);
  console.log(`⏹️  按 Ctrl+C 停止服务\n`);
});
