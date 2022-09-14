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
const app = express();

const Admin = require('./models/admin.js');

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
    sequelize.sync({ force: true }).then(() => {
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


// applicant routes
app.get('/', loginController.getLogin);
app.post('/', loginController.postLogin); 
app.get('/details', detailsController.getDetails);
app.post('/details', detailsController.postDetails);
app.get('/questions/:id', questionsController.getQuestions); 
app.post('/questions/:id', upload, questionsController.postQuestions);
app.delete('/questions/:id', questionsController.deleteQuestionFiles);
app.get('/logout', logoutController);

// admin routes
app.get('/admin', async (req, res) => {
    const insertResult = Admin.bulkCreate([{name: "Owais", email: "owaisiqbal2013@gmail.com", access: "HR"},
                    {name: "Jeevika", email: "jeevika.kiran@gmail.com", access: "Hiring Manager"},
                    {name: "Ayaan", email: "ayaan.ali@6362185244@gmail.com", access: "Recruiter"}])
                    .catch(err => {
                        console.log(err)
                        res.status(500).render('error', {title: '500', message: "Internal Server Error"});
                        return;
                    });
    const {adminEmail, adminName} = req.query; 
    console.log(adminEmail, adminName)
    const admin = await Admin.findOne({where: {email: adminEmail}});
    if(admin === null){
        res.redirect('/');
        return
    }
    console.log(admin)
    req.session.admin = admin;
    res.render('admin', {title: 'Admin', adminName: admin.name, adminEmail: admin.email, adminAccess: admin.access});
});

// /admin?adminEmail=owaisiqbal2013@gmail.com&adminName=OwaisIqbal


// 404 page
app.use((req, res) => {
    res.status(404).render('error', { title: '404', message: 'Page not found' });
});