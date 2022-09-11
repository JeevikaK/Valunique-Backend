const multer = require('multer');

var maxSize = 9000000; // 9MB
var storage = multer.diskStorage({  
    destination: function (req, file, cb) {  // Destination to store uploaded files
        cb(null, process.cwd() +'/public/resources/uploads/');
    },
    filename: function (req, file, cb) {  //name of uploaded file
        cb(null, `${req.session.candidate_id}_Q${req.params.id}-${file.originalname}`);
    },
});


function uploadFile(req, res, next){
    const { candidateId, jobId, jobName } = req.query;
    const { answer } = req.body;
    console.log(req.body);


    const upload = multer({ storage: storage, limits: {fileSize: maxSize} }).single('myfile')
    upload(req, res, function (err) {
        if (err) {
            console.log(req.body);
            req.session.answers[`answer${req.params.id}`] = req.body.answer;
            // if file size is larger than 9MB
            if (err instanceof multer.MulterError){
                var message = `<i class="fa fa-exclamation-circle"></i> File size is too big.`;
            }

            //if any other error occurs
            else
                var message = `<i class="fa fa-exclamation-circle"></i> Error uploading file.`;

            const context = {
                title: 'Questions',  
                id : req.params.id, 
                question: req.session.xlData['questions'][req.params.id-1], 
                questionLength: req.session.xlData['questions'].length, 
                candidate_id: candidateId, 
                jobId, 
                jobName ,
                message,
                value: answer,
                filename: ""
            }
            res.render('questions', context);
            return
        }

        // if file is uploaded successfully
        else
            next();       
    })
}
            
module.exports = uploadFile;