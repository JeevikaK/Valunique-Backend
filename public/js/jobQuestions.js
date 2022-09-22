const form = document.querySelector('form')
const questionInput = document.querySelectorAll('.questionInput')
console.log(questionInput)
const recruiterInput = document.querySelectorAll('.recruiterInput')
const skillsInput = document.querySelectorAll('.skillsInput')


function showError(input){
    if(input.validity.valueMissing){
        if(input.classList.contains('questionInput'))
            document.getElementById('questionError').innerHTML = '<i class="fa fa-exclamation-circle"></i> Please fill all Questions.'
        if(input.classList.contains('skillsInput'))
            document.getElementById('skillError').innerHTML = '<i class="fa fa-exclamation-circle"></i> Please fill all Skill types.'
        if(input.classList.contains('recruiterInput'))
            document.getElementById('recruiterError').innerHTML = '<i class="fa fa-exclamation-circle"></i> Please fill all Recruiter fields.'
    }
}

form.addEventListener('submit', (event) => {
    console.log('submitted')
    questionInput.forEach(input => {
        if(!input.validity.valid){
            showError(input);
            event.preventDefault();
        }
    })
    recruiterInput.forEach(input => {
        if(!input.validity.valid){
            showError(input);
            event.preventDefault();
        }
    })
    skillsInput.forEach(input => {
        if(!input.validity.valid){
            showError(input);
            event.preventDefault();
        }
    })
})