# 🌐 LAN Chat Room

A real-time chat application for devices on the same local network (WiFi/LAN).

## ✨ Features

- 💬 **Real-time messaging** - Instant message delivery using WebSocket
- 👥 **User presence** - See who's online
- 🖼️ **File sharing** - Send images and files
- 📱 **Mobile friendly** - Responsive design for all devices
- 💾 **Message history** - Recent messages are preserved
- 🔒 **Local only** - No internet required, works offline

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run directly
node server.js
```

## 📱 Usage

1. Start the server on your machine
2. Open browser to `http://localhost:3000`
3. Other devices on same WiFi can access via your local IP: `http://YOUR_IP:3000`
4. Enter a nickname and start chatting!

## 🔧 Requirements

- Node.js 14+
- Same WiFi/LAN network for all devices

## 📁 Project Structure

```
lan-chat/
├── server.js          # Express + Socket.IO server
├── public/
│   └── index.html     # Frontend UI
├── uploads/           # File uploads (auto-created)
└── package.json
```

## 🛡️ Security Notes

- This is designed for trusted local networks only
- No authentication (anyone on the network can join)
- Uploaded files are stored locally on the server

## 📄 License

MIT
