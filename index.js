const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const socket = require('socket.io')
const https = require('https')
const fs = require('fs')

app.use(bodyparser.json())
app.use(bodyparser.urlencoded())
app.use(express.static('public'))

app.set('view engine','ejs')
app.set('views','./views');


const userroutes = require('./routes/userroutes')

app.use('/',userroutes)

const key = fs.readFileSync('cert.key')
const cert = fs.readFileSync('cert.crt')


const server= https.createServer({key,cert},app)
// const server = app.listen(3000,()=>{
//     console.log('server started on 3000')
// })

const io = socket(server,{
    cors: {
        origin: [ "https://192.168.29.139:8181/"],
    }
});

server.listen(8181)

// const io = socket(server)

io.on("connection",(socket)=>{
    console.log('user connected-->'+socket.id)

    socket.on('join',(roomname)=>{
        var rooms = io.sockets.adapter.rooms;
        var room = rooms.get(roomname)
        
        if (room == undefined){
            socket.join(roomname)
            socket.emit('created')
        }
        else if(room.size == 1){
            socket.join(roomname)
            socket.emit('joined')
        }
        else{
            socket.emit('full')

        }
        console.log(rooms)
    })

    socket.on('ready',(roomName)=>{
        console.log("ready")
        console.log(roomName)
        socket.broadcast.to(roomName).emit("ready")
    })

    socket.on('candidate',(candidate,roomName)=>{
        socket.broadcast.to(roomName).emit("candidate",candidate)
    })

    socket.on('offer',(offer,roomName)=>{
        console.log("offer")
        socket.broadcast.to(roomName).emit("offer",offer)
    })

    socket.on('answer',(answer,roomName)=>{
        console.log("answer")
        socket.broadcast.to(roomName).emit("answer",answer)
    })

    socket.on('leave',(roomName)=>{
        console.log("leave")
        socket.broadcast.to(roomName).emit("leave")
    })
})