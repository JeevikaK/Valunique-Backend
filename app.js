const express = require('express');
const morgan = require('morgan');
const cookieParser = require("cookie-parser");
const session = require('express-session');
const sequelize = require('./db/db.init.js');
const upload = require('./middleware/upload-middleware.js');
const loginController = require('./controllers/applicantControllers/loginController.js');
const detailsController = require('./controllers/applicantControllers/detailsController.js');
const questionsController = require('./controllers/applicantControllers/questionsController.js');
const logoutController = require('./controllers/applicantControllers/logoutController.js');
const getStatus = require('./controllers/applicantControllers/statusController.js');
const applicationsController = require('./controllers/adminControllers/applicationsController.js');
const accessController = require('./controllers/adminControllers/accessController.js');
const jobOpeningController = require('./controllers/adminControllers/jobOpeningsController.js');
const app = express();
const Admin = require('./models/admin.js');
const JobOpening = require('./models/jobOpening.js');
const Applicant = require('./models/applicants.js');
const ValidCandidateID = require('./models/candidate_id.js');
const RecruiterJobOpening = require('./models/RecruiterJobOpening.js');

app.set('view engine', 'ejs');

// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

// middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(session({ 
    secret: '0dc529ba-5051-4cd6-8b67-c9a901bb8bdf',
    resave: false,
    saveUninitialized:true,
    cookie: { maxAge: oneDay }, 
}));


//listening to port 3000 only if db is connected
sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');

    
    JobOpening.belongsTo(Admin, {onDelete: 'No Action'});
    Admin.hasMany(JobOpening, {onDelete: 'No Action'} );
    
    JobOpening.belongsToMany(Admin, {as: 'recruiters', through: RecruiterJobOpening});
    Admin.belongsToMany(JobOpening, {as: 'jobs', through: RecruiterJobOpening});
 
    Applicant.sync({ force: false }).then(() => {
        console.log('Drop and Resync with { force: false }');
    }); 
    Admin.sync({ force: false }).then(async () => {
        console.log('Drop and Resync with { force: false }');
    })
    ValidCandidateID.sync({ force: true }).then(async () => {
        await ValidCandidateID.bulkCreate([
            { candidateID: "12345678" },
            { candidateID: "12345679" },
            { candidateID: "12345677" },
            { candidateID: "12345676" },
            { candidateID: "12345675" },
        ]).then(() => console.log("Candidate ID data has been saved"));
    });
    JobOpening.sync({ force: false }).then(async () => {
        console.log('Drop and Resync with { force: false }');    
        RecruiterJobOpening.sync({ force: false }).then(async () => {
            console.log('Drop and Resync with { force: false }');
        });    
    })

    server = app.listen(3000, () => {
        const host = server.address().address;
        const port = server.address().port;
        console.log(`Server is listening at port ${port}`);
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});


// applicant routes
app.get('/', loginController.getLogin);
app.post('/', loginController.postLogin); 
app.get('/details', detailsController.getDetails);
app.post('/details', detailsController.postDetails);
app.get('/questions/:id', questionsController.getQuestions); 
app.post('/questions/:id', upload, questionsController.postQuestions);
app.delete('/questions/:id', questionsController.deleteQuestionFiles);
app.get('/status', getStatus);


// admin routes
app.get('/admin', applicationsController.getApplications);
app.post('/admin', applicationsController.updateStatus);
app.get('/admin/access', accessController.getAccessLevels);
app.post('/admin/access', accessController.addAccessLevel)
app.delete('/admin/access/revokeAccess', accessController.deleteAccessLevel)
app.get('/admin/access/getjobs/:adminID', accessController.checkJobOwner)
app.get('/admin/download/:applicant_id', applicationsController.downloadSingleApplication)
app.get('/admin/downloadAll/:jobID/:ids', applicationsController.downloadAllApplications)
app.get('/admin/jobOpenings', jobOpeningController.getJobOpenings);
app.get('/admin/jobOpenings/:jobID/edit', jobOpeningController.editJobOpening);
app.post('/admin/jobOpenings', jobOpeningController.addJobOpening)
app.get(`/admin/jobOpenings/:jobID/checkExists`, jobOpeningController.checkJobExists)
app.post('/admin/jobQuestions/:jobID', jobOpeningController.addJobQuestions)
app.delete('/admin/jobOpenings/:jobID/delete', jobOpeningController.deleteJobOpening)

// /admin?adminEmail=owaisiqbal2013@gmail.com&adminName=Owais

// logout route
app.get('/logout', logoutController);

// 404 page
app.use((req, res) => {
    res.status(404).render('error', { title: '404', message: 'Page not found' });
});