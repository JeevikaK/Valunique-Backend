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
skills.forEach(skill => {

})
const location = document.getElementById('location')
const relocate = document.querySelector('input[name="relocate"]:checked')

whyVolvo.addEventListener("input", event => {
    if(whyVolvo.validity.valid){
        document.getElementById('error_whyVolvo').innerHTML=''
    }
    else{
        showError();
    }
})

form.addEventListener('submit', (event) => {

    if(!q1.validity.valid){
        showError();
        event.preventDefault();
    }

    function showError(){
        if(q1.validity.valueMissing){
            document.getElementById('error_whyVolvo').innerHTML = '<i class="fa fa-exclamation-circle"></i> Please fill this field.'
        }
        else if(q1.validity.tooLong){
            document.getElementById('error_whyVolvo').innerHTML = '<i class="fa fa-exclamation-circle"></i> Answer should have a maximum of 400 characters'
        }
    }
})