const Applicant = require('../../models/applicants.js');
const Admin = require('../../models/admin.js');
const Sequelize = require("sequelize");
const bcrypt = require('bcryptjs');

const getAccessLevels = async (req, res) => {
    if(req.session.admin === undefined){
        res.redirect('/admin');
        return
    }else if(req.session.admin.access !== "HR"){
        res.redirect(`/admin/applications`);
        return
    }
    const adminEmail = req.session.admin.email;
    const adminName = req.session.admin.name;
    const access_levels = await Admin.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('access')), 'access'], 
        ],
        order: [['access', 'ASC']]
    });
    const admins = await Admin.findAll({order: [['access', 'ASC']]});
    const context = {
        title: 'Admin', 
        admins, 
        access_levels,
        adminName: adminName, 
        adminEmail: adminEmail, 
        adminAccess: req.session.admin.access,
        type: "access"
    }
    res.render('admin', context);
}

const addAccessLevel = async (req, res) => {
    if(req.session.admin === undefined){
        res.redirect('/admin');
        return
    }
    else if(req.session.admin.access !== "HR"){
        res.redirect(`/admin/applications`);
        return
    }
    const {name, email, access, password} = req.body;
    if(name === "" || email === "" || access === "" || password === ""){
        res.json({error: "Please fill in all fields"})
        return
    }
    else if(!email.endsWith("@volvo.com")){
        res.json({error: "Please enter a Volvo email"})
        return
    }
    const admin = await Admin.findOne({where: {email: email}});
    if(admin !== null){
        res.json({error: "Admin already exists with this email"})
        return
    }
    else{
        encryptedPassword = await bcrypt.hash(password, 10);
        await Admin.create({name, email, access, password: encryptedPassword})
        .catch(err => {
            res.status(500).render('error', {title: '500', message: "Internal Server Error"});
            console.log(err)
            return;
        });
    }
    res.json({error: false})
}

const deleteAccessLevel = async (req, res) =>{
    const {adminID, newOwnerID} = req.body
    if(req.session.admin.access !== "HR"){
        res.redirect(`/admin/applications`);
        return
    }
    const admin = await Admin.findByPk(adminID);
    try{
        if(newOwnerID){
            const jobsOwned = await admin.getJobOpenings()
            for(var i = 0; i < jobsOwned.length; i++){
                await jobsOwned[i].update({AdminAdminID: newOwnerID})
            }
        }
        await admin.destroy()
    }
    catch(err){
        console.log(err)
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
    }
    
    var same_user = false
    if(admin.adminID===req.session.admin.adminID){
        req.session.destroy()
        same_user = true
    }
    res.json({message: 'Success', same_user})
}

const checkJobOwner = async (req, res) => {
    const admin = await Admin.findByPk(req.params.adminID);
    if(admin === null){
        res.redirect('/admin/access');
        return
    }
    const jobsOwned = await admin.getJobOpenings()
    console.log(jobsOwned)
    if(jobsOwned.length === 0){
        res.json({jobsOwned: false})
        return
    }
    else{
        res.json({jobsOwned: true})
        return
    }
}

module.exports = {
    getAccessLevels,
    addAccessLevel,
    deleteAccessLevel,
    checkJobOwner
}