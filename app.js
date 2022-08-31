const express = require('express');
const morgan = require('morgan');
const readXlsxFile = require('read-excel-file/node')
const app = express();

app.set('view engine', 'ejs');

app.listen(3000);

// middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


// routes
app.get('/', (req, res) => {
    res.render('login', {title: 'Login', message: ""});
});

app.post('/', (req, res) => {
    const { candidate_id, job_id } = req.body;
    console.log(candidate_id, job_id);
    const format_candidate_id = /^[0-9]+$/;
    const format_job_id = /^[A-Z0-9]+$/;
    if(candidate_id.length==8 && job_id.length == 8 && format_candidate_id.test(candidate_id) && format_job_id.test(job_id)){
        console.log(true);
        const filepath = __dirname + '/job_questions/' + job_id + '.xlsx';
        readXlsxFile(filepath).then((rows) => {
            rows = rows.slice(1);
            rows.forEach(row => {
                if(row[0]!==null)
                    console.log(row[0]);
            });
            res.render('details', {title: 'Details'});
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

app.get('/details', (req, res) => {
    res.render('details', {title: 'Details'});
}); 

app.get('/questions/:id', (req, res) => {
    res.render('questions', {title: 'Questions',  id : req.params.id});
}); 

// 404 page
app.use((req, res) => {
    res.status(404).render('error', { title: '404' });
});

