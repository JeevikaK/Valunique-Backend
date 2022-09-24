const Admin = require('../../models/admin.js');
const Applicant = require('../../models/applicants.js');
const JobOpening = require('../../models/jobOpening.js');
const fs = require('fs')
const { createPDF, createFolder, deleteFolder } = require('./FileController.js');
const AdmZip = require('adm-zip');
const zip = require('express-zip');
const { QueryTypes } = require('sequelize');
const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const sequelize = require('../../db/db.init.js');

const getApplications = async (req, res) => {
    const {adminEmail, adminName} = req.query; 
    const admin = await Admin.findOne({
        where: {
            email: adminEmail, name: adminName
        },
        order: [['access', 'ASC']]
    });
    if(admin === null){
        res.redirect('/');
        return
    }
    req.session.admin = admin;

    var applicants
    if(admin.access === 'HR'){
        applicants = await Applicant.findAll({where: {
            status: {
                [Op.not]:"Applying"
            }
        }, 
            order: [['jobID', 'ASC']]
        });
    }
    else{
        const hiringManager = await Admin.findOne({
            where: {
                name: req.session.admin.name,
                email: req.session.admin.email,
                access: 'Hiring Manager'
            },
            include: {
                model: JobOpening,
                include: Admin
            }
        })
        const recruiter = await Admin.findOne({
            where: {
                access: 'Recruiter',
                name: req.session.admin.name,
                email: req.session.admin.email
            },
            include: {
                model: JobOpening,
                as: 'jobs',
                include: Admin
            }
        })
        var allJobs = [] 
        if(recruiter)
            allJobs.push(recruiter.jobs)
        if(hiringManager)
            allJobs.push(hiringManager.JobOpenings)
     
        const jobIDs = allJobs.reduce(combineJobs, [])
        
        function combineJobs(jobIDs, jobs){
            if(jobs.length>0){
                jobs.forEach((job) => {
                    if(!jobIDs.includes(job.jobID)){
                        jobIDs.push(job.jobID)
                    }
                })
            }
            return jobIDs
        }
        console.log(jobIDs)

        applicants = await Applicant.findAll({
            where: {
                jobID: {
                    [Op.in]: jobIDs
                },
                status: {
                    [Op.not]:"Applying"
                }
            },
            order: [['jobID', 'ASC']]
        })
    }

    const jobs = await Applicant.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('jobID')), 'jobID'], 
            'jobName'
        ],
        order: [['jobID', 'ASC']]
    });

    const context = {
        title: 'Admin', 
        applicants, 
        jobs,
        adminName: admin.name, 
        adminEmail: admin.email, 
        adminAccess: admin.access, 
        type: "applicants"
    }
    res.render('admin', context);
}

const updateStatus = async (req, res) => {
    const {status, applicant_id} = req.body
    console.log(status, applicant_id)
    var applicant = await Applicant.findByPk(applicant_id);
    console.log(applicant)
    const update_status = await applicant.update({status: status})
    .catch(err => {
        console.log(err, 123);
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
        return;
    });
    res.json({status})
    return;
}

const downloadSingleApplication = async (req, res) => {
    const applicant_id = req.params.applicant_id;
    console.log(applicant_id)
    const applicant = await Applicant.findByPk(applicant_id);
    var fileQuestions = await sequelize.query("SELECT * FROM `"+applicant.candidateID+"_"+applicant.jobID+"` WHERE `filename` IS NOT NULL", { type: QueryTypes.SELECT });
    var files=[];
    try{
        fileQuestions.forEach(async (file) => {
            if (!fs.existsSync(process.cwd() +'/public/resources/downloads/'+applicant.jobID)) {
                fs.mkdirSync(process.cwd() +'/public/resources/downloads/'+applicant.jobID);
            }
            fs.writeFileSync(process.cwd()+`/public/resources/downloads/${applicant.jobID}/${file.filename}`, file.filedata)
            files.push({path: process.cwd()+`/public/resources/downloads/${applicant.jobID}/${file.filename}`, name: file.filename})
        });
    }
    catch(err){
        console.log(err)
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
    }
    await createPDF(applicant);
    files.push({path: process.cwd() +`/public/resources/downloads/${applicant.jobID}/${applicant.candidateID}/${applicant.candidateID}_${applicant.jobID}.pdf`, name: `${applicant.candidateID}_${applicant.jobID}.pdf`})

    res.zip(files, `${applicant.candidateID}_${applicant.jobID}.zip` , (err) => {
        if(err){
            console.log(err)
        } else{
            const dir = fs.opendirSync('./public/resources/downloads/'+ applicant.jobID);
            let dirent
            while ((dirent = dir.readSync()) !== null) {
                if(dirent.name.startsWith(`${applicant.candidateID}_`))
                    fs.unlinkSync(`./public/resources/downloads/${applicant.jobID}/${dirent.name}`)
                else if(dirent.name.startsWith(`${applicant.candidateID}`)){
                    deleteFolder(`./public/resources/downloads/${applicant.jobID}/${dirent.name}`)
                }
            }
            dir.closeSync()
            console.log("Downloaded")
        }
    }) 
}

const downloadAllApplications = async (req, res) => {
    const zip = new AdmZip();
    const ids = req.params.ids.split(',');
    const jobID = req.params.jobID;
    const applicants = await Applicant.findAll({
        where: {
          id: { [Op.in]: ids },
        },
    });
    try{
        if (!fs.existsSync(process.cwd() +'/public/resources/downloads/'+jobID)) {
            fs.mkdirSync(process.cwd() +'/public/resources/downloads/'+jobID);
        }
    }
    catch(err){
        console.log(err)
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
    }
    const getFolders = async () => {
        for(var i=0; i<applicants.length; i++){
            await createFolder(applicants[i]);
            console.log("created folder for "+applicants[i].candidateID)
            if(i === applicants.length-1){
                return true;
            }
        }
        return true;
    }
    getFolders().then((result) => {
        if(result){
            setTimeout(() => {
                zip.addLocalFolder("./public/resources/downloads/"+jobID )
                zip.writeZip("./public/resources/downloadAll/"+jobID+".zip");
                res.download("./public/resources/downloadAll/"+jobID+".zip", jobID+".zip", (err) => {
                    if(err){
                        console.log(err)
                        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                    } else{
                        deleteFolder( process.cwd() + `/public/resources/downloads/${jobID}`);
                        fs.unlinkSync(process.cwd() + `/public/resources/downloadAll/${jobID}.zip`);
                        console.log("Downloaded")
                    }
                })
            }, 200)
        }
        else{
            console.log("Error")
        }
    })
}

module.exports = {
    getApplications,
    updateStatus,
    downloadSingleApplication,
    downloadAllApplications
}