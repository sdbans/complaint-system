const mongoose = require('mongoose')
const dbconnect = require('../db')
const bcrypt = require('bcryptjs');

//Call the db to connect the mongo db
dbconnect()

// Lookup table Schema
const LookupSchema = mongoose.Schema({
    LookupType: { type: String },
    LookupName: { type: String },
    LookupValue: { type: String },
    Description: { type: String },
    Tag: { type: String }
});

const Lookup = module.exports = mongoose.model('Lookup', LookupSchema);

module.exports.getLookupDetails = function(lookupType,lookupName,callback) {
    const query = {LookupType: lookupType,LookupName:lookupName}
    Lookup.findOne(query,callback);
}

module.exports.saveLookupDetails = function (newLookup, callback) {
    newLookup.save(callback);
}