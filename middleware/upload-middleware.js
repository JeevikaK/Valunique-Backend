const multer = require('multer');

var maxSize = 9000000;
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.cwd() +'/public/resources/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${req.session.candidate_id}_Q${req.params.id}-${file.originalname}`);
    },
});

function uploadFile(req, res, next){
    const { candidateId, jobId, jobName } = req.query;
    const { answer } = req.body;
    console.log(req.body);
    const upload = multer({ storage: storage, limits: {fileSize: maxSize} }).single('myfile')
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            const context = {
                title: 'Questions',  
                id : req.params.id, 
                question: req.session.xlData['questions'][req.params.id-1], 
                questionLength: req.session.xlData['questions'].length, 
                candidate_id: candidateId, 
                jobId, 
                jobName ,
                message: `<i class="fa fa-exclamation-circle"></i> File size is too big.`,
                value: answer,
            }
            res.render('questions', context);
            return
        } else if (err) {
            console.log(err);
            res.status(500).render('error', {title: '500', message: "Internal Server Error"});
            return
        }
        else
            next();       
    })
}

module.exports = uploadFile;