const mongoose = require('mongoose');


//link to mongodb and use imooc collection, will create it if not exist
const DB_URL = 'mongodb://localhost:27017/imooc-chat';
mongoose.connect(DB_URL);

const models = {
    user: {
        'user': {type: String, require: true},
        'pwd': {type: String, require: true},
        'type': {type: String, require: true},
        'avatar': {type: String},
        //个人简介
        'desc': {type: String},
        //职位名
        'title': {type: String},
        'company': {type: String},
        'salary': {type: String}
    },
    chat: {
        'chatid': {'type': String, require: true},
        'from': {type: String, require: true},
        'to': {type: String, require: true},
        'read': {type:Boolean, default: false},
        'content': {type: String, require: true, default: ''},
        'create_time': {type: Number, default: Date.now}
    }
}

for (let m in models) {
    //m是models中所有key的名字，models[m]是对应key的值
    mongoose.model(m, new mongoose.Schema(models[m]))
}

module.exports = {
    getModel: function (name) {
        return mongoose.model(name);
    }
}