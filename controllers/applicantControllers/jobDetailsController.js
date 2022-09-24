const JobOpening = require('../../models/jobOpening.js');


async function getJobDetails(job_id){
    var jobDescription = {};
    const job = await JobOpening.findByPk(job_id);
    if(job==null){
        return null;
    }
    jobDescription['jobName'] = job.jobName;
    jobDescription['jobID'] = job.jobID;
    jobDescription['questions'] = job.questions.split(',');
    allSkills = job.skills.split(';');
    var mandatorySkills = {};
    for(var i=0; i<allSkills.length; i++){
        var type = `skill${i+1}`;
        mandatorySkills[type] = allSkills[i].split(',');
    }
    console.log(mandatorySkills);
    jobDescription['mandatorySkills'] = mandatorySkills;
    console.log(jobDescription);
    return jobDescription;
}

module.exports = {
    getJobDetails
}

