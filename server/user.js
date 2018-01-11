const express = require('express')
const Router = express.Router()
const model = require('./model')
const utils = require('utility')

const Chat = model.getModel('chat');
const User = model.getModel('user');
const _filter = {'pwd': 0, '_v': 0};//设置mongodb查询结果的显示内容，pwd和版本号_v不显示


Router.get('/list', function (req, res) {
    //type是请求参数，也可以写成const type = req.query.type
    const {type} = req.query;
    // User.remove({},function (e, d) {})
    User.find({type}, function (err, doc) {
        return res.json({code:0,data:doc})
    })
})

Router.get('/getMsgList',function(req,res){
    const userid = req.cookies.userid
    User.find({},function(err,doc){
        let users = {}
        doc.forEach(v=>{
            users[v._id] = {name:v.user,avatar:v.avatar}
        })
        //'$or'是多条件查询，用数组来存放多个条件。此处查询我发出的信息和发给我的信息
        Chat.find({'$or':[{from:userid},{to:userid}]}, function(err, doc) {
            if (!err) {
                return res.json({code: 0, msgs: doc,users:users})
            }
        })
    })
})


Router.post('/readmsg',function (req, res) {
    const userid = req.cookies.userid
    const {from} = req.body
    //更新数据使用$set，默认修改第一个找到的，加入multi使修改多行
    Chat.update({
        //更新别人向我发送的消息的是否已读的状态
        from,to:userid},
        {'$set':{read:true}},
        {'multi':true},
        function (err, doc) {
        if(!err){
            //doc含有3个属性，n：表示找到多少行，nModified：表示修改多少行，ok:表示成功多少行
            return res.json({code:0,num:doc.nModified})
        }
        return res.json({code:1,msg:'update failed'})
    })
})

Router.post('/update',function (req, res) {
    const userid=req.cookies.userid
    if(!userid){
        return json.dumps({code:1})
    }
    const body = req.body;
    //mongoDB的查找并更新的方法
    User.findByIdAndUpdate(userid,body,function (err, doc) {
        // 相当于ES6的...，合并json
        const data = Object.assign({},{
            user:doc.user,
            type:doc.type
        },body);
        return res.json({code:0,data})
    })
})

Router.post('/login', function (req, res) {
    //这里的req.body，是安装的bodyParser来解析的。
    const {user, pwd} = req.body;
    //findOne中，第一个对象是查询条件，第二个对象是显示条件
    User.findOne({user, pwd: md5Pwd(pwd)}, _filter, function (err, doc) {
        if (doc==null) {
            return res.json({code: 1, msg: 'Wrong username or password'})
        } else {
            res.cookie('userid', doc._id); //将mongoDB的记录的id赋给userid
            return res.json({code: 0, data: doc})
        }
    })
})

Router.post('/register', function (req, res) {
    //这里的req.body，是安装的bodyParser来解析的。
    const {user, pwd, type} = req.body;
    User.findOne({user: user}, function (err, doc) {
        if (doc) {
            return res.json({code: 1, msg: 'Duplicate username'})
        }

        //如果使用User.create，则没法使用自动生成的_id，所以用User.save()方法
        const userModel = new User({user, pwd: md5Pwd(pwd), type});
        userModel.save(function (err, doc) {
            if (err) {
                return res.json({code: 1, msg: 'Server error'})
            }
            const {user,type,_id} = doc;
            res.cookie('userid',_id); //注册成功后，也保持登录状态
            return res.json({code: 0,data:{user,type,_id}})
        })
        //es6允许在对象中只写key，这样默认了value等于key所代表的变量值
        // User.create({user, pwd: md5Pwd(pwd), type}, function (e, d) {
        //     if (e) {
        //         return res.json({code: 1, msg: 'backend error'})
        //     }
        //     return res.json({code: 0})
        // })
    })
})
Router.get('/info', function (req, res) {
    //客户端是带着cookie向服务器发送请求的
    //我们只要从请求中获取到所有的cookies，看看它有没有包含userid这个cookie
    //即可判断当前是否登录
    const {userid} = req.cookies;
    if (!userid) {
        //当前没有登录
        return res.json({code: 1})
    }
    //当前登录了
    User.findOne({_id: userid}, _filter, function (err, doc) {
        if (err) {
            return res.json({code: 1, msg: 'backend error'})
        }
        if (doc) {
            return res.json({code: 0, data: doc})
        }
    })
})

function md5Pwd(pwd) {
    const salt = 'this_is_a_special_suffix'
    return utils.md5(utils.md5(pwd + salt));
}

module.exports = Router