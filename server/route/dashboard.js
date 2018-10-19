const express = require('express');

//router
const query = require('./query.js')


let router = express.Router();

router.get('/', function(req, res){
    res.render('dashboard')
})

module.exports = router