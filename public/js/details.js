//additional skills
var add_new_skill = document.getElementById('add_skill');
var new_skills = document.getElementsByClassName('new_skills')[0];
var count = 0;
add_new_skill.addEventListener('click', function(){
    count++;
    var div = document.createElement('div');
    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'add_skill'+count;
    input.id = 'add_skill'+count;
    input.className = 'addit_skill';
    var img = document.createElement('img');
    img.src = '/images/dustbin.png';
    img.alt = 'delete';
    img.className = 'delete_skill';
    div.appendChild(input);
    div.appendChild(img);
    new_skills.appendChild(div);
    var delete_skill = document.getElementsByClassName('delete_skill');
    for(var i = 0; i < delete_skill.length; i++){
        delete_skill[i].addEventListener('click', function(){
            this.parentElement.remove();
        });
    }
});




//form validation
const form = document.querySelector('form')
const whyVolvo = document.getElementById('q1')
const aboutVolvo = document.getElementById('q2')
const skills = document.getElementsByClassName('skill')
const locate = document.getElementById('location')
const relocate = document.getElementsByName('relocate')

function showError(question){
    if(question.validity.valueMissing){
        if(question.id == 'q1')
            document.getElementById('error_whyVolvo').innerHTML = '<i class="fa fa-exclamation-circle"></i> Please fill this field.'
        else if(question.id == 'q2')
            document.getElementById('error_aboutVolvo').innerHTML = '<i class="fa fa-exclamation-circle"></i> Please fill this field.'
        else if(question.id == 'location')
            document.getElementById('error_location').innerHTML = '<i class="fa fa-exclamation-circle"></i> Please select a location.'
        else if(question.className == 'skill')
            document.getElementById('error_skill').innerHTML = '<i class="fa fa-exclamation-circle"></i> Please select a skill.'
    }
    else if(question.validity.tooLong){
        if(question.id == 'q1')
            document.getElementById('error_whyVolvo').innerHTML = '<i class="fa fa-exclamation-circle"></i> Answer should have a maximum of 400 characters'
        else if(question.id == 'q2')
            document.getElementById('error_aboutVolvo').innerHTML = '<i class="fa fa-exclamation-circle"></i> Answer should have a maximum of 400 characters'
    }
}

function indexQs(question){
    question.addEventListener("input", event => {
        if(question.validity.valid){
            if(question.id === 'q1')
                document.getElementById('error_whyVolvo').innerHTML='';
            else if(question.id === 'q2')
                document.getElementById('error_aboutVolvo').innerHTML='';
            else if(question.id === 'location')
                document.getElementById('error_location').innerHTML='';
            else if(question.className == 'skill')
                document.getElementById('error_skill').innerHTML = ''
        }
        else{
            showError(question);
            console.log(question)
        }
    })
}

indexQs(whyVolvo);
indexQs(aboutVolvo);
for(var i = 0; i < skills.length; i++){
    indexQs(skills[i]);
}
indexQs(locate);

relocate.forEach(option => {
    option.addEventListener('click', () => {
        document.getElementById('error_relocate').innerHTML = ''
    })
})

function relocateCheck(){
    if(!relocate[0].checked && !relocate[1].checked){
        document.getElementById('error_relocate').innerHTML = '<i class="fa fa-exclamation-circle"></i> Please select an option.'
        event.preventDefault();
    }
}

function formValidation(question){
    form.addEventListener('submit', (event) => {
        console.log('submitted')
        // relocateCheck();
        if(!question.validity.valid){
            showError(question);
            event.preventDefault();
        }
    })
}

formValidation(whyVolvo);
formValidation(aboutVolvo);
for(var i = 0; i < skills.length; i++){
    formValidation(skills[i]);
}
formValidation(locate);
