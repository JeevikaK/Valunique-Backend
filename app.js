const express = require('express');
const morgan = require('morgan');
const cookieParser = require("cookie-parser");
var session = require('express-session');
const sequelize = require('./db/db.init.js');
const Applicant = require('./models/applicants.js');
const readXlsxFile = require('read-excel-file/node')
const xlcontroller = require('./controllers/excel-controller.js');
const app = express();

app.set('view engine', 'ejs');

// middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// cookie parser middleware
app.use(cookieParser());

// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

app.use(session({ 
    secret: '0dc529ba-5051-4cd6-8b67-c9a901bb8bdf',
    resave: false,
    saveUninitialized:true,
    cookie: { maxAge: oneDay }, 
}));

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
    sequelize.sync({force: true}).then(() => {
        console.log('Drop and Resync with { force: true }');
    }); 
    server = app.listen(3000, () => {
        const host = server.address().address;
        const port = server.address().port;
        console.log(`Server is listening at port ${port}`);
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});


function addDays(date, days) {
    var result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
}

// routes
app.get('/', (req, res) => {
    var date = new Date();
    console.log(date, "today");
    var tom = addDays(date, 0);
    if(tom > date){
        console.log("tom is greater than date");
    }
    console.log(tom, "tom_form");
    res.render('login', {title: 'Login', message: ""});
});

app.post('/', async (req, res) => {
   
    const { candidate_id, job_id } = req.body;
    const format_candidate_id = /^[0-9]+$/;
    const format_job_id = /^[A-Z0-9]+$/;
    if(candidate_id.length==8 && job_id.length == 8 && format_candidate_id.test(candidate_id) && format_job_id.test(job_id)){
        console.log("Format Valid");
    
        xlcontroller.readXlFile(res, job_id).then( async (xlData) =>{
            console.log("xlData read ");
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
                req.session.questions = {}
                req.session.answers = {}
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
}); 

app.get('/details', async (req, res) => {
    const { candidateId, jobId, jobName } = req.query;
    const applicant = await Applicant.findOne({ where: { candidateID: candidateId, jobID: jobId, status: 'Applying' } });
    if(applicant===null){
        res.redirect('/');
    }
    else{
        xlcontroller.readXlFile(res, jobId).then( xlData =>{
            res.render('details', {title: 'Details', mandatorySkills: xlData['mandatorySkills'], jobName, candidate_id: candidateId, message: ""});
        })
        .catch((err) => {
            console.log(err);
            res.render('login', {title: 'Login', message:`<i class="fa fa-exclamation-circle"></i> Either the job id doesn't exist<br> or the required file is not attached for the job id.<br> Please check with the admin`});
        })
    }
});

app.post('/details', async (req, res) => {
    const { q1, q2, location, relocate } = req.body
    console.log(req.body);
    const { candidateId, jobId, jobName } = req.query;
    var skill_keys = Object.keys(req.body).filter(key => key.startsWith('skill'))
    var add_skill_keys = Object.keys(req.body).filter(key => key.startsWith('add_skill'))
    var skills =''
    var add_skills=''
    skill_keys.forEach(skill => {
        skills+= req.body[skill]+', '
    })
    add_skill_keys.forEach(add_skill =>{
        add_skills+= req.body[add_skill]+', '
    })
    console.log(skills.slice(0, -2), add_skills.slice(0, -2))
    var applicant = await Applicant.findOne({ where: { candidateID: candidateId, jobID: jobId, status: 'Applying' }});
    xlcontroller.readXlFile(res, jobId).then( xlData =>{
        if(q1=='' || q2=='' || location=='' || relocate==''|| skills=='' ){
            res.render('details', {title: 'Details', mandatorySkills: xlData['mandatorySkills'], jobName, candidate_id: candidateId, message: `<i class="fa fa-exclamation-circle"></i> Please fill all the fields`});
        }
        else{
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
    })
    .catch((err) => {
        console.log(err);
        res.render('login', {title: 'Login', message:`<i class="fa fa-exclamation-circle"></i> Either the job id doesn't exist<br> or the required file is not attached for the job id.<br> Please check with the admin`});
    })
});

app.get('/questions/:id', async (req, res) => {
    const { candidateId, jobId, jobName } = req.query;
    const applicant = await Applicant.findOne({ where: { candidateID: candidateId, jobID: jobId, status: 'Applying' } });
    if(applicant===null){
        res.redirect('/');
    }
    else{
        xlcontroller.readXlFile(res, jobId).then( xlData =>{
            const context = {title: 'Questions',  
                id : req.params.id, 
                question: xlData['questions'][req.params.id-1], 
                questionLength: xlData['questions'].length, 
                candidate_id: candidateId, 
                jobId, 
                jobName ,
                message: ""
            }
            res.render('questions', context);
        })
        .catch((err) => {
            console.log(err);
            res.render('login', {title: 'Login', message:`<i class="fa fa-exclamation-circle"></i> Either the job id doesn't exist<br> or the required file is not attached for the job id.<br> Please check with the admin`});
        })
    }  
}); 

app.post('/questions/:id', async (req, res) => {
    
})

// 404 page
app.use((req, res) => {
    res.status(404).render('error', { title: '404', message: 'Page not found' });
});

