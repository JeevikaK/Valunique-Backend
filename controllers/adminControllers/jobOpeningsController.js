const {sequelize} = require('../../db/db.init.js');
const Admin = require('../../models/admin.js');
const JobOpening = require('../../models/jobOpening.js');
const { Op } = require("sequelize");


const getJobOpenings = async (req, res) => {
    if(req.session.admin === undefined){
        res.redirect('/admin');
        return
    }
    var jobOpenings
    if(req.session.admin.access === 'HR'){
        jobOpenings = await JobOpening.findAll({
            include: Admin,
        });
    }   
    else if(req.session.admin.access === `Hiring Manager`){
        jobOpenings = await JobOpening.findAll({
            where:{
                AdminAdminID: req.session.admin.adminID
            },
            include: Admin,
        });
    }
    else if(req.session.admin.access === `Recruiter`){
        const jobsOwned = await JobOpening.findAll({
            where:{
                AdminAdminID: req.session.admin.adminID
            },
            include: Admin,
        }); 
        const jobsRecruited = await JobOpening.findAll({
            include: Admin,
            include: {
                model: Admin,
                as: 'recruiters',
                where: {
                    adminID: req.session.admin.adminID
                }
            }
        })
        const jobOpeningsID = []
        console.log(jobOpeningsID)
        jobsOwned.forEach((job) => {
            if(jobOpeningsID.indexOf(job.jobID) === -1){
                jobOpeningsID.push(job.jobID)
            }
        })
        jobsRecruited.forEach((job) => {
            if(jobOpeningsID.indexOf(job.jobID) === -1){
                jobOpeningsID.push(job.jobID)
            }
        })
        jobOpenings = await JobOpening.findAll({
            where: {
                jobID: {
                    [Op.in]: jobOpeningsID
                }
            },
            include: Admin,
        }) 
    }
    res.render('admin_openings', {title: 'Job Openings', admin: req.session.admin, jobs: jobOpenings})
}

const editJobOpening = async (req, res) => {
    if(req.session.admin === undefined){
        res.redirect('/admin');
        return
    }
    try{
        const recruiters = await Admin.findAll({
            where: {
                access: 'Recruiter',
                [Op.not]: [{adminID: req.session.admin.adminID}]
            }, 
            raw: true 
        })
    
        const job = await JobOpening.findByPk(req.params.jobID, {
            include: Admin
        })
        if(job==null)
            res.redirect('/admin/jobOpenings')
        const questions = job.questions.split(",")
        const skills = job.skills.split(";")
        const jobRecruiters = await job.getRecruiters()

        var opening = {}
        opening['questionNo'] = questions.length
        opening['questions'] = questions
        opening['skillNo'] = skills.length
        opening['skills'] = skills
        opening['recruiterNo'] = jobRecruiters.length
        opening['recruiters'] = jobRecruiters
        if(jobRecruiters.length>0)
            opening['addRecruiter'] = 'yes'
        opening['jobID'] = req.params.jobID

        res.render('jobQuestions', {title: 'Add Job Questions', admin:req.session.admin, recruiters, opening})
    }
    catch(err){
        console.log(err)
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
    }
}

const addJobOpening = async (req, res) => {
    req.session.opening = req.body; 
    const recruiters = await Admin.findAll({
        where: {
            access: 'Recruiter',
            [Op.not]: [{adminID: req.session.admin.adminID}]
        }, 
        raw: true 
    })

    res.render('jobQuestions', {title: 'Add Job Questions', admin:req.session.admin, opening: req.session.opening, recruiters})
}

const checkJobExists = async(req, res) => {
    const job = await JobOpening.findByPk(req.params.jobID)
    if(job==null){
        res.json({found: false})
    }
    else{
        res.json({found: true})
    }
}

const addJobQuestions = async (req, res) => {
    var questions = ""
    var skills = ""
    var recruiterIds = []
    //creating questions list
    Object.keys(req.body).forEach((key) => {
        if(key.startsWith("question")){
            if(req.body[key] != "")
                questions += req.body[key]+","
        }
    })
    //creating skills list
    Object.keys(req.body).forEach((key) => {
        req.body[key] = req.body[key].split(" ").join("")
        if(key.startsWith("skillType")){
            if(req.body[key] != "")
                skills += req.body[key]+";"
        }
    })
    //creating recruiters list
    Object.keys(req.body).forEach((key) => {
        if(key.startsWith("recruiter")){
            if(req.body[key] != "")
                if(!recruiterIds.includes(Number(req.body[key])))
                    recruiterIds.push(Number(req.body[key]))
        }
    })

    const t = await sequelize.transaction();

    try{
        const recruiters = await Admin.findAll({
            where: {
                adminID: { [Op.in]: recruiterIds },
            },
        })

        var jobOpening = await JobOpening.findByPk(req.params.jobID)
        if(jobOpening != null) {
            console.log(recruiters)
            await jobOpening.update({
                questions: questions.slice(0,-1),
                skills: skills.slice(0,-1),
            }, {transaction: t})

            await jobOpening.setRecruiters(recruiters, {transaction: t})
        }
        else{
            jobOpening = await JobOpening.create({
                jobID: req.session.opening.jobID,
                jobName: req.session.opening.jobName,
                questions: questions.slice(0,-1),
                skills: skills.slice(0, -1),
                AdminAdminID: req.session.admin.adminID,
            }, {transaction: t})

            await jobOpening.addRecruiters(recruiters, {transaction: t})
        }
        
        await t.commit();

    } catch(err) {
        await t.rollback();
        console.log(err);
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
        return;
    }

    res.redirect('/admin/jobOpenings')
}

const deleteJobOpening = async (req, res) => {
    const jobID = req.params.jobID
    const jobOpening = await JobOpening.findByPk(jobID)
    if(jobOpening==null)
        res.redirect("/admin/jobOpenings")

    await jobOpening.destroy()
    .catch(err => {
        console.log(err);
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
    })
    res.json('Deleted')
}



module.exports = {
    getJobOpenings,
    editJobOpening,
    addJobOpening,
    checkJobExists,
    addJobQuestions,
    deleteJobOpening
}