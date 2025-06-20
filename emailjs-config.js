// EmailJS configuration
(function() {
  emailjs.init("lKQMX4p-cSyYhv0-7");
})();

// Function to send verification email
function sendVerificationEmail(email, otp) {
  return emailjs.send('service_h9a8bgc', 'template_zuuk2t1', {
    to_email: email,
    verification_code: otp,
    to_name: email.split('@')[0]
  });
}

// Export functions
window.sendVerificationEmail = sendVerificationEmail; 