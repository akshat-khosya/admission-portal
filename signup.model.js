const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let Regis = new Schema({
    jeeroll: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    repassword:{
        type:String
    }
});
module.exports = mongoose.model('Regis', Regis);