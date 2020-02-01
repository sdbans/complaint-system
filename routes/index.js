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

router.get('/photo/:id', (req, res) => {
    var fileid = req.params.id;
    console.log('Id = '+ fileid)
    PictureMapping.getPictureById(fileid, (err, result) => {
    
        if (err) throw err;  
       console.log(result.contentType)
       res.contentType('image/png');
       res.send(result.imageData)
      
       
      });
    });

// Home Page - Dashboard
router.get('/', ensureAuthenticated, (req, res, next) => {
    res.render('index');
});

// Login Form
router.get('/login', (req, res, next) => {
    res.render('login');
});
// Home Page
router.get('/home/:uname',(req,res,next) => {
    User.getUserByUsername(req.params.uname, (err, user) => {
        if (err) throw err;
        if (!user) {
            return done(null, false, {
                message: 'No user found'
            });
        }
        res.status(200).json({name: user.name,email:user.email})
});
});

// History Page
router.get('/history/:uname',(req,res,next) => {
    Complaint.getComplaintsByUsername(req.params.uname,(err,complaints) => {
    if(err) {res.status(401).send({message:"",data:""})}
    res.status(200).send({data:complaints})
    })
})
// Complaint details dashboard
router.get('/complaints/:compId',(req,res,next) => {
    Complaint.getComplaintById(req.params.compId,(err,complaints) => {
        if(err) {res.status(401).send({message:"",data:""})}
        res.status(200).send({data:complaints})
        })
})

router.post('/uploadphoto',upload.single('myImage'), (req, res) => {
    console.log('Request arrived')
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');
    // Define a JSONobject for the image attributes for saving to database
    
    
       var dtype = req.file.mimetype
       var imageFile = new Buffer.from(encode_image, 'base64')
      
    const newImage = new PictureMapping({contentType: dtype,imageData: imageFile})
    PictureMapping.saveImageFile(newImage,(err, img) => {
        if (err) throw err;
       res.json({status: "success", message: "User added successfully!!!", data: null})
    });
  console.log(newImage)
});
//
router.post('/authority',(req,res) => {
    console.info("New entry for Authority")
    const newAuthorty = new Authority({
        name: req.body.name,
        email: req.body.email
    })
    Authority.saveAuthorityDetails(newAuthorty,(err,callback) => {
        if(err) res.status(401).send("Error")
        res.status(200).send('Success')
    });
})

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
    
    try {
     let errors = req.validationErrors();
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
                const subject = 'New Complaint For '+ recpient + 'Authority'
                const message = 'New Complaint with Attachment'
                const content = encode_image 
                const contType = dtype 
                
                Authority.getAuthorityMail(recpient, (err, rec) => {
                    console.info("Authority: "+ rec.email)
                    sendMailToAuthority(rec.email,subject,message,content,contType)
            });
           res.json({status: "success", message: "User Complaint added successfully!!!", data: null})
            }
        });
    } catch(e) {res.status(400).send()}
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
            if (err) throw err;
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
router.post('/login', passport.authenticate('local', 
    { 
        failureRedirect: '/login', 
        failureFlash: true 
    
    }), (req, res, next) => {
    
        req.session.save((err) => {
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

// Access Control
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error_msg', 'You are not Authorized to view this page');
        res.redirect('/login');
    }
}

function getAuthorityMailId(recptName) {

 Authority.getAuthorityMail(recptName, (err, rec) => {
        console.info("Authority: "+ rec.email)
        authEmail = rec.email;
});

}

module.exports = router;