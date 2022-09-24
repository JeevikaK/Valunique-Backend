const Applicant = require('../models/applicants.js');
const ValidCandidateID = require('../models/candidate_id.js')
const { Op } = require("sequelize");
const xlcontroller = require('./excel-controller.js');

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
}

const getLogin = (req, res) => {
    // if candidate is already logged in, redirect to details page
    if(req.session.candidate_id)
        res.redirect(`/details?candidateId=${req.session.candidate_id}&jobId=${req.session.job_id}&jobName=${req.session.xlData['jobName']}`);
    
    else
        res.render('login', {title: 'Login', message: ""});
}

const postLogin = async (req, res) => {
    const { candidate_id, job_id } = req.body;
    const format_candidate_id = /^[0-9]+$/;
    const format_job_id = /^[A-Z0-9]+$/;

    if(candidate_id.length==8 && job_id.length == 8 && format_candidate_id.test(candidate_id) && format_job_id.test(job_id)){ //On validating candidate id and job id format
        console.log("Format Valid");

        //comparing with verified candidate id from db
        const validCandidateID = await ValidCandidateID.findOne({ where: {candidateID: candidate_id}});
        if(validCandidateID!=null){
            xlcontroller.readXlFile(res, job_id).then( async (xlData) =>{

                // removing all candidates from the database whose application is incomplete for more than a day.
                var date = new Date();
                var expDate = addDays(date, -1);
                var expiredApplicants = await Applicant.findAll({ where: { status: 'Applying', appliedOn: { [Op.lt]: expDate }}});
                if(expiredApplicants.length > 0){
                    expiredApplicants.forEach(async (applicant) => {
                        await applicant.destroy();
                    });
                }

                // add applicant details to session
                req.session.candidate_id = candidate_id
                req.session.job_id = job_id
                
                const appliedCandidate = await Applicant.findOne({ 
                    where: {
                        candidateID: candidate_id, 
                        jobID: job_id,
                        [Op.not]: {
                            status: 'Applying'
                        }
                    }
                });
                
                // if candidate has already applied for the job, redirect to details page
                if(appliedCandidate != null){
                    res.redirect('/status', );
                    return
                }
    
                // entering candidate details in the database if not already present
                var applicant = await Applicant.create({
                candidateID: Number(candidate_id),
                jobID: job_id,
                jobName: xlData['jobName'],
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
                req.session.questions = {}
                req.session.answers = {}
                req.session.xlData = xlData
                res.redirect(`/details?candidateId=${applicant.candidateID}&jobId=${applicant.jobID}&jobName=${xlData['jobName']}`);      
            })
            .catch((err) => {
                // if job id is invalid
                console.log(err);
                res.render('login', {title: 'Login', message: `<i class="fa fa-exclamation-circle"></i> Either the job id doesn't exist<br> or the required file is not attached for the job id.<br> Please contact the admin`});
            })
        }
        else{
            //if candidate id is invalid
            var message = '<i class="fa fa-exclamation-circle"></i> Incorrect Candidate ID';
            res.render('login', {title: 'Login', message});
        }
    } 
    else{
        // if candidate id or job id is of invalid format
        var message = '<i class="fa fa-exclamation-circle"></i> Incorrect format for Candidate ID or Job ID';
        res.render('login', {title: 'Login', message});
    }
}

module.exports = {
    getLogin,
    postLogin
}