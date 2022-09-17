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
const getStatus = require('./controllers/statusController.js');
const Sequelize = require("sequelize");
const { QueryTypes } = require('sequelize');
const app = express();

const Admin = require('./models/admin.js');
const Applicant = require('./models/applicants.js');
const ValidCandidateID = require('./models/candidate_id.js');
const zip = require("express-zip");
const fs = require('fs')



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
app.get('/status', getStatus);


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
    const jobs = await Applicant.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('jobID')), 'jobID'], 
            'jobName'
        ],
        order: [['jobID', 'ASC']]
    });
    console.log(jobs)
    const applicants = await Applicant.findAll({where: {status: "Applied"}, order: [['jobID', 'ASC']]});
    console.log(applicants)
    const context = {
        title: 'Admin', 
        applicants, 
        jobs,
        adminName: admin.name, 
        adminEmail: admin.email, 
        adminAccess: admin.access, 
        type: "applicants"
    }
    res.render('admin', context);
});

app.get('/admin/access', async (req, res) => {
    if(req.session.admin === undefined){
        res.redirect('/');
        return
    }
    const adminEmail = req.session.admin.email;
    const adminName = req.session.admin.name;
    console.log(adminEmail, adminName)
    const access_levels = await Admin.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('access')), 'access'], 
        ],
        order: [['access', 'ASC']]
    });
    console.log(access_levels)
    const admins = await Admin.findAll({order: [['access', 'ASC']]});
    console.log(admins)
    const context = {
        title: 'Admin', 
        admins, 
        access_levels,
        adminName: adminName, 
        adminEmail: adminEmail, 
        adminAccess: req.session.admin.access,
        type: "access"
    }
    res.render('admin', context);
});

app.get('/admin/download/:applicant_id', async (req, res) => {
    const applicant_id = req.params.applicant_id;
    console.log(applicant_id)
    const applicant = await Applicant.findByPk(applicant_id);
    var fileQuestions = await sequelize.query("SELECT * FROM `"+applicant.candidateID+"_"+applicant.jobID+"` WHERE `filename` IS NOT NULL", { type: QueryTypes.SELECT });
    var files=[];
    try{
        fileQuestions.forEach(async (file) => {
            if (!fs.existsSync(process.cwd() +'/public/resources/downloads/'+applicant.jobID)) {
                fs.mkdirSync(process.cwd() +'/public/resources/downloads/'+applicant.jobID);
            }
            fs.writeFileSync(process.cwd()+`/public/resources/downloads/${applicant.jobID}/${file.filename}`, file.filedata)
            files.push({path: process.cwd()+`/public/resources/downloads/${applicant.jobID}/${file.filename}`, name: file.filename})
        });
    }
    catch(err){
        console.log(err)
    }
    req.session.downloadFiles = files;
    res.json({
        download_link: `/download/${applicant.candidateID}_${applicant.jobID}`,
    });
})


// /admin/1?adminEmail=owaisiqbal2013@gmail.com&adminName=Owais

app.get('/download/:filename', (req, res) => {
    const files = req.session.downloadFiles;
    res.zip(files, `${req.params.filename}.zip` , (err) => {
        if(err){
            console.log(err)
        } else{
            const dir = fs.opendirSync('./public/resources/downloads/'+ req.params.filename.split('_')[1]);
            let dirent
            while ((dirent = dir.readSync()) !== null) {
                if(dirent.name.startsWith(`${req.params.filename.split('_')[0]}`))
                    fs.unlinkSync(`./public/resources/downloads/${req.params.filename.split('_')[1]}/${dirent.name}`)
            }
            dir.closeSync()
            console.log("Downloaded")
        }
    })
    
})

app.get('/logout', logoutController);

// 404 page
app.use((req, res) => {
    res.status(404).render('error', { title: '404', message: 'Page not found' });
});