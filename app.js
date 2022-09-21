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
const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const { QueryTypes } = require('sequelize');
const app = express();

const zip = require('express-zip');
const Admin = require('./models/admin.js');
const JobOpening = require('./models/jobOpening.js');
const Applicant = require('./models/applicants.js');
const ValidCandidateID = require('./models/candidate_id.js');
const fs = require('fs')
const { createPDF, createFolder, deleteFolder } = require('./controllers/FileController.js');
const AdmZip = require('adm-zip');




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

    Admin.hasMany(JobOpening);
    JobOpening.belongsTo(Admin, {foreignKey: 'adminID'}, {onDelete: 'No Action'});
    
    JobOpening.belongsToMany(Admin, {through: 'RecruiterJobOpening'});
    Admin.belongsToMany(JobOpening, {through: 'RecruiterJobOpening'});

    Applicant.sync({ force: false }).then(() => {
        console.log('Drop and Resync with { force: false }');
    }); 
    Admin.sync({ force: true }).then(async () => {
        await Admin.bulkCreate([{name: "Owais", email: "owaisiqbal2013@gmail.com", access: "HR"},
                    {name: "Jeevika", email: "jeevika.kiran@gmail.com", access: "Hiring Manager"},
                    {name: "Ayaan", email: "ayaan.ali@6362185244@gmail.com", access: "Recruiter"}
        ]).then(() => console.log('Drop and Resync with { force: true }'));
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
app.get('/admin', async (req, res) => {
    const {adminEmail, adminName} = req.query; 
    const admin = await Admin.findOne({where: {email: adminEmail, name: adminName}});
    if(admin === null){
        res.redirect('/');
        return
    }
    req.session.admin = admin;
    const jobs = await Applicant.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('jobID')), 'jobID'], 
            'jobName'
        ],
        order: [['jobID', 'ASC']]
    });
    const applicants = await Applicant.findAll({where: {
        status: {
            [Op.not]:"Applying"
        }
    }, 
        order: [['jobID', 'ASC']]
    });
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

app.post('/admin', async (req, res) => {
    const {status, applicant_id} = req.body
    console.log(status, applicant_id)
    var applicant = await Applicant.findByPk(applicant_id);
    console.log(applicant)
    const update_status = await applicant.update({status: status})
    .catch(err => {
        console.log(err, 123);
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
        return;
    });
    res.json({status})
    return;
});

app.get('/admin/access', async (req, res) => {
    if(req.session.admin === undefined){
        res.redirect('/');
        return
    }
    const adminEmail = req.session.admin.email;
    const adminName = req.session.admin.name;
    const access_levels = await Admin.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col('access')), 'access'], 
        ],
        order: [['access', 'ASC']]
    });
    const admins = await Admin.findAll({order: [['access', 'ASC']]});
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

app.post('/admin/access', async (req, res) => {
    if(req.session.admin === undefined){
        res.redirect('/');
        return
    }
    const {name, email, access} = req.body;
    console.log(name, email, access)
    if(name === "" || email === "" || access === ""){
        res.send("Please fill all the fields");
    }
    await Admin.create({name, email, access})
    .catch(err => {
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
        console.log(err)
    });
    res.redirect('/admin/access');
})

app.delete('/admin/access/revokeAccess', async (req, res) =>{
    const {name, email, access} = req.body
    const admin = await Admin.findOne({where: {name: name, email: email, access: access}})
    await admin.destroy()
    .catch((err) => {
        console.log(err)
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
    })
    var same_user = false
    if(admin.adminID===req.session.admin.adminID){
        console.log('true')
        req.session.destroy()
        same_user = true
    }
    res.json({message: 'Success', same_user})
})

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
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
    }
    await createPDF(applicant);
    files.push({path: process.cwd() +`/public/resources/downloads/${applicant.jobID}/${applicant.candidateID}/${applicant.candidateID}_${applicant.jobID}.pdf`, name: `${applicant.candidateID}_${applicant.jobID}.pdf`})

    res.zip(files, `${applicant.candidateID}_${applicant.jobID}.zip` , (err) => {
        if(err){
            console.log(err)
        } else{
            const dir = fs.opendirSync('./public/resources/downloads/'+ applicant.jobID);
            let dirent
            while ((dirent = dir.readSync()) !== null) {
                if(dirent.name.startsWith(`${applicant.candidateID}_`))
                    fs.unlinkSync(`./public/resources/downloads/${applicant.jobID}/${dirent.name}`)
                else if(dirent.name.startsWith(`${applicant.candidateID}`)){
                    deleteFolder(`./public/resources/downloads/${applicant.jobID}/${dirent.name}`)
                }
            }
            dir.closeSync()
            console.log("Downloaded")
        }
    }) 
})

app.get('/admin/downloadAll/:jobID/:ids', async (req, res) => {
    const zip = new AdmZip();
    const ids = req.params.ids.split(',');
    const jobID = req.params.jobID;
    const applicants = await Applicant.findAll({
        where: {
          id: { [Op.in]: ids },
        },
    });
    try{
        if (!fs.existsSync(process.cwd() +'/public/resources/downloads/'+jobID)) {
            fs.mkdirSync(process.cwd() +'/public/resources/downloads/'+jobID);
        }
    }
    catch(err){
        console.log(err)
        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
    }
    const getFolders = async () => {
        for(var i=0; i<applicants.length; i++){
            await createFolder(applicants[i]);
            console.log("created folder for "+applicants[i].candidateID)
            if(i === applicants.length-1){
                return true;
            }
        }
        return true;
    }
    getFolders().then((result) => {
        if(result){
            setTimeout(() => {
                zip.addLocalFolder("./public/resources/downloads/"+jobID )
                zip.writeZip("./public/resources/downloadAll/"+jobID+".zip");
                res.download("./public/resources/downloadAll/"+jobID+".zip", jobID+".zip", (err) => {
                    if(err){
                        console.log(err)
                        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                    } else{
                        deleteFolder( process.cwd() + `/public/resources/downloads/${jobID}`);
                        fs.unlinkSync(process.cwd() + `/public/resources/downloadAll/${jobID}.zip`);
                        console.log("Downloaded")
                    }
                })
            }, 200)
        }
        else{
            console.log("Error")
        }
    })
})

app.get('/admin/job_questions', async (req, res) => {
    if(req.session.admin === undefined){
        res.redirect('/');
        return
    }
    res.render('admin_openings', {title: 'Job Openings', admin: req.session.admin})
})

app.get('/admin/new_questions', async (req, res) => {
    if(req.session.admin === undefined){
        res.redirect('/');
        return
    }
    res.render('new_question', {title: 'New Questions', admin:req.session.admin})
})
// /admin?adminEmail=owaisiqbal2013@gmail.com&adminName=Owais

app.get('/logout', logoutController);

// 404 page
app.use((req, res) => {
    res.status(404).render('error', { title: '404', message: 'Page not found' });
});