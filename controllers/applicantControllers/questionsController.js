const sequelize = require('../../db/db.init.js');
const Applicant = require('../../models/applicants.js');
const { Op, DataTypes } = require("sequelize");
const { QueryTypes } = require('sequelize');
const fs = require('fs')
const queryInterface = sequelize.getQueryInterface();


getQuestions = async (req, res) => {
    const { candidateId, jobId, jobName } = req.query;

    // if candidate is not logged in, redirect to login page
    if(req.session.candidate_id==undefined)
        res.redirect('/');

    const applicant = await Applicant.findOne({ where: { candidateID: candidateId, jobID: jobId, status: 'Applying' } });

    // if applicant is not found, redirect to details page and destroy session
    if(applicant===null){
        req.session.destroy()
        res.redirect('/');
    }
    else{
        //retrieve answer to the question IF IT EXISTS from the sesssion 
        var answer = req.session.answers[`answer${req.params.id}`];
        if(answer===undefined){
            answer = '';
        }

        //Cycle through the uploads directory to find the file uploaded to the question IF IT EXISTS
        let filename = "";
        try { 
            if (fs.existsSync('./public/resources/uploads/'+ req.session.job_id)) {
                const dir = fs.opendirSync('./public/resources/uploads/'+ req.session.job_id)
                let dirent
                while ((dirent = dir.readSync()) !== null) {
                    if(dirent.name.startsWith(`${req.session.candidate_id}_Q${req.params.id}-`)){ //verifying if file belongs to the current question and current candidate
                        filename = dirent.name
                    }
                }
                dir.closeSync()
            }
        } catch (err) {
            console.error(err);
        }
        
        const jobDescription = req.session.jobDescription; //retrieve the Excel data from the session
        const context = {
                title: 'Questions',  
                id : req.params.id, 
                question: jobDescription['questions'][req.params.id-1], 
                questionLength: jobDescription['questions'].length, 
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

    // if candidate is not logged in, redirect to login page
    if(req.session.candidate_id==undefined)
        res.redirect('/');
        
    req.session.questions[`question${req.params.id}`] = req.session.jobDescription['questions'][req.params.id-1];
    req.session.answers[`answer${req.params.id}`] = answer;

    let filename

    //IF the user uploaded a file, retrieve the filename and delete the old files IF THEY EXIST
    if(req.file){
        try { 
            if (fs.existsSync('./public/resources/uploads/'+ req.session.job_id)) {
                filename = req.file.filename
                if(filename.startsWith(`${req.session.candidate_id}_Q${req.params.id}-`)){
                    const dir = fs.opendirSync('./public/resources/uploads/'+ req.session.job_id)
                    let dirent
                    while ((dirent = dir.readSync()) !== null) {
                        if(dirent.name.startsWith(`${req.session.candidate_id}_Q${req.params.id}`) && dirent.name!==filename){ //verifying if file belongs to the current question and current candidate
                            console.log("Deleting file");
                            fs.unlinkSync(`./public/resources/uploads/${dirent.name}`)
                        }
                    }
                    dir.closeSync()
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    // IF the user did not upload a file
    else filename = ""
    
    //Disallow submission of empty answers
    if(answer===''){
        const context = {
            title: 'Questions',  
            id : req.params.id, 
            question: req.session.jobDescription['questions'][req.params.id-1], 
            questionLength: req.session.jobDescription['questions'].length, 
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
        if(Number(req.params.id) === Number(req.session.jobDescription['questions'].length)){ //if the user is on the last question
            var flag = 0;

            //check if the user has answered all the questions
            for(var question in req.session.questions){
                if(req.session.questions[question]===undefined){
                    flag = 1;
                    break;
                }
            }
            if(flag===1){
                //if the user has not answered all the questions, redirect to the question that has not been answered
                const context = {
                    title: 'Questions',  
                    id : req.params.id, 
                    question: req.session.jobDescription['questions'][req.params.id-1], 
                    questionLength: req.session.jobDescription['questions'].length, 
                    candidate_id: candidateId, 
                    jobId, 
                    jobName ,
                    message: `<i class="fa fa-exclamation-circle"></i> Please fill all Answer fields`,
                    value: '',
                    filename
                }
                res.render('questions', context);
            }

            //if the user has answered all the questions, Save the answers to the database and redirect to the status page
            else{
                // Creating a candidate table in the database
                await sequelize.query("DROP TABLE IF EXISTS `"+candidateId+"_"+jobId+"`;");
                var response = queryInterface.createTable(candidateId+"_"+jobId, {
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
                    // Inserting the answers to the Candidate database
                    for(var i=1; i<=req.session.jobDescription['questions'].length; i++){

                        // retrieve the file data for the question 'i' IF IT EXISTS and belongs to the current candidate
                        let data = null
                        let filename = null
                        try {  
                            if (fs.existsSync('./public/resources/uploads/'+ req.session.job_id)) {
                                const dir = fs.opendirSync('./public/resources/uploads/'+ req.session.job_id)
                                let dirent
                                while ((dirent = dir.readSync()) !== null) {
                                    if(dirent.name.startsWith(`${req.session.candidate_id}_Q${i}-`)){ //verifying if file belongs to the current question and current candidate
                                        data = fs.readFileSync(
                                            process.cwd() + `/public/resources/uploads/${req.session.job_id}/${dirent.name}`,
                                        )
                                        filename = dirent.name
                                    }
                                }
                                dir.closeSync()
                            }
                        } catch (err) {
                            console.error(err);
                            res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                        }
                          
                        
                        // Inserting the answer for the question 'i' to the database
                        var insertResult = await sequelize.query('INSERT INTO `' + candidateId+"_"+jobId + '` VALUES ( $serialNumber, $question, $answer, $filename, $filedata )', 
                            {
                                bind: {
                                    serialNumber: i,
                                    question: req.session.questions[`question${i}`],
                                    answer: req.session.answers[`answer${i}`],
                                    filename: filename,
                                    filedata: data
                                },
                                raw: true, 
                                type: QueryTypes.INSERT
                            }
                        );
                    }

                    // change the status of the candidate to 'Applied'
                    const applicant = await Applicant.findOne({ where: { candidateID: candidateId, jobID: jobId, status: 'Applying' } });
                    var updateResult = applicant.update({
                        status: 'Applied',
                        appliedOn: new Date()
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                        return;
                    });

                    // redirect to the status page
                    console.log("Applicant updated");
                    res.redirect('/status');
                })
                .catch(err => {
                    console.log(err);
                    res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                    return;
                });          
            }
        }   
         
        //if the user is not on the last question, redirect to the next question
        else
            res.redirect(`/questions/${parseInt(req.params.id)+1}?candidateId=${candidateId}&jobId=${jobId}&jobName=${jobName}`);
    }   
}

deleteQuestionFiles = (req, res) => {
    // save answer to the session
    req.session.answers[`answer${req.params.id}`] = req.body.answer;

    //cycle through the files in the uploads folder
    try{
        if (fs.existsSync('./public/resources/uploads/'+ req.session.job_id)) {
            const dir = fs.opendirSync('./public/resources/uploads/' + req.session.job_id)
            let dirent
            var found = false //flag to check if the file has been found
            while ((dirent = dir.readSync()) !== null) {
                if(dirent.name === req.body.file){
                    found = true
                    fs.unlinkSync(`./public/resources/uploads/${req.session.job_id}/${dirent.name}`)
                }
            }
            dir.closeSync()
        }
    } catch (err) {
        console.error(err);
    }   
    
    console.log("Deleting uploaded file...");
    res.json({message: "File deleted", found});
}

module.exports = {
    getQuestions,
    postQuestions,
    deleteQuestionFiles
}