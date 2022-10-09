//modals
const deleteAccess = document.getElementById('deleteAccess');
deleteAccess.addEventListener('show.bs.modal', event => {
    var form = document.querySelector('form')
    form.style.display = 'none';
    const options = document.querySelectorAll('form > select option')
    const newOwner = document.querySelector('form select')
    document.getElementById('ownership_error').innerHTML = ''

    const button = event.relatedTarget
    const name = button.getAttribute('data-bs-name')
    const access = button.getAttribute('data-bs-access')
    const adminID = button.getAttribute('data-bs-adminid')
    const modalBody = deleteAccess.querySelector('.modal-body .confirm_text')
    modalBody.innerHTML = `Are you sure you want to remove <span style="color: red; font-weight: 600;">${name}</span>'s access from <span style="color: red; font-weight: 600;">${access}</span> level?`
    
    options.forEach(option => {
        option.style.display = 'block';
        if(option.value === adminID){
            option.style.display = 'none';
        }
    })
    const confirm_delete_access = document.getElementById('confirm_delete_access');
    confirm_delete_access.disabled = true;
    confirm_delete_access.addEventListener('click', () => {
        confirm_delete_access.disabled = true;
        if(form.style.display !== 'none'){
            if(newOwner.value === ""){
                confirm_delete_access.disabled = false;
                document.getElementById('ownership_error').innerHTML = '<i class="fa fa-exclamation-circle"></i> Please select a new owner'
                return
            }
            else{
                document.getElementById('ownership_error').innerHTML = ''
            }
        }
        $.ajax({
            url: `access/revokeAccess`,
            type: 'DELETE',
            data: {
                adminID: adminID,
                newOwnerID: newOwner.value
            },
            success: function(response){
                console.log(response)
                if(response.same_user)
                    window.location = '/'
                else
                    location.reload()
            },
            error: function(error){
                console.log(error)
            }
        })
    })

    $.ajax({
        url: `/admin/access/getjobs/${adminID}`,
        type: 'GET',
        success: function(response){
            console.log(response)
            if(response.jobsOwned){
                form.style.display = 'block';
            }
            confirm_delete_access.disabled = false;
        },
        error: function(error){
            console.log(error)
        }
    })
})

const addAccess = document.getElementById('addAccess');
addAccess.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget
    const access = button.getAttribute('data-bs-access')
    const modalTitle = addAccess.querySelector('.modal-title')
    const modalAccess = addAccess.querySelector('.modal-body #access')
    if(access === null)
        modalTitle.innerHTML = `Access Control`
    else{
        modalTitle.innerHTML = `Access Control - ${access}` 
        modalAccess.value = access
        modalAccess.setAttribute('disabled', true)
    }
})

const confirm_add_access = document.getElementById('allowAccess');
const form = document.querySelector('#addAccessForm')
const name = document.getElementById('name')
const email = document.getElementById('email')
const access = document.getElementById('access')
const password = document.getElementById('pwd')

form.addEventListener('submit', (e) => {
    e.preventDefault()
    confirm_add_access.disabled = true;
    $.ajax({
        url: '/admin/access',
        type: 'POST',
        data: {
            name: name.value,
            email: email.value,
            access: access.value,
            password: password.value
        },
        success: function(response){
            confirm_add_access.disabled = false;
            console.log(response.error)
            if(response.error){
                document.getElementById('adminAddError').innerHTML = '<i class="fa fa-exclamation-circle"></i>' + response.error
            }
            else{
                location.reload()
                document.getElementById('adminAddError').innerHTML = ''
            }
        },
        error: function(error){
            console.log(error)
        }
    })
})


//no results
var type
if($('.applicant a').hasClass('selected')){
    type = 'applicants';
} else if($('.access a').hasClass('selected')){
    type = 'access';
}

if(type === 'applicants'){
    const positions = document.querySelectorAll('.positions')[0]
    if(positions.children.length === 0){
        const no_applications = document.querySelector('.no_applications');
        no_applications.style.display = 'flex';
    }
}


//search input

$('#search').on('keyup', function(){
    // remove no applications message
    $('.cards').each(function(){
        $(this).parent().find('.download-all').css('display', 'block')
        $(this).find('.no_application_message').remove()
    })

    const search = $(this).val().toString().toLowerCase();
    $('.card').each(function(){
        const profile = $(this).attr('id').toString().toLowerCase();
        if(profile.includes(search)){
            $(this).show();
        }
        else {
            $(this).hide();
        }
    })

    // display no applications message
    if(search===""){
        displayNoApplicationsMsg()
    }

    //no result for access
    const allCards = document.querySelectorAll('.cards');
    allCards.forEach(cards=>{
        if(Array.from(cards.children).every(card=>card.style.display === 'none')){
            cards.parentElement.style.display = 'none';
        } else {
            cards.parentElement.style.display = 'block';
        }
    })
    
    // no result for applications
    const positions = document.querySelectorAll('.positions')[0];
    if(Array.from(positions.children).every(position=>position.style.display === 'none')){
        document.querySelector('.no_applications').style.display = 'none';
        document.querySelector('.no_results').style.display = 'flex';
    } 
    else {
        document.querySelector('.no_results').style.display = 'none';
    }
})

