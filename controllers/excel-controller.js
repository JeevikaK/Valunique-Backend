const readXlsxFile = require('read-excel-file/node')

exports.readXlFile = async(res, job_id) => {
    var xlData = {};
    const filepath = process.cwd() + '/job_questions/' + job_id + '.xlsx';
    const data = await readXlsxFile(filepath).then(rows => { 
        mandatorySkills = {};

        const job_name = rows[0][0];
        rows = rows.slice(2);

        function collectSkill(rowIndex){
            var type = `skill${rowIndex}`;
            var skills=[]
            rows.forEach(row => {
                if(row[rowIndex]!==null)
                    skills.push(row[rowIndex]);
            mandatorySkills[type] = skills;
            });
        }
        for(var i=1; i<rows[0].length; i++){
            collectSkill(i);
        }
        var questions = []
        rows.forEach(row => {
            if(row[0]!==null)
                questions.push(row[0]);
        });
        xlData['jobName'] = job_name;
        xlData['questions'] = questions;
        xlData['mandatorySkills'] = mandatorySkills;
        return xlData;
    })

    return data;
}