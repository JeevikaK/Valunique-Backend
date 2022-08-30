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
app.get('/', (req, res) => {
    res.render('login', {title: 'Login'});
}); 
app.get('/details', (req, res) => {
    res.render('details', {title: 'Details'});
}); 
app.get('/questions', (req, res) => {
    res.render('questions', {title: 'Questions'});
}); 