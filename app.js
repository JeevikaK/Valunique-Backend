const express = require('express');
const morgan = require('morgan');

const app = express();

app.listen(3000);
app.set('view engine', 'ejs');

// middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// routes
app.post('/', (req, res) => {
    const { candidate_id, job_id } = req.body;
    console.log(candidate_id, job_id);
    const format_candidate_id = /^[0-9]+$/;
    const format_job_id = /^[A-Z0-9]+$/;
    if(candidate_id.length==8 && job_id.length == 8 && format_candidate_id.test(candidate_id) && format_job_id.test(job_id))
        console.log(true);
    else
        var message = 'Incorrect format for Candidate ID or Job ID';
    res.render('login', {title: 'Login', message});
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