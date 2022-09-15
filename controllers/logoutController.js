const Applicant = require('../models/applicants.js');

const logout = async (req,res) => {
    // remove applicant details from database and destroy session and redirect to login page
    if(req.session.candidate_id){
        const applicant = await Applicant.findOne({ where: { candidateID: req.session.candidate_id, jobID: req.session.job_id, status: 'Applying' } });
        if(applicant != null)
            var delete_result = await applicant.destroy();
        req.session.destroy();     
    }

    //destroy admin session if admin login
    else if(req.session.admin){
        req.session.destroy();
    }

    res.redirect('/');
}

module.exports = logout;