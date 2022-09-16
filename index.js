require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let mongoose = require('mongoose');
const dns = require("dns");
const bodyParser = require("body-parser");

// connect to the database
mongoose.connect(process.env['MONGO_URI'], 
                 {useNewUrlParser: true, useUnifiedTopology: true});


// Declare variable to store the url model
let Url;

// create a schema for the table
const urlSchema = new mongoose.Schema({
    original_url:{
        type: String,
        unique: true,
        required: true,
    },
    url_code:{
        type: Number,
        unique: true
    }
})
// generate model from schema
Url = mongoose.model("Url", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use('/public', express.static(`${process.cwd()}/public`));


// ROUTES
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// url post handling
app.post("/api/shorturl", (req, res)=>{
    // constant variables
    const original = req.body.url;
    const cleaned_url = original.split("/")
    const code = Math.floor(Math.random()*101);

    // set dns lookup option
    const options = {
        family: 4,
    }
    
    // verify the url passed
    dns.lookup(cleaned_url[2], options, (err, address ,family)=>{
        if(err){
            res.json({
                error:'invalid url'
            })
            return console.log(err);
        } 
        else{
            console.log(`Address: ${address}\n Family:${family}`)
            if(cleaned_url.length === 3){
                 // create a new url document
                var new_url = new Url({
                    original_url: original,
                    url_code: code
                })
                // save the document and return json with the info
                new_url.save((err, data)=>{
                    if(err) return console.error(err);
                    res.json({
                        original_url: original,
                        short_url: code
                    })
                })
            }
            else{
                res.json({
                    error:'invalid url'
                })
            }

        }
    })

})

// short site redirect route
app.get("/api/shorturl/:short_url", (req, res)=>{
Url.findOne({url_code:parseInt(req.params.short_url)}, (err, data)=>{
        if(err){
            return console.error(err);
        }
        else{
            return res.redirect(301, data.original_url);
        }
    })
})


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
