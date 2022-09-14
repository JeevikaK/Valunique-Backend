const express = require('express');
const morgan = require('morgan');
const cookieParser = require("cookie-parser");
const session = require('express-session');
const sequelize = require('./db/db.init.js');
const upload = require('./middleware/upload-middleware.js');
const loginController = require('./controllers/loginController.js');
const detailsController = require('./controllers/detailsController.js');
const questionsController = require('./controllers/questionsController.js');
const logoutController = require('./controllers/logoutController.js');
const Sequelize = require("sequelize");
const app = express();

const Admin = require('./models/admin.js');
const Applicant = require('./models/applicants.js');
const ValidCandidateID = require('./models/candidate_id.js');


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
    Applicant.sync({ force: false }).then(() => {
        console.log('Drop and Resync with { force: true }');
    }); 
    Admin.sync({ force: true }).then(async () => {
        await Admin.bulkCreate([{name: "Owais", email: "owaisiqbal2013@gmail.com", access: "HR"},
                    {name: "Jeevika", email: "jeevika.kiran@gmail.com", access: "Hiring Manager"},
                    {name: "Ayaan", email: "ayaan.ali@6362185244@gmail.com", access: "Recruiter"}])
    });
    ValidCandidateID.sync({ force: true }).then(async () => {
        await ValidCandidateID.bulkCreate([
            { candidateID: "12345678" },
            { candidateID: "12345679" },
            { candidateID: "12345677" },
            { candidateID: "12345676" },
          ]).then(() => console.log("Candidate ID data has been saved"));
    });

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


// admin routes
app.get('/admin', async (req, res) => {
    const {adminEmail, adminName} = req.query; 
    console.log(adminEmail, adminName)
    const admin = await Admin.findOne({where: {email: adminEmail}});
    if(admin === null){
        res.redirect('/');
        return
    }
    console.log(admin)
    req.session.admin = admin;
    var applicants = []
    const jobIDs = await Applicant.findAll({
        attributes: [Sequelize.fn('DISTINCT', Sequelize.col('jobID')), 'jobID'],
    });
    for(var i = 0; i < jobIDs.length; i++){
        console.log(jobIDs[i].dataValues.jobID)
        applicantsPerJobID = await Applicant.findAll({where: {jobID: jobIDs[i].dataValues.jobID}});
        console.log(applicantsPerJobID)
        applicants.push(applicantsPerJobID);
    }
    res.render('admin', {title: 'Admin', applicants, jobIDs ,adminName: admin.name, adminEmail: admin.email, adminAccess: admin.access});
});

// /admin?adminEmail=owaisiqbal2013@gmail.com&adminName=OwaisIqbal

app.get('/logout', logoutController);

// 404 page
app.use((req, res) => {
    res.status(404).render('error', { title: '404', message: 'Page not found' });
});