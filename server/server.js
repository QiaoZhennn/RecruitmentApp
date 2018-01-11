import express from'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import userRouter from './user'
import React from 'react'

const model = require('./model')
const Chat = model.getModel('chat')

import path from 'path'
//Chat.remove({},function (err, doc) {})
const app = express();
//work with express
const server = require('http').Server(app);
const io = require('socket.io')(server);

io.on('connection',function (socket) {
    //io是全局的连接，socket是当前的连接
    socket.on('sendmsg',function(data){
        //使用socket收到当前信息后，要将它广播到全局，即每个人都是接收状态，则使用io对象
        // io.emit('recvmsg',data)
        const {from,to,msg} = data
        const chatid = [from,to].sort().join('_')
        Chat.create({chatid,from,to,content:msg},function (err, doc) {
            if(!err) {
                io.emit('recvmsg', Object.assign({},doc._doc))
            }
        })
    })
})

app.use(cookieParser())
//需要安装额外的插件来处理post请求
app.use(bodyParser.json())
//设置一个前缀，只要是/user相关，其子路由由userRouter来定义
app.use('/user',userRouter);
//使用中间件
app.use(function (req, res, next) {
    //设置白名单
    if (req.url.startsWith('/user/') || req.url.startsWith('/static/')) {
        return next();
    }
    //把相对路径变为绝对路径l
    return res.sendFile(path.resolve('build/index.html'))
})
//解决路径引入的问题
app.use('/', express.static(path.resolve('build')))

//原来是app.listen
server.listen(9093, function () {
    console.log('Node app start at port 9093')
});