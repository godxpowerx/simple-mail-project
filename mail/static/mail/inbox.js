document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // send a mail
  document.querySelector('#compose-form').addEventListener('submit', submit_mail);

  // By default, load the inbox
  load_mailbox('inbox');





});


function submit_mail(event) {
  event.preventDefault()

  // Get the fields and evaluate them
  recipient = document.querySelector('#compose-recipients').value

  //make sure there is atleast a recipient
  if (recipient === '') {
    document.querySelector('#error-form').innerHTML = 'there have to be atleast a recipient' +
      '(seperate by comma if more than one) ';
    return
  }
  // get the value for subjects and the boy and evaluate them
  subjects = document.querySelector('#compose-subject').value;
  bodys = document.querySelector('#compose-body').value;

  // make sure the user is not trying to send an empty email
  if (subjects === '' || bodys === '') {
    document.querySelector('#error-form').innerHTML = 'the body or subject can\'t be empty';
    return
  }

  // if the value are correct its is sent to the server for more proccessing and depending
  // on the response will determine what  the user will see
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipient,
      subject: subjects,
      body: bodys
    })
  })
    .then(response => response.json())
    .then(result => {
      // if the response from the server is success the user will see a message 
      // else and error will be displayed

      load_mailbox('sent')

      if (result.message) {
        document.querySelector('#error-form').innerHTML = result.message
      } else {
        document.querySelector('#error-form').innerHTML = result.error
      }

    });

}


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  //create a HTML table Template

  top_table = `<div class="class="col-12 col-md-6">
              <table class="table">
                <thead>
                    <tr>
                        <th scope="col">sender</th>
                        <th scope="col">recipients</th>
                        <th scope="col">subject</th>
                        <th scope="col">Date</th>
                    </tr>
                </thead>
                <tbody>`

  body_table = ''

  end_table = ` </tbody></table> </div>`

  // Show the mailbox name
  heading = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(data => {

      for (da in data) {
        if (data[da].read) {
          body_table += `<tr class='bg-secondary'>`
        } else {
          body_table += `<tr>`
        }
        body_table +=
          `
         <th scope="row">
          <button id='${data[da].id}' class='mail_id button-link small'>
          ${data[da].sender}
          </button></th>
            <td class="small">${data[da].recipients}</td>
            <td class="small">${data[da].subject}</td>
            <td class="small">${data[da].timestamp}</td>
        </tr>`

      }

      top_table += body_table + end_table
      document.querySelector('#emails-view').innerHTML = heading + top_table

      const one_mail = document.querySelectorAll('.mail_id');
      one_mail.forEach(element => {
        element.addEventListener('click', check_mail)
      });

    });


}

function check_mail() {

  //check for a speecfic email
  fetch(`emails/${this.id}`)
    .then(response => response.json())
    .then(email => {
      if (email.error) {
        document.querySelector('#error-form').innerHTML = email.error
      }
      body_table = `
      <div class='border col-12 col-md-6'>
       <p> Date : ${email.timestamp}</p>
      <p> Sender : ${email.sender}</p>
      <p> Recipients : ${email.recipients}</p>
      <p> Subject : ${email.subject}</p>
      </div>
      <hr/>`
      
      if (email.archived) {

        body_table += `
                <div 'border col-12 col-md-6'>
                <button id='unarchive' class=' button-link small text-danger'> &#8613; Unarchive</button> 
                </div>`
        
      } else {

        body_table += `
                  <div 'border col-12 col-md-6'>
                  <button id='archive' class=' button-link small text-danger lead'>&#8615; Archive</button> 
                  <button id='reply' class=' button-link small lead text-success'>Reply &#8614</a> 
                  </div>`
        
      }
     
      body_table +=
          `
       <hr/>
      <div class='border col-12 col-md-6'>
      <textarea disabled class="form-control" id="comp" placeholder="Body">
      ${email.body}
      </textarea>
      </div>
          `
      document.querySelector('#emails-view').innerHTML = body_table;
      fetch(`emails/${this.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })

      const archive = document.querySelector('#archive');
      if (archive) {
        archive.addEventListener('click', () => is_archived(true, this.id));
      }

      const unarchive = document.querySelector('#unarchive')
      if (unarchive) {
        unarchive.addEventListener('click', () => is_archived(false, this.id));
      }

      const reply = document.querySelector('#reply')
      if (reply) {
        reply.addEventListener('click', () => reply_to(this.id));
      }

    });

}

function is_archived(t, id) {
  
  fetch(`emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: t
    })
  })
    .then(response => {
      if (t) {
        load_mailbox('archive')
      } else {
        load_mailbox('inbox')
      }
    });
}


function reply_to(id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields

  fetch(`emails/${id}`)
    .then(response => response.json())
    .then(email => {
      if (email.error) {
        document.querySelector('#error-form').innerHTML = email.error
      }
      document.querySelector('#compose-recipients').value = email.sender;
      if (email.subject.substr(0, 3).toLowerCase() === 're:') {
        document.querySelector('#compose-subject').value = email.subject;
      } else {
        document.querySelector('#compose-subject').value = 'Re:' + ' ' + email.subject;
      }
      email_bodies = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`
      document.querySelector('#compose-body').value = '\n'+ email_bodies;
    });
}

