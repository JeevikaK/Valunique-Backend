const Applicant = require('../models/applicants.js');

const logout = async (req,res) => {
    const applicant = await Applicant.findOne({ where: { candidateID: req.session.candidate_id, jobID: req.session.job_id, status: 'Applying' } });
    const delete_result = await applicant.destroy();
    console.log(applicant)
    req.session.destroy();
    res.redirect('/');
}

module.exports = logout;