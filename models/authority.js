const mongoose = require('mongoose')
const dbconnect = require('../db')
const bcrypt = require('bcryptjs');

//Call the db to connect the mongo db
dbconnect()

// User Schema
const AuthoritySchema = mongoose.Schema({
    AuthorityId: { type: String },
    AuthorityDescription: { type: String },
    Category: { type: String },
    AuthorityContactType: { type: String },
    AuthorityContact: { type: String }
});

const Authority = module.exports = mongoose.model('Authority', AuthoritySchema);

module.exports.getAuthorityMail = function(name,callback) {
    const query = {name: name}
    Authority.findOne(query,callback);
}

module.exports.saveAuthorityDetails = function (newAuthority, callback) {
    newAuthority.save(callback);
}