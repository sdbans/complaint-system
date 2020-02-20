const mongoose = require('mongoose')
const dbconnect = require('../db')
const bcrypt = require('bcryptjs');

//Call the db to connect the mongo db
dbconnect()

// Session table Schema
const SessionSchema = mongoose.Schema({
    SessionId: { type: String },
    UserId: { type: String },
    FirstConnect: {type: Date, default: Date.now},
    LastConnect: {type: Date},
    timeOut: {type: Date},
    counter: {type: Number},
    source: {type: String}
});

const Session = module.exports = mongoose.model('Session', SessionSchema);

module.exports.getSessionDetails = function(userId,callback) {
    const query = {UserId: userId}
    Session.findOne(query,callback);
}

module.exports.saveSessionDetails = function (newSession, callback) {
    newSession.save(callback);
}