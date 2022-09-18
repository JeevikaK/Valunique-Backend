const fs = require('fs')
const PDFDocument = require('pdfkit');;
const sequelize = require('../db/db.init.js');
const { QueryTypes } = require('sequelize');

const createPDF = async (applicant) => {
    var jobQuestions = await sequelize.query("SELECT * FROM `"+applicant.candidateID+"_"+applicant.jobID+"`", { type: QueryTypes.SELECT });
    var fileText = `
CANDIDATE REFERENCE ID: ${applicant.candidateID}
JOB REFERENCE ID: ${applicant.jobID}\n
Applied For: ${applicant.jobName}
Applied On: ${applicant.appliedOn}
Status: ${applicant.status}\n
Why do you want to work for us?
${applicant.whyVolvo}\n
What do you know about Volvo?
${applicant.aboutVolvo}\n
Primary Skills: ${applicant.skills}
Additional Skills: ${applicant.additionalSkills.length>0?applicant.additionalSkills:null}\n
Location: ${applicant.location}
Willing to Relocate: ${applicant.relocate}\n\n\n\n\n\nJOB SPECIFIC QUESTIONS\n\n\n`;

    jobQuestions.forEach((question) => {
        if(question.filename)
            fileText += 'Q'+ question.serialNumber +') '+ question.question + "\nA:" + question.answer + "\n (File Attached) \n\n\n";
        else
            fileText += 'Q'+ question.serialNumber +') '+ question.question + "\nA:" + question.answer + "\n\n\n";
    })
    console.log("questions Written")
    if (!fs.existsSync(process.cwd() +'/public/resources/downloads/'+applicant.jobID)) {
        fs.mkdirSync(process.cwd() +'/public/resources/downloads/'+applicant.jobID);
    }
    console.log("Directory Created")
    const writepdf = new Promise(async (resolve, reject) => {
        const doc = new PDFDocument();
        if (!fs.existsSync(process.cwd() +`/public/resources/downloads/${applicant.jobID}/${applicant.candidateID}`)) {
            fs.mkdirSync(process.cwd() +`/public/resources/downloads/${applicant.jobID}/${applicant.candidateID}`);
        }
        doc.pipe(fs.createWriteStream(process.cwd() + '/public/resources/downloads/'+applicant.jobID+`/${applicant.candidateID}/${applicant.candidateID}_${applicant.jobID}.pdf`))
        doc
        .fontSize(8)
        .text(fileText, 100, 100);
        doc.end()
        resolve(doc)
    })
   
    writepdf.then((result)=>{
        console.log("PDF created")
    })
}

const createFolder = async (applicant) =>{
    var fileQuestions = await sequelize.query("SELECT * FROM `"+applicant.candidateID+"_"+applicant.jobID+"` WHERE `filename` IS NOT NULL", { type: QueryTypes.SELECT });
    try{
        fileQuestions.forEach((file) => {
            if (!fs.existsSync(process.cwd() +`/public/resources/downloads/${applicant.jobID}/${applicant.candidateID}`)) {
                fs.mkdirSync(process.cwd() +`/public/resources/downloads/${applicant.jobID}/${applicant.candidateID}`);
            }
            fs.writeFileSync(process.cwd()+`/public/resources/downloads/${applicant.jobID}/${applicant.candidateID}/${file.filename}`, file.filedata)
        });
    }
    catch(err){
        console.log(err)
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
    }
    await createPDF(applicant)
}

const deleteFolder = async (path) =>{
    if (fs.existsSync(path)) {
        fs.rmdirSync(path, { recursive: true });
    }
}

module.exports = {
    createPDF,
    createFolder,
    deleteFolder
}