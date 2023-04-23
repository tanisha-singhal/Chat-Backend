const express=require('express');
const socketio=require('socket.io');
const cors = require('cors');
const http=require('http');
const {addUser, removeUser,getUser,getUsersInRoom}=require('./users');
const router=require('./router');
const PORT=process.env.PORT || 5001;

const app=express();
const server=http.createServer(app);
const io=socketio(server,{
    cors: {
      origin: '*',
      methods: ["GET", "POST"],
    }
  });

io.on('connection',(socket)=>{
    console.log("We have a new connection !!!");

    socket.on('join',({name,room},callback)=>{
        const {error,user}=addUser({id:socket.id,name,room});
        console.log(user);
        if(error) return callback(error);

        socket.emit('message',{user:'admin',text:`${user.name},welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message',{user:'admin',text:`${user.name},has joined! `});

        socket.join(user.room);
        io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)})
        console.log(getUsersInRoom(user.room));
        callback();
        
    })

    socket.on('sendMessage',(message,callback)=>{
        const user=getUser(socket.id);
        io.to(user.room).emit('message',{user:user.name,text:message});
        //io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)});
        callback();
    });
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message',{user:'admin',text:`${user.name} has left.`})
            io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)});
        }
    })
})

app.use(router);
app.use(cors);

server.listen(PORT,()=>console.log(`Server has started on port ${PORT}`));