//status editing
function editStatus(e, id){
    e.preventDefault();
    const status = document.getElementById(`status_${id}`);
    status.style.backgroundColor = 'white';
    status.style.borderColor = 'black';
    status.style.borderWidth = '1px';
    status.style.borderStyle = 'solid';
    status.removeAttribute('disabled');
    status.focus();
    e.target.parentElement.setAttribute('onclick',`saveStatus(event, ${id})`)
    e.target.parentElement.innerHTML = `<button class="btn btn-primary saveStatus">Save</button>`
}

function saveStatus(e, id){
    e.preventDefault();
    const status = document.getElementById(`status_${id}`);
    const adminname = $('#admin_profile').data('adminname')
    const adminemail = $('#admin_profile').data('adminemail')
    console.log(adminname, adminemail)
    var status_value = status.options[status.selectedIndex].text;
    console.log(status_value)
    //ajax request
    $.ajax({
        url: `/admin/applications/status`,
        type: 'POST',
        data: {
            status: status_value,
            applicant_id: id
        },
        success: function(response){
            const status = document.getElementById(`status_${id}`);
            status_value = response.status
            status.style.backgroundColor = 'transparent';
            status.style.borderColor = 'transparent';
            status.style.borderWidth = '0px';
            status.style.borderStyle = 'none';
            status.setAttribute('disabled', 'true');
            e.target.parentElement.setAttribute('onclick',`editStatus(event, ${id})`)
            e.target.parentElement.innerHTML = `<i class="fa fa-pencil"></i>`
            console.log(id)
        },
        error: function(error) {
            console.log(error);
        }
    });

}

//download applications
$('.download-application').on('click', function(e){
    e.preventDefault();
    const applicant_id = $(this).data('applicant');
    window.location = '/admin/download/'+applicant_id;
})

//download all applications
$('.download-all').on('click', function(e){
    e.preventDefault();
    const jobID = $(this).attr('data-jobID');
    console.log(jobID)
    var applicant_ids = [];
    $(`.${jobID}`).find('.download-application').each(function(){
        if($(this).parent().parent().parent().css('display')!= 'none'){
            const applicant_id = $(this).data('applicant');
            applicant_ids.push(applicant_id);
        }
    })
    console.log(applicant_ids)
    window.location = '/admin/downloadAll/'+ jobID +'/'+applicant_ids;
})

//selecting cards based on status

var checkboxes = document.querySelectorAll("input[type=radio]");
const checkbox_values = document.querySelectorAll('.positions select')
checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        // removing no applications message
        $('.cards').each(function(){
            $(this).parent().find('.download-all').css('display', 'block')
            $(this).find('.no_application_message').remove()
        })

        if (this.checked) {
            console.log(checkbox.value + " is checked");
            checkbox_values.forEach(check_status => {
                const parent = check_status.parentElement.parentElement.parentElement.parentElement.parentElement;
                if(checkbox.value == "All"){
                    checkbox_values.forEach(check_status => {
                        const parent = check_status.parentElement.parentElement.parentElement.parentElement.parentElement;
                        parent.style.display = "flex"
                        displayNoApplicationsMsg()
                    })
                }
                if(check_status.value == checkbox.value)
                    parent.style.display = "flex"
                else
                    parent.style.display = "none"
            })
        } else {
            console.log(checkbox.value + " is not checked");
            checkbox_values.forEach(check_status => {
                const parent = check_status.parentElement.parentElement.parentElement.parentElement.parentElement;
                parent.style.display = "flex"
            })
        }

        // no result for access
        const allCards = document.querySelectorAll('.cards');
        allCards.forEach(cards=>{
            if(Array.from(cards.children).every(card=>card.style.display === 'none')){
                cards.parentElement.style.display = 'none';
            } else {
                cards.parentElement.style.display = 'block';
            }
        })

        // no result for applications
        const positions = document.querySelectorAll('.positions')[0];
        if(Array.from(positions.children).every(position=>position.style.display === 'none')){
            console.log(document.querySelector('.no_results'))
            document.querySelector('.no_applications').style.display = 'none';
            document.querySelector('.no_results').style.display = 'flex';
        } 
        else {
            document.querySelector('.no_results').style.display = 'none';
        }

    });
})
        
//displaying no applications message for each job
function displayNoApplicationsMsg(){
    $('.cards').each(function(){
        if($(this).children().length == 0 ){
            $(this).append('<div class="no_application_message">No applications yet</div>')
            $(this).find('.no_application_message').css(
                {
                    display: 'block',
                    "color": 'rgba(0, 0, 0, 0.5)',
                    "padding": '3em',
                    "margin": 'auto',
                    'font-family': "Montserrat"
                }
            )
            $(this).parent().find('.download-all').css('display', 'none')
        }
        else{
            $(this).parent().find('.download-all').css('display', 'block')
            $(this).find('.no_application_message').remove()
        }
    })
}

displayNoApplicationsMsg()



