const Applicant = require('../models/applicants.js');

const getDetails = async (req, res) => {
    const { candidateId, jobId, jobName } = req.query;
    const applicant = await Applicant.findOne({ where: { candidateID: candidateId, jobID: jobId, status: 'Applying' } });
    if(applicant===null){
        req.session.destroy()
        res.redirect('/');
    }
    else{
        var q1 = req.session.answers['question1']
        var q2 = req.session.answers['question2']
        var location = req.session.answers['location']
        var relocate = req.session.answers['location']

        const xlData = req.session.xlData;
        if(q1===undefined || q2===undefined || location===undefined || relocate===undefined){
            q1 = q2 ='';
            location = 'Select'
        }
        res.render('details', {title: 'Details', mandatorySkills: xlData['mandatorySkills'], jobName, candidate_id: candidateId, message: "", whyVolvo: q1, aboutVolvo: q2, select_location: location});
    }
    
}

const postDetails = async (req, res) => {
    const { q1, q2, location, relocate } = req.body
    const { candidateId, jobId, jobName } = req.query;

    var skill_keys = Object.keys(req.body).filter(key => key.startsWith('skill'))
    var add_skill_keys = Object.keys(req.body).filter(key => key.startsWith('add_skill'))
    var skills =''
    var add_skills=''
    skill_keys.forEach(skill => {
        skills+= req.body[skill]+', '
    })
    add_skill_keys.forEach(add_skill =>{
        if(req.body[add_skill]!=='')
            add_skills+= req.body[add_skill]+', '
    })
    console.log(skills.slice(0, -2), add_skills.slice(0, -2))
    var applicant = await Applicant.findOne({ where: { candidateID: candidateId, jobID: jobId, status: 'Applying' }});
    const xlData = req.session.xlData;
    if(q1=='' || q2=='' || location=='' || relocate==''|| skills=='' ){
        res.render('details', {title: 'Details', mandatorySkills: xlData['mandatorySkills'], jobName, candidate_id: candidateId, message: `<i class="fa fa-exclamation-circle"></i> Please fill all the fields`, value1: q1, value2: q2});
    }
    else{
        req.session.answers['question1'] = q1
        req.session.answers['question2'] = q2
        req.session.answers['location'] = location
        req.session.answers['relocate'] = relocate

        var updateResult = applicant.update({
            whyVolvo: q1,
            aboutVolvo: q2,
            skills: skills.slice(0, -2),
            additionalSkills: add_skills.slice(0, -2),
            location: location,
            relocate: relocate,
        })
        .catch(err => {
            console.log(err);
            res.status(500).render('error', {title: '500', message: "Internal Server Error"});
            return;
        });
        console.log("Applicant updated");
        res.redirect(`/questions/1?candidateId=${applicant.candidateID}&jobId=${applicant.jobID}&jobName=${xlData['jobName']}`);
    }
}

module.exports = {
    getDetails,
    postDetails
}