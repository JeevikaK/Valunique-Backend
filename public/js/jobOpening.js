//NO CONTENT
const openings = document.querySelectorAll('.job_openings')[0]
console.log(openings.children.length)
if(openings.children.length === 0){
    const no_applications = document.querySelector('.no_applications');
    no_applications.style.display = 'flex';
}

//DELETE MODAL
const deleteAccess = document.getElementById('deleteQuestionaire');
deleteAccess.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget
    const jobID = button.getAttribute('data-bs-jobID')
    const modalBody = deleteAccess.querySelector('.modal-body p')
    modalBody.innerHTML = `Are you sure you want to remove the questionaire for <span style="color: red; font-weight: 600;">${jobID}</span> Job?`;
})

//ADD MODAL
const addQuest = document.getElementById('addQuestionaire');
addQuest.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget
    const jobID = button.getAttribute('data-bs-jobID')
    const modaljobID = addQuest.querySelector('.modal-body jobID')
})

//adding no of recruits
function showRecruiterNum(event){
    console.log(event.target.value)
    if(String(event.target.value) === 'yes'){
        console.log('entered')
        console.log(document.querySelector('.recruiterNum').value)
        document.querySelector('.recruiterNum').disabled=false;
    } else {
        document.querySelector('.recruiterNum').disabled=true;
        document.querySelector('.recruiterNum').value = 0;
    }
}

//form validation
const form = document.querySelector('form')
const jobID = document.getElementById('jobID')
const jobID_error = document.querySelector('.jobID_error')
console.log(jobID_error)

const job_questions = document.querySelectorAll('.job_questions')

function checkExists(){
    job_questions.forEach(question => {
        if(question.id === jobID.value){
            return true;
        }
    })
    return false;
}


function showError(event){
    const format_jobID = /^[A-Z0-9]+$/;
    if(format_jobID.test(jobID.value) === false || jobID.value.length != 8){
        if(event)
            event.preventDefault();
        jobID_error.innerHTML = '<i class="fa fa-exclamation-circle"></i> Invalid format. Job ID should be alphanumeric and have 8 characters.'
    }
    else if(checkExists()){
        jobID_error.innerHTML = '<i class="fa fa-exclamation-circle"></i> Job Opening already exists.'
    }
    else{
        jobID_error.innerHTML = ''
    }
}

form.addEventListener('submit', event => {
    showError(event); 
    jobID.addEventListener('input', event => {
        showError(false);
    })
})


