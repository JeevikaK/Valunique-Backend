//modals
const deleteAccess = document.getElementById('deleteAccess');
deleteAccess.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget
    const name = button.getAttribute('data-bs-name')
    const email = button.getAttribute('data-bs-email')
    const access = button.getAttribute('data-bs-access')
    const modalBody = deleteAccess.querySelector('.modal-body p')
    modalBody.innerHTML = `Are you sure you want to remove <span style="color: red; font-weight: 600;">${name}</span>'s access from <span style="color: red; font-weight: 600;">${access}</span> level?` 
})

const addAccess = document.getElementById('addAccess');
addAccess.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget
    const access = button.getAttribute('data-bs-access')
    const modalTitle = addAccess.querySelector('.modal-title')
    const modalAccess = addAccess.querySelector('.modal-body #access')
    modalTitle.innerHTML = `Access Control - ${access}` 
    modalAccess.value = access
})

//no results
const positions = document.querySelectorAll('.positions')[0]
console.log(positions.children)
if(positions.children.length === 0){
    const no_applications = document.querySelector('.no_applications');
    no_applications.style.display = 'flex';
}

//search input
var type
if($('.applicant a').hasClass('selected')){
    type = 'applicants';
} else if($('.access a').hasClass('selected')){
    type = 'access';
}

$('#search').on('keyup', function(){
    const search = $(this).val().toString().toLowerCase();
    $('.card').each(function(){
        const profile = $(this).attr('id').toString().toLowerCase();
        if(profile.includes(search)){
            $(this).show();
        } else {
            $(this).hide();
        }
    })

    const allCards = document.querySelectorAll('.cards');
    allCards.forEach(cards=>{
        if(Array.from(cards.children).every(card=>card.style.display === 'none')){
            cards.parentElement.style.display = 'none';
        } else {
            cards.parentElement.style.display = 'block';
        }
    })
    
    const positions = document.querySelectorAll('.positions')[0];
    if(Array.from(positions.children).every(position=>position.style.display === 'none')){
        console.log(document.querySelector('.no_results'))
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
    //console.log(status)
    status.style.backgroundColor = 'white';
    status.style.borderColor = 'black';
    status.style.borderWidth = '1px';
    status.style.borderStyle = 'solid';
    status.removeAttribute('disabled');
    status.focus();
    e.target.parentElement.setAttribute('onclick',`saveStatus(event, ${id})`)
    e.target.parentElement.innerHTML = `<button class="btn btn-primary saveStatus">Save</button>`
    //console.log(id)
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
        url: `/admin?adminEmail=${adminemail}&adminName=${adminname}`,
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
            $('#answer_error').html('<i class="fa fa-exclamation-circle"></i> Error in saving status');
        }
    });

}

//download applications
$('.download-application').on('click', function(e){
    e.preventDefault();
    const applicant_id = $(this).data('applicant');
    window.location = '/admin/download/'+applicant_id;
    // $.ajax({
    //     url: '/admin/download/'+applicant_id,
    //     type: 'GET',
    //     success: function(data){
    //         console.log(data)
    //         window.location = '/admin/download/'+applicant_id;C
    //     },
    //     error: function(err){
    //         console.log(err)
    //     }
    // })
})