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
    verification:{
        type:Boolean
    },
    verificationid:{
        type:String
    },
    phone: {
        type: Number
    }
});
module.exports = mongoose.model('Regis', Regis);