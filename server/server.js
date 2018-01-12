import express from 'express'

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const userRouter = require('./user')

//服务端的CSS钩子函数
import csshook from 'css-modules-require-hook/preset' // import hook before routes
//服务端的图片的钩子函数
import assethook from 'asset-require-hook'

assethook({
    extensions: ['png']
})
import React from 'react'
import {createStore, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import {Provider} from 'react-redux';
import {StaticRouter} from 'react-router-dom';
import App from '../src/app'
import reducers from '../src/reducer'

import {renderToString} from 'react-dom/server'
//这个是build时，动态生成的css与js文件的地址。
import staticPath from '../build/asset-manifest'

const model = require('./model')
const Chat = model.getModel('chat')

const path = require('path')
//Chat.remove({},function (err, doc) {})
const app = express();
//work with express
const server = require('http').Server(app);
const io = require('socket.io')(server);

io.on('connection', function (socket) {
    //io是全局的连接，socket是当前的连接
    socket.on('sendmsg', function (data) {
        //使用socket收到当前信息后，要将它广播到全局，即每个人都是接收状态，则使用io对象
        // io.emit('recvmsg',data)
        const {from, to, msg} = data
        const chatid = [from, to].sort().join('_')
        Chat.create({chatid, from, to, content: msg}, function (err, doc) {
            if (!err) {
                io.emit('recvmsg', Object.assign({}, doc._doc))
            }
        })
    })
})

app.use(cookieParser())
//需要安装额外的插件来处理post请求
app.use(bodyParser.json())
//设置一个前缀，只要是/user相关，其子路由由userRouter来定义
app.use('/user', userRouter);


//使用中间件
app.use(function (req, res, next) {
    //设置白名单
    if (req.url.startsWith('/user/') || req.url.startsWith('/static/')) {
        return next();
    }

    const store = createStore(reducers, compose(
        applyMiddleware(thunk)
    ));
    let context = {}
    const markup = renderToString(
        (<Provider store={store}>
            <StaticRouter
                location={req.url}
                context={context}
            >
                <App/>
            </StaticRouter>
        </Provider>)
    )

    const pageHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta name="theme-color" content="#000000">
        <link rel="manifest" href="%PUBLIC_URL%/manifest.json">
        <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
        <title>React App</title>
        <link rel="stylesheet" href="/${staticPath['main.css']}">
        </head>
        <body>
        <noscript>
          You need to enable JavaScript to run this app.
        </noscript>
        <div id="root">${markup}</div>
        <script src="/${staticPath['main.js']}"></script>
        </body>
        </html>
    `

    res.send(pageHtml)
})
//解决路径引入的问题
app.use('/', express.static(path.resolve('build')))


//原来是app.listen
server.listen(9093, function () {
    console.log('Node app start at port 9093')
});