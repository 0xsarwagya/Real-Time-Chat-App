const express = require('express');
const firebaseAdmin = require('firebase-admin');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = process.env.PORT || 5000;

// Initialize Firebase Admin SDK using a file
const firebaseAdminConfig = require('./firebaseAdminConfig.json');
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(firebaseAdminConfig),
  databaseURL: "<DATABASE URL>",
});

// Get reference to Firebase database
const database = firebaseAdmin.database();

// Server Files
app.use(express.static("public"))

// Socket.io setup
io.on('connection', (socket) => {
  console.log('Client connected');

  // Listen for new messages in real-time
  database.ref('/chat').on('child_added', (snapshot) => {
    const chatMessage = snapshot.val();
    socket.emit('newMessage', chatMessage);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/message', (req, res) => {
  const { username, message } = req.query;

  // Save the message to Firebase database
  database.ref('/chat').push({
    username,
    message
  });

  res.send('Message saved');
});

app.get('/messages', (req, res) => {
  database.ref('/chat').once('value')
    .then((snapshot) => {
      res.send(snapshot.val());
    })
    .catch((error) => {
      res.status(500).send({ error });
    });
});

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
