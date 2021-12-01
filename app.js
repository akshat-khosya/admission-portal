const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const _ = require("lodash");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const PORTS = process.env.PORT;

const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const saltRounds = 10;
dotenv.config();
let Regis = require("./models/signup.model");


app.use(cors());
app.use(bodyParser.json());
// mongoose connection
mongoose.connect(
  "mongodb+srv://" +
    process.env["MONGODBCRED"] +
    "@cluster0.phmm3.mongodb.net/admissionPortal",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const connection = mongoose.connection;

connection.once("open", function () {
  console.log("MongoDB database connection established successfully");
});
// nodemailer verifaction
const oauth2Client = new OAuth2(
  process.env["CLIENTID"], //clientid
  process.env["CLIENTSECRET"], //client secret
  process.env["REDIRECTURRL"] //redirect url
);
oauth2Client.setCredentials({
  refresh_token: process.env["REFRESHTOKEN"],
});
const accessToken = oauth2Client.getAccessToken();
const smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env["NODEMAILERUSER"],
    clientId: process.env["CLIENTID"],
    clientSecret: process.env["CLIENTSECRET"],
    refreshToken: process.env["REFRESHTOKEN"],
    accessToken: accessToken,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
// for new registeration
app.post("/register", function (req, res) {
  let newEmail = req.body.email;
  let newPassword = req.body.password;
  let newRepassword = req.body.repassword;
  let jeeRoll = req.body.jeeroll;

  Regis.findOne({ email: newEmail }, function (err, foundEmail) {
    if (!err) {
      if (!foundEmail) {
        console.log("Users is not registered");
        // email verification

        console.log(req.body);
        if (newPassword === newRepassword) {
          var rand, mailOptions, host, link;
          rand = Math.floor(Math.random() * 100 + 54);
          host = req.get("host");
          rand = newEmail + rand;
          console.log(host);
          link = "http://" + host + "/verify?id=" + rand;
          mailOptions = {
            to: newEmail,
            subject: "Please confirm your Email account",
            html:
              "Hello,<br> Please Click on the link to verify your email.<br><a href=" +
              link +
              ">Click here to verify</a>",
          };
          console.log(mailOptions);
          smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
              console.log(error);
            } else {
              console.log("Message sent: ");
            }
          });

          bcrypt.hash(newPassword, saltRounds, function (err, hash) {
            let regi = new Regis({
              jeeroll: jeeRoll,
              email: newEmail,
              password: hash,
              verification: false,
              verificationid: rand,
              render:0
            });
            regi.save();
          });

          res.send("You got registered please verify your mail");
        } else {
          console.log("Password did'nt match");
          res.send("Your Password did not matches");
        }
      } else {
        console.log("User is already register please login");
        res.send("You are already register please login");
      }
    } else {
      console.log(err);
    }
  });
});
// for login
app.post("/login", function (req, res) {
  let newEmail = req.body.email;
  let newPassword = req.body.password;

  Regis.findOne({ email: newEmail }, function (err, foundEmail) {
    if (!err) {
      if (!foundEmail) {
        res.json({ login: false });
      } else {
        if (foundEmail.verification === true) {
          bcrypt.compare(
            newPassword,
            foundEmail.password,
            function (err, results) {
              if (results === true) {
                
                res.json({
                  login: true,
                  id: foundEmail.verficationId,
                  email: foundEmail.email,
                  password: newPassword

                });
              } else {
                res.json({ login: false,
                  id: "",
                  email: "",
                  password:""
              });
              }
            }
          );
        } else {
          res.json({
            login: false,
            verification: false,
          });
        }
      }
    }
  });
});
// profile
app.post("/profile", function(req,res){
  let newEmail=req.body.email;
      Regis.findOne({email: newEmail},
        function(err,foundEmail){
          if(!err){
            if(foundEmail){
              res.json({
                user:true,
                name:foundEmail.name,
                email:foundEmail.email,
                phone: foundEmail.phone
              });
            }
            else{
              res.json({user:false});
            }
          }
          else{
            console.log(err);
          }
         
        }
        )
});
// add phone number
app.patch("/phone", function(req,res){
  console.log("ok");
    let addphone= {
      email:req.body.email,
      phone:req.body.phone
    };
    Regis.findOneAndUpdate(
      {email:addphone.email},
      {phone: addphone.phone},
      function(err){
        if(!err){
          
          res.send("Your Number added sucessfull ");
        }
        else{
          console.log(err);
        }
      }
    )
})
app.patch("/name", function(req,res){
  console.log("ok");
  let addphone= {
    email:req.body.email,
    phone:req.body.phone
  };
  Regis.findOneAndUpdate(
    {email:addphone.email},
    {name: addphone.phone},
    function(err){
      if(!err){
        
        res.send("Your Name added sucessfull ");
      }
      else{
        console.log(err);
      }
    }
  )
})
// contactus
app.post("/contactus", function(req,res){
  mailOptions = {
    to: "akshatdps12@gmail.com",
    subject: "Contact US",
    html:
      "Name: "+req.body.name +"<br>" +
      "From: "+req.body.email+"<br>"+
      "Subject: " + req.body.subject+"<br>"+
      "Message: "+req.body.message+"<br>",
  };
  console.log(mailOptions);
  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent: ");
      res.send("Message Sent");
    }
  });

})
// change password
 app.post("/newpassword", function(req,res){
   let changepassword={
     email:req.body.email,
     pass:req.body.pass,
     oldpass:req.body.oldpass,
     newpass:req.body.newpass
   }
   let newhas;
   if(changepassword.pass===changepassword.oldpass){
     
    bcrypt.hash(changepassword.newpass,saltRounds,function(error,hash){
      Regis.findOneAndUpdate(
        {email:changepassword.email},
        {password:hash },
        function(err){
          if(!err){
            res.json({
              status:true
            })
          }
          else{
            console.log(err);
          }
        }
      )
    })
    
   
   }else{
     res.json({
       status:false
     })
   }
 })
 // personal detail form-1
 app.get("/",function(req,res){
   let email="20141@iiitu.ac.in"
   Regis.findOne({email:email},function(err,foundEmail){
    if(!err){
      if(foundEmail){
        res.send(foundEmail);
      }
    }
   })
 })
 app.post("/personal",function(req,res){
   const persnal=req.body;
  //  Regis.findOne({email:persnal[0]},function(err,foundEmail){
  //    if(!err){
  //      if(foundEmail){
  //       foundEmail.name=persnal[1].sname,
  //       foundEmail.semail=persnal[1].semail,
  //       foundEmail.sgender=persnal[1].sgender,
  //       foundEmail.sdob=persnal[1].sdob,
  //       foundEmail.religion=persnal[1].religion,
  //       foundEmail.maincategory=persnal[1].maincategory,
  //       foundEmail.smnum=persnal[1].smnum,
  //       foundEmail.saadhar=persnal[1].saadhar,
  //       foundEmail.sarea=persnal[1].sarea,
  //       foundEmail.state=persnal[1].state,
  //       foundEmail.country=persnal[1].country,
  //       foundEmail.pincode=persnal[1].pincode,
  //       foundEmail.permadd=persnal[1].permadd,
  //       foundEmail.temadd=persnal[1].temadd,
  //       foundEmail.fname=persnal[1].fname,
  //       foundEmail.focupation=persnal[1].focupation,
  //       foundEmail.femail=persnal[1].femail,
  //       foundEmail.fnum=persnal[1].fnum,
  //       foundEmail.fsalary=persnal[1].fsalary,
  //       foundEmail.faadh=persnal[1].faadh,
  //       foundEmail.mname=persnal[1].mname,
  //       foundEmail.mocupation=persnal[1].mocupation,
  //       foundEmail.memail=persnal[1].memail,
  //       foundEmail.mnum=persnal[1].mnum,
  //       foundEmail.msalary=persnal[1].msalary,
  //       foundEmail.maadh=persnal[1].maadh,
  //       foundEmail.render=1
  //       res.json({
  //         render:foundEmail.render
  //       });
  //       console.log(foundEmail);
  //      }
  //      else{
  //        res.json({
  //          render:-1
  //        });
  //      }
  //    }else{
  //      console.log(err);
  //    }
  //  })
   Regis.findOneAndUpdate({email:persnal[0]},
    {
    name:persnal[1].name,
    semail:persnal[1].semail,
    sgender:persnal[1].sgender,
    sdob:persnal[1].sdob,
    religion:persnal[1].religion,
    maincategory:persnal[1].maincategory,
    phone:persnal[1].phone,
    saadhar:persnal[1].saadhar,
    sarea:persnal[1].sarea,
    state:persnal[1].state,
    country:persnal[1].country,
    pincode:persnal[1].pincode,
    permadd:persnal[1].permadd,
    temadd:persnal[1].temadd,
    fname:persnal[1].fname,
    focupation:persnal[1].focupation,
    femail:persnal[1].femail,
    fnum:persnal[1].fnum,
    fsalary:persnal[1].fsalary,
    faadh:persnal[1].faadh,
    mname:persnal[1].mname,
    mocupation:persnal[1].mocupation,
    memail:persnal[1].memail,
    mnum:persnal[1].mnum,
    msalary:persnal[1].msalary,
    maadh:persnal[1].maadh,
    render:1
    },
    function(err,foundEmail){
      if(!err){
        res.json({
          render:foundEmail.render
        });
        console.log(foundEmail);
      }else{
        console.lof(err);
      }
    }
    )
 })
 // read only form-1
 app.post("/formone",function(req,res){
  let email=req.body.email;
  
  Regis.findOne({email:email},function(err,foundEmail){
    if(!err){
      if(foundEmail){
        
          res.send(foundEmail);
        }
      
    }else{
      console.log(err);
    }
  })
 })
 // acdemic
 app.post("/acdemic", function(req,res){
   console.log(req.body);
   const persnal=req.body;
   Regis.findOneAndUpdate({email:persnal[0]},
    {
    jeeapplication:persnal[1].jeeapplication,
    jeerank:persnal[1].jeerank,
    jeeperc:persnal[1].jeeperc,
    jeestate:persnal[1].jeestate,
    jeeboard:persnal[1].jeeboard,
    jeeschool:persnal[1].jeeschool,
    jeemathp:persnal[1].jeemathp,
    jeemathmp:persnal[1].jeemathmp,
    jeematht:persnal[1].jeematht,
    jeemathmt:persnal[1].jeemathmt,
    jeemath:persnal[1].jeemath,
    jeephysicsp:persnal[1].jeephysicsp,
    jeephysicsmp:persnal[1].jeephysicsmp,
    jeephysicst:persnal[1].jeephysicst,
    jeephysicsmt:persnal[1].jeephysicsmt,
    jeephysics:persnal[1].jeephysics,
    jeechemp:persnal[1].jeechemp,
    jeechemmp:persnal[1].jeechemmp,
    jeechemt:persnal[1].jeechemt,
    jeechemmt:persnal[1].jeechemmt,
    jeechem:persnal[1].jeechem,
    render:2
    },
    function(err,foundEmail){
      if(!err){
        res.json({
          render:foundEmail.render
        });
        console.log(foundEmail);
      }else{
        console.lof(err);
      }
    }
    )
 })
// student token login
app.post("/student/verifyToken", function(req,res){

 let accessToken=req.body.xaccesstoken;
 console.log(accessToken);
 // res.json({ auth: true });
});
// verify route
app.get("/verify", function (req, res) {
  var verficationId = req.query.id;
  Regis.findOneAndUpdate(
    { verificationid: verficationId },
    { verification: true },
    function (err, foundUser) {
      if (!err) {
        if (foundUser) {
          if (foundUser.verification) {
            res.send(
              "<h1>Your email is already verfied  you can now login</h1>"
            );
          } else {
            res.send(
              "<h1>Your email verfication is succesfull you can now login</h1>"
            );
          }
        } else {
          res.send(
            '<h1 style="color:red;" >Your email is verfication is unsuccesfull you can contact adminstration</h1>'
          );
        }
      } else {
        console.log(err);
      }
    }
  );
});

app.listen(PORTS, function () {
  console.log("Server is running on Port: " + PORTS);
});
