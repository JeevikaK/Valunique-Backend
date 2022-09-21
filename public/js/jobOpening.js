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
// addQuest.click()
// document.getElementsByTagName('body')[0].onload(() => {
//     console.log('loaded')
// })

// addEventListener('load', (event) => {
//     console.log('loaded')
//     $("#addQuestionaire").trigger('click');
// });

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
