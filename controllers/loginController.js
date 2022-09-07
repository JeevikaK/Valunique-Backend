const Applicant = require('../models/applicants.js');
const { Op, DataTypes } = require("sequelize");
const xlcontroller = require('./excel-controller.js');

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
}

const getLogin = (req, res) => {
    if(req.session.candidate_id)
        res.redirect(`/details?candidateId=${req.session.candidate_id}&jobId=${req.session.job_id}&jobName=${req.session.xlData['jobName']}`);
    else
        res.render('login', {title: 'Login', message: ""});
}

const postLogin = async (req, res) => {
    const { candidate_id, job_id } = req.body;
    const format_candidate_id = /^[0-9]+$/;
    const format_job_id = /^[A-Z0-9]+$/;
    if(candidate_id.length==8 && job_id.length == 8 && format_candidate_id.test(candidate_id) && format_job_id.test(job_id)){
        console.log("Format Valid");
        xlcontroller.readXlFile(res, job_id).then( async (xlData) =>{
            console.log("xlData read ");
            
            var date = new Date();
            var expDate = addDays(date, -1);
            var expiredApplicants = await Applicant.findAll({ where: { status: 'Applying', appliedOn: { [Op.lt]: expDate }}});
            if(expiredApplicants.length > 0){
                expiredApplicants.forEach(async (applicant) => {
                    await applicant.destroy();
                });
            }
            var applicant = await Applicant.findOne({ where: { candidateID: candidate_id, jobID: job_id } });
            if(applicant===null){
                applicant = await Applicant.create({
                candidateID: Number(candidate_id),
                jobID: job_id,
                status: 'Applying',
                whyVolvo: '',
                aboutVolvo: '',
                skills: '',
                additionalSkills: '',
                location: '',
                relocate:'',
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                    return;
                });
                console.log("Applicant created");

                req.session.candidate_id = applicant.candidateID
                req.session.job_id = applicant.jobID
                req.session.questions = {}
                req.session.answers = {}
                req.session.xlData = xlData
                res.redirect(`/details?candidateId=${applicant.candidateID}&jobId=${applicant.jobID}&jobName=${xlData['jobName']}`);
            }
            else{
                var updateResult = await applicant.update({
                    appliedOn: new Date()
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                    return;
                });
                console.log("Applicant updated");
                res.redirect(`/details?candidateId=${applicant.candidateID}&jobId=${applicant.jobID}&jobName=${xlData['jobName']}`);
            }      
        })
        .catch((err) => {
            console.log(err);
            res.render('login', {title: 'Login', message: `<i class="fa fa-exclamation-circle"></i> Either the job id doesn't exist<br> or the required file is not attached for the job id.<br> Please check with the admin`});
        })
    } 
    else{
        var message = '<i class="fa fa-exclamation-circle"></i> Incorrect format for Candidate ID or Job ID';
        res.render('login', {title: 'Login', message});
    }
}

module.exports = {
    getLogin,
    postLogin
}