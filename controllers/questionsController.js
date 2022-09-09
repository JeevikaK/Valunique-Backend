const sequelize = require('../db/db.init.js');
const Applicant = require('../models/applicants.js');
const { Op, DataTypes } = require("sequelize");
const fs = require('fs')
const queryInterface = sequelize.getQueryInterface();


getQuestions = async (req, res) => {
    const { candidateId, jobId, jobName } = req.query;
    const applicant = await Applicant.findOne({ where: { candidateID: candidateId, jobID: jobId, status: 'Applying' } });
    if(applicant===null){
        req.session.destroy()
        res.redirect('/');
    }
    else{
        var answer = req.session.answers[`answer${req.params.id}`];
        console.log(answer)
        const dir = fs.opendirSync('./public/resources/uploads')
        let dirent
        let filename = ""
        while ((dirent = dir.readSync()) !== null) {
            console.log(dirent.name)
            if(dirent.name.startsWith(`${req.session.candidate_id}_Q${req.params.id}`)){
                console.log("Found file");
                filename = dirent.name
            }
        }
        dir.closeSync()
        if(answer===undefined){
            answer = '';
        }
        const xlData = req.session.xlData;
        const context = {
                title: 'Questions',  
                id : req.params.id, 
                question: xlData['questions'][req.params.id-1], 
                questionLength: xlData['questions'].length, 
                candidate_id: candidateId, 
                jobId, 
                jobName ,
                message: "",
                value: answer,
                filename
            }
        res.render('questions', context);
    }  
}

postQuestions = async (req, res) => {
    const { candidateId, jobId, jobName } = req.query;
    const { answer } = req.body;
    let filename
    if(req.file!=undefined){
        filename = req.file.filename
        if(filename.startsWith(`${req.session.candidate_id}_Q${req.params.id}`)){
            const dir = fs.opendirSync('./public/resources/uploads')
            let dirent
            while ((dirent = dir.readSync()) !== null) {
                console.log(dirent.name)
                if(dirent.name.startsWith(`${req.session.candidate_id}_Q${req.params.id}`) && dirent.name!==filename){
                    console.log("Deleting file");
                    fs.unlinkSync(`./public/resources/uploads/${dirent.name}`)
                }
            }
            dir.closeSync()
        }
    }
    else filename = ""

    req.session.questions[`question${req.params.id}`] = req.session.xlData['questions'][req.params.id-1];
    req.session.answers[`answer${req.params.id}`] = answer;
    if(answer===''){
        const context = {
            title: 'Questions',  
            id : req.params.id, 
            question: req.session.xlData['questions'][req.params.id-1], 
            questionLength: req.session.xlData['questions'].length, 
            candidate_id: candidateId, 
            jobId, 
            jobName ,
            message: `<i class="fa fa-exclamation-circle"></i> Please fill the field`,
            value: '',
            filename
        }
        res.render('questions', context);
    }
    else{
        if(Number(req.params.id) === Number(req.session.xlData['questions'].length)){
            console.log("All questions submitted")
            var flag = 0;
            for(var question in req.session.questions){
                if(req.session.questions[question]===undefined){
                    flag = 1;
                    break;
                }
            }
            if(flag===1){
                const context = {
                    title: 'Questions',  
                    id : req.params.id, 
                    question: req.session.xlData['questions'][req.params.id-1], 
                    questionLength: req.session.xlData['questions'].length, 
                    candidate_id: candidateId, 
                    jobId, 
                    jobName ,
                    message: `<i class="fa fa-exclamation-circle"></i> Please fill all Answer fields`,
                    value: '',
                    filename
                }
                res.render('questions', context);
            }
            else{
                await sequelize.query("DROP TABLE IF EXISTS `"+candidateId+"`;");
                var response = queryInterface.createTable(candidateId, {
                    serialNumber:{
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                    },
                    question: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    answer: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    filename: {
                        type: DataTypes.STRING,
                    },
                    filedata: {
                        type: DataTypes.BLOB("long"),
                    },
                });
                response.then(async () => {
                    console.log("Table created");
                    for(var i=1; i<=req.session.xlData['questions'].length; i++){
                        const dir = fs.opendirSync('./public/resources/uploads')
                        let dirent
                        let data = null
                        let filename = null
                        while ((dirent = dir.readSync()) !== null) {
                            if(dirent.name.startsWith(`${req.session.candidate_id}_Q${i}-`)){
                                console.log("Found file");
                                data = fs.readFileSync(
                                    process.cwd() + '/public/resources/uploads/' + dirent.name,
                                )
                                filename = dirent.name
                                if(dirent.name.startsWith(`${req.session.candidate_id}_Q1-`)){
                                    console.log(data, "data");
                                }
                                // console.log(data, "data");
                                // console.log(filename, "filename");
                            }
                        }
                        dir.closeSync()
                        // var insertResult = await sequelize.query("INSERT INTO `"+candidateId+"` (serialNumber, question, answer, filename, filedata) VALUES ('"+ i +"', '"+ req.session.questions[`question${i}`] +"', '"+req.session.answers[`answer${i}`]+"', '"+ filename +"', '"+ data + "')");
                        var insertResult = await sequelize.query("INSERT INTO `"+candidateId+"` (serialNumber, question, answer, filename, filedata) VALUES ('"+ i +"', '"+ req.session.questions[`question${i}`] +"', '"+req.session.answers[`answer${i}`]+"', '"+ filename +"', 'LOAD_FILE(`"+ process.cwd() + '/public/resources/uploads/' + filename + "`)')");
                    }
                    console.log("Data inserted");
                    const applicant = await Applicant.findOne({ where: { candidateID: candidateId, jobID: jobId, status: 'Applying' } });
                    var updateResult = applicant.update({
                        status: 'Applied',
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                        return;
                    });
                    console.log("Applicant updated");
                    req.session.destroy();
                    res.redirect('/');
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                    return;
                });          
            }
        }    
        else
            res.redirect(`/questions/${parseInt(req.params.id)+1}?candidateId=${candidateId}&jobId=${jobId}&jobName=${jobName}`);
    }   
}

module.exports = {
    getQuestions,
    postQuestions
}