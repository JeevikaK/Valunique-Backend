const express = require('express');
const morgan = require('morgan');
var session = require('express-session');
const readXlsxFile = require('read-excel-file/node')
const sequelize = require('./db/db.init.js');
const Applicant = require('./models/applicants.js');
const app = express();

app.set('view engine', 'ejs');

// middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(session({ 
    secret: '0dc529ba-5051-4cd6-8b67-c9a901bb8bdf',
    resave: false,
    saveUninitialized: false 
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


// routes
app.get('/', (req, res) => {
    res.render('login', {title: 'Login', message: ""});
});

app.post('/', async (req, res) => {
    const { candidate_id, job_id } = req.body;
    const format_candidate_id = /^[0-9]+$/;
    const format_job_id = /^[A-Z0-9]+$/;
    if(candidate_id.length==8 && job_id.length == 8 && format_candidate_id.test(candidate_id) && format_job_id.test(job_id)){
        console.log("Format Valid");
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
            })
            .catch(err => {
                console.log(err);
                res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                return
            });
        }
        else{
            applicant.update({
                appliedOn: new Date(),
            })
        }
        console.log(applicant);
        const filepath = __dirname + '/job_questions/' + job_id + '.xlsx';
        readXlsxFile(filepath).then(rows => { 
            mandatorySkills = {};
            console.log(rows);
            const job_name = rows[0][0];
            rows = rows.slice(2);

            function collectSkill(rowIndex){
                var type = `skill${rowIndex}`;
                console.log(type);
                var skills=[]
                rows.forEach(row => {
                    if(row[rowIndex]!==null)
                        skills.push(row[rowIndex]);
                mandatorySkills[type] = skills;
                });
            }
            for(var i=1; i<rows[0].length; i++){
                collectSkill(i);
            }
            console.log(mandatorySkills, rows[0].length);
            res.render('details', {title: 'Details', mandatorySkills, job_name, candidate_id});
        }).catch((err) => {
            console.log(err);
            res.render('login', {title: 'Login', message: "Either the job id doesn't exist<br> or the required file is not attached for the job id.<br> Please check with the admin"});
        })
    } 
    else{
        var message = 'Incorrect format for Candidate ID or Job ID';
        res.render('login', {title: 'Login', message});
    }
}); 

app.get('/questions/:id', (req, res) => {
    res.render('questions', {title: 'Questions',  id : req.params.id});
}); 

// 404 page
app.use((req, res) => {
    res.status(404).render('error', { title: '404', message: 'Page not found' });
});

