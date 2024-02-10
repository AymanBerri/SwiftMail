document.addEventListener('DOMContentLoaded', function() {

  // Flag to determine whether to load the "sent" mailbox
  let loadSentMailbox = false;

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

    // After user submits [EVENT LISTENER FOR THE COMPOSE EMAIL FORM]
    document.querySelector("#compose-form").onsubmit = () => {

      // flag to handle if user is replying on an email or composing a new one
      const isReply = document.querySelector('#is-reply').value === "true";

      // get the variables
      const recipients = document.querySelector('#compose-recipients').value;
      const subject = document.querySelector('#compose-subject').value;
      let body = document.querySelector('#compose-body').value;

      
      
      // // Handle Reply email composition
      // if (isReply) {
      //   // Handle reply logic here

      //   const ogEmail = extractOriginalEmail(body)

      //   // This gives me only what the user replied. Doesn't alter body
      //   const reply = extractReply(body)

        
      //   if (reply){

      //     // add reply prefix (user, timestamp)
      //     // 1) get user email
      //     const userEmail = document.querySelector("#user-email").textContent;
      //     // 2) Get timestamp of original email submission
      //     const emailTimestamp = document.querySelector("#email-timestamp").textContent;
      //     // 3) get timestamp of submission
      //     const formattedTimestamp = getTimestamp();
          
      //     // Formulate the new reply part to be appended to the body
      //     const replyMessage = `On ${formattedTimestamp} ${userEmail} replied:
      //     "${reply}"`;

      //     // reformulation the email:
      //     body = `${extractOriginalEmail(body)}
      //     ${replyMessage}`


      //     console.log("BODY submitted:\n" + body)
      //     console.log("REPLY MSG:\n" + replyMessage)
      //     console.log("OG EMAIL:\n" + ogEmail)

      //   } else {
      //     // Handle the user submitting a reply email without reply
      //     alert("No reply was recorded, kindly formulate a reply email.")
      //     return false;
      //   }
      // }

      console.log('BODY BEFORE:\n'+body)
      // Handle Reply email composition
      if (isReply) {
        const ogEmail = extractOriginalEmail(body);
        const reply = extractReply(body);

        if (reply) {
          const userEmail = document.querySelector("#user-email").textContent;
          const emailTimestamp = document.querySelector("#email-timestamp").textContent;
          const formattedTimestamp = getTimestamp();
          
          // REPLACE <br> TO \n
          body = body.replace(/<br>/g, '\n');

          // We start by removing the first line (the prefix) by splitting the text into lines
          const lines = body.split('\n');
          // Remove the first line (the original email prefix)
          lines.shift();
          // Join the remaining lines with double line breaks to separate messages
          let modifiedText = lines.join('\n');

          console.log("AFTER REMOVING FIRST LINE:\n" + modifiedText);

          // Now we replace the reply divider with a new prefix by creating a regular expression pattern to match the divider
          const dividerPattern = /--- Reply below this line ---/;
          // Replace the divider with the new reply prefix
          modifiedText = modifiedText.replace(dividerPattern, `On ${formattedTimestamp} ${userEmail} replied:`);

          // Set the new body to the modified text to be saved later by the POST method
          body = modifiedText.replace(/\n/g, '<br>');
          
          console.log("FINALLY:\n" + modifiedText);
        } else {
          // Handle the user submitting a reply email without a reply
          alert("No reply was recorded; kindly formulate a reply email.");
          return false;
        }
      }

      // return false;
      // using fetch() to send the email or update if the user is replying on an email.
      fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
        })
      })
      .then(response => response.json())
      .then(result => {
        console.log("New Email Composed Successfully")
        console.log(result);

        
        // Load the "sent" mailbox
        load_mailbox('sent');
        
      });
  
      // Return false to prevent further execution
      return false;
    }
    
    // By default, load the inbox
    load_mailbox('inbox');
  });

