const mongoose = require('mongoose')
const dbconnect = require('../db')

//Call the db to connect the mongo db
dbconnect()

// Complaint Schema
const ComplaintSchema = mongoose.Schema({
    compId: {
        type: String
    },
    username: {
        type: String
    },
    message: {
        type: String
    },
    captureImage: {
        type: Buffer
    },
    contentType: {
        type: String
    },
    captureImageTimestamp: {
        type: Date,
        default: Date.now
    },
    recipient: {
        type: String
    },
    feedback: {
        type: String
    },
    geoLocation: {
        type: String
    },
    compCatagory: {
        type: String
    },
    resolutionStatus: {
        type: String
    },
    lastUpdate: {
        type: String
    }
});

const Complaint = module.exports = mongoose.model('Complaint', ComplaintSchema);

module.exports.registerComplaint = function (newComplaint, callback) {
    newComplaint.save(callback);
}

module.exports.getAllComplaints = function(username,callback){
    const query = {username: username}
    Complaint.find(callback);
  }

module.exports.getComplaintsByUsername = function(username, callback){
    const query = {username: username}
    Complaint.find(query,'username message lastUpdate',callback);
}  

module.exports.getComplaintById = function(id, callback){
    Complaint.findById(id, callback);
}
