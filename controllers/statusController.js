const Applicant = require('../models/applicants.js');
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
    

    const context = {
        title: 'Status',
        candidate_id: req.session.candidate_id,
        job_id: req.session.job_id,
        appliedOn: applicant.appliedOn,
        status: applicant.status,
    }
    res.render('status', context);
}

module.exports = getStatus;