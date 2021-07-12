const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportlocalmongoose = require('passport-local-mongoose');

const UserScheme = new Schema({
    
})

UserScheme.plugin(passportlocalmongoose);
module.exports = new mongoose.model('User',UserScheme);