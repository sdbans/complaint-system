const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const multer = require('multer');
const bodyParser= require('body-parser')
const app = express()
fs = require('fs-extra')
var upload = multer({ dest: 'uploads/'})
let User = require('../models/user');
let Complaint = require('../models/complaint');
let ComplaintMapping = require('../models/complaint-mapping');
let PictureMapping = require('../models/pic');
const {sendMailToAuthority} = require('../emails/accounts')
let Authority = require('../models/authority')
let Lookup = require('../models/lookup')
let Session = require('../models/session')

// Home Page for User
router.get('/home/:uname',(req,res,next) => {
    User.getUserByUsername(req.params.uname, (err, user) => {
        if (err) res.status(400).send('Error in fetching UserName');
        if (!user) res.status(400).send('No User Found');
        res.status(200).json({name: user.name,email:user.email,mobile:user.mobile})
});
});

// History Page
router.get('/history/:uname',(req,res,next) => {
    Session.getSessionDetails(req.params.uname,(err,rec) => {
        console.info('GET complaint history for User: '+req.params.uname)
        const today = new Date
        if (rec.timeOut.getTime() > today.getTime()) {
    Complaint.getComplaintsByUsername(req.params.uname,(err,complaints) => {
    if(err) {res.status(401).send({message:"",data:""})}
    res.status(200).send({data:complaints})
    })
}
    else res.status(400).send('Session expired, Please login')
});
});

// Complaint details dashboard
router.get('/complaints/:compId',(req, res, next) => {
    console.info('GET complaint for user: ' + req.body.username)
        Session.getSessionDetails(req.body.username,(err,rec) => {
            const today = new Date
            if (rec.timeOut.getTime() > today.getTime()) {
               Complaint.getComplaintById(req.params.compId,(err,complaints) => {
            if(err) {res.status(401).send({message:"",data:""})}
            res.status(200).send({data:complaints})
            })
        }
   else res.status(400).send('Session expired, Please login')
})
});

//Register a Complaint
 router.post('/registerComplaint', upload.single('myImage') ,(req, res, next) => {
    
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');
    
    const dtype = req.file.mimetype
    const imageFile = new Buffer.from(encode_image, 'base64')
    const username = req.body.username;
    const message = req.body.message;
    const recpient = req.body.recpients;
    const location = req.body.location;
    const compCatagory = req.body.compCatagory;

    Session.getSessionDetails(req.body.username,(err,rec) => {
        const today = new Date
        if (rec.timeOut.getTime() > today.getTime()) {
            try {
                // let errors = req.validationErrors();
                   const newComplaint = new Complaint({
                        username: username,
                        message: message,
                        recpient: recpient,
                        feedback: '',
                        geoLocation: location,
                        compCatagory: compCatagory,
                        captureImage: imageFile,
                        contentType: dtype,
                        resolutionStatus: 'ACTIVE'
                    });
            
                    Complaint.registerComplaint(newComplaint, (err, complaint) => {
                        if(!err) {
                            const subject = 'Complaint For '+ complaint.compCatagory + 'Ref:' + complaint._id
                            const message = complaint.message
                            const content = encode_image 
                            const contType = dtype 
                            Lookup.getLookupDetails('CCS_INFO','APPLICATION_EMAIL',(err,senderRec) => {
                                Lookup.getLookupDetails('CCS_CATEGORIES',recpient,(err,receiverRec) => {
                                 console.info('Sender:'+ senderRec.LookupValue +'receiver:' + receiverRec.LookupValue + 'complaintId:' + complaint._id)
                                sendMailToAuthority(senderRec.LookupValue,receiverRec.LookupValue,subject,message,content,contType)
                                })
                            })
                            
                       res.json({status: "success", message: "User Complaint added successfully!!!", data: null})
                        }
                    });
                } catch(e) {res.status(400).send('Exception While registering complaint')}
         

        }
        else res.status(400).send('Session expired, Please login')
        })

});


// Process Register
router.post('/register', (req, res, next) => {
    const name = req.body.name;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2;
    const mobile = req.body.mobile;

    req.checkBody('name', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('email', 'Email must be a valid email address').isEmail();
    req.checkBody('username', 'Username field is required').notEmpty();
    req.checkBody('password', 'Password field is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
    req.checkBody('mobile', 'Mobile is required').notEmpty();
    let errors = req.validationErrors();

    if (errors) {
        res.status(400).json({
            errors: errors
        });
    } else {
        const newUser = new User({
            name: name,
            username: username,
            email: email,
            password: password,
            mobile: mobile
        });

        User.registerUser(newUser, (err, user) => {
            if (err) res.status(400).send('Registration Failed' + err);
           res.json({status: "success", message: "User added successfully!!!", data: null})
        });
    }
});

// Local Strategy

passport.use(new LocalStrategy((username, password, done) => {
    User.getUserByUsername(username, (err, user) => {
        if (err) throw err;
        if (!user) {
            return done(null, false, {
                message: 'No user found'
            });
        }

        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, {
                    message: 'Wrong Password'
                });
            }
        });
    });
}));

passport.serializeUser((user, done) => {
    var sessionUser = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobile: user.mobile
    }
    done(null, sessionUser);
});

passport.deserializeUser((id, done) => {
    User.getUserById(id, (err, sessionUser) => {
        done(err, sessionUser);
    });
});

// Login Processing
router.post('/login', passport.authenticate('local'), (req, res, next) => {
    // save
    const todayDt  = new Date
    var sessionObj = new Session({
        UserId: req.body.username,
        LastConnect: new Date,
        timeOut: todayDt.setDate(todayDt.getDate() + 7)
       // source: {type: String}
    })
    Session.saveSessionDetails(sessionObj,(err,ssn) => {
        if (err) {
            res.status(400).json({error: err});
        }
        else{
            Complaint.getComplaintsByUsername(req.body.username, (err, comp) => {
                if (err) throw err;
                if (!comp) {
                    res.status(200).json({"data" : 'No updated Contents'})
                }
                
                res.status(200).send(comp)
               
    //,"recipients": comp.recipients,"feedback":comp.feedback,"lastUpdate":comp.lastUpdate
        });
        
        }
    });
});

module.exports = router;