function compose_email() {

  // If the user already replied, the following variable would be set to true. We must change is back to false.
  document.querySelector('#is-reply').value = "false";

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none'
  document.querySelector('#compose-view').style.display = 'block';
  
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-recipients').disabled = false;
  
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-subject').disabled = false;

  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none'
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h1>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h1>`;

  // getting the emails
  fetch(`emails/${mailbox}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(emails => {
    // Looping through all the emails and displaying them in the mailbox
    emails.forEach(email => {
      // create new div
      const newEmail = document.createElement('div');
      newEmail.className = 'email-item'
      newEmail.dataset.emailId = email.id

      // the email content
      newEmail.innerHTML = `
        <p><strong>${email.sender}</strong>  ${email.subject}
        <span style='float: right;'>${email.timestamp}</span> </p>

      `;

      // If the email is unread, it should appear with a white background. 
      // If the email has been read, it should appear with a gray background.
      if (!email.read) newEmail.classList.add('read')
      else newEmail.classList.add('unread')

      document.querySelector('#emails-view').appendChild(newEmail)
      if (mailbox !== 'sent'){
        const archiveBtn = document.createElement('button')
        email.archived ? archiveBtn.innerHTML = "Restore" : archiveBtn.innerHTML = "Archive"
        archiveBtn.id = 'archive'
        archiveBtn.className = 'btn btn-sm btn-outline-secondary'
        newEmail.appendChild(archiveBtn)

        // An event listener for when the user wants to ARHIVE or RETRIEVE an email
        archiveBtn.addEventListener('click', ()=> {
          email.archived ? archive(email.id, false) : archive(email.id, true)

          // run animation to hide the email we just archive or restore
          archiveBtn.parentElement.style.animationPlayState = 'running'
          // we then remove the parent element
          archiveBtn.parentElement.addEventListener('animationend', ()=> {
            archiveBtn.parentElement.remove();
          })

        })
      }

      // when use clicks on an email to see it
      newEmail.addEventListener('click', (event)=> {
        // if user clicks on the email, not the archive button
        if (event.target.className.includes('email-item')){
          // we change the read state of the email to true
          change_to_read(email.id)
          // we load the email view
          load_email(email.id)
        }
      })   
      
    });

  })
}

function load_email(email_id) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  const email_view = document.querySelector('#email-view')
  email_view.style.display = 'block'
  document.querySelector('#compose-view').style.display = 'none';

  // get the email using fetch
  fetch(`emails/${email_id}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(email => {

    // content of the email-view
    const emailSubject = document.getElementById('email-subject');
    const emailSender = document.getElementById('email-sender');
    const emailTimestamp = document.getElementById('email-timestamp');
    const emailBody = document.getElementById('email-body');

    emailSubject.textContent = email.subject;
    emailSender.textContent = `From: ${email.sender}`;
    emailTimestamp.textContent = `Timestamp: ${email.timestamp}`;
    emailBody.innerHTML = email.body;

    // Replay functionality
    document.querySelector('#reply-button').addEventListener('click', () => {
      reply_email(email_id);
    });
  })
}

function reply_email(email_id){
  console.log("REPLYING ON EMAIL...")
  // we get the email
  fetch(`emails/${email_id}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(email => {

    // change the value of the hidden input to indicate it is a reply
    document.querySelector('#is-reply').value = "true";

    // Pre-fill the composition form preaparing it to be displayed, we also disable the input fields to maintain the accuracy of the data.
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-recipients').disabled = true;

    document.querySelector('#compose-subject').value = getReplySubject(email);
    document.querySelector('#compose-subject').disabled = true;

    // Reply email prefix and divider
    const bodyPrefix = `On ${email.timestamp} ${email.sender} wrote:`;
    const replyDivider = "--- Reply below this line ---";

    // let composedBody = `"${email.body}"\n\n${replyDivider}\n`;

    let composedBody = `${bodyPrefix}\n${email.body}\n\n${replyDivider}\n`;

    // Set the value of compose-body
    const composeBody = document.querySelector('#compose-body');
    
    // Clear the textarea, TO SOLVE THE PROBLEM WHERE IM FORCED TO REFRESH THE ENTIRE WEBSITE FOR THE PREFIX TO APPEAR
    composeBody.value = '';


    // Add the email body content
    composeBody.value = composedBody.replace(/<br>/g, '\n');;


    // After we pre-fill, we now display the compose page
    // Show the compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
  })
}

// Helper functions

function extractOriginalEmail(text) {
  const regex = /On .* wrote:\s*"([^"]*)"/;
  const match = text.match(regex);
  return match ? match[1] : null;
}

function getTimestamp(){
  const formattedTimestamp = new Date().toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  
  return formattedTimestamp;
}

function extractReply(text) {
  // Find the index of "New Reply:"
  const startIndex = text.indexOf("--- Reply below this line ---");
  
  // If "New Reply:" is found, return the text that follows it
  if (startIndex !== -1) {
    return text.substring(startIndex + "--- Reply below this line ---".length).trim();
  } else {
    // Return null if "New Reply:" is not found
    return null;
  }
}

function getReplySubject(email){
  if (email.subject.startsWith('Re: ')) {
    return email.subject;
  } else {
    return `Re: ${email.subject}`;
  }
}

function change_to_read(email_id){
  fetch(`emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

function archive(email_id, state){
  // archive setter
  fetch(`emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: state
    })
  })
  .then(response => {
    // This is a requirment that I feel is useless
    // load_mailbox('inbox')
  })
  
}