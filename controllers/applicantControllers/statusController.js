const Applicant = require('../../models/applicants.js');
const { Op } = require("sequelize");

const getStatus = async (req, res) => {
    console.log("Status Page");
    const applicant = await Applicant.findOne({
        where: {
            candidateID: req.session.candidate_id,
            jobID: req.session.job_id,
            [Op.not]: {
                status: 'Applying'
            }
        }
    });
    if(applicant === null){
        res.redirect('/login', {title: 'Login', message: ""});
        return
    }
    const status = applicant.status
    console.log(status)
    if(status == 'Rejected'){
        const context = {
            title: 'Status',
            candidate_id: req.session.candidate_id,
            job_id: req.session.job_id,
            appliedOn: applicant.appliedOn,
            status: applicant.status,
            message: 'Currently not being considered.'
        }
        res.render('status', context);
    }
    else{
        const context = {
            title: 'Status',
            candidate_id: req.session.candidate_id,
            job_id: req.session.job_id,
            appliedOn: applicant.appliedOn,
            status: applicant.status,
            message: 'We will get back to you shortly!'
        }
        res.render('status', context);
    }
}

module.exports = getStatus;