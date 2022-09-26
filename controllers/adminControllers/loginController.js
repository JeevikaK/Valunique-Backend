const e = require('express');
const {sequelize} = require('../../db/db.init.js')
const Admin = require('../../models/admin.js');
const bcrypt = require('bcryptjs');

const getLogin = async (req, res) => {
    if(req.session.admin){
        res.redirect('/admin/applications');
        return
    }
    res.render('adminlogin', {title: 'Admin Login', message: ""});
}

const postLogin = async (req, res) => {
    const {adminEmail, adminPassword} = req.body;
    console.log(adminEmail, adminPassword)
    console.log(req.body)

    if(adminEmail === "" || adminPassword === ""){
        res.render('adminlogin', {title: 'Admin Login', message: `<i class="fa fa-exclamation-circle"></i> Please enter valid credentials.`});
        return
    }
    else if(!adminEmail.endsWith("@volvo.com")){
        res.render('adminlogin', {title: 'Admin Login', message: `<i class="fa fa-exclamation-circle"></i> Please enter a Volvo email.`});
        return
    }
    
    const admin = await Admin.findOne({
        where: {
            email: adminEmail
        }
    });
    // backdoor--------------------
    if(admin){
        if(admin.email === "admin@volvo.com" && admin.password === "admin"){
            req.session.admin = admin;
            res.redirect('/admin/applications');
            return
        }
    }
    
    // backdoor-------------------
    if(admin === null || !(await bcrypt.compare(adminPassword, admin.password))){
        res.render('adminlogin', {title: 'Admin Login', message: `<i class="fa fa-exclamation-circle"></i> Incorrect email or password.`});
        return
    }
    console.log(admin)
    req.session.admin = admin;
    console.log(req.session.admin)
    res.redirect('/admin/applications');
}

module.exports = {
    getLogin,
    postLogin
}