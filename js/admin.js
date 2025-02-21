document.addEventListener("DOMContentLoaded", function () {
  // Check if an admin password is set
  fetch("http://localhost:5000/admin/check")
    .then(response => response.json())
    .then(data => {
      if (data.passwordSet) {
        // Show login form if a password is set
        document.getElementById("admin-login").style.display = "block";
      } else {
        // No password: show admin panel directly
        document.getElementById("admin-panel").style.display = "block";
      }
    })
    .catch(err => {
      console.error("Error checking admin password:", err);
      // Fallback: if there is an error, show the admin panel
      document.getElementById("admin-panel").style.display = "block";
    });

  // Login button event listener
  document.getElementById("admin-login-button").addEventListener("click", function () {
    const password = document.getElementById("admin-password-input").value;
    fetch("http://localhost:5000/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => { throw new Error(data.error); });
        }
        return response.json();
      })
      .then(data => {
        // On successful login, hide login form and show admin panel
        document.getElementById("admin-login").style.display = "none";
        document.getElementById("admin-panel").style.display = "block";
      })
      .catch(err => {
        document.getElementById("login-error").textContent = err.message;
      });
  });

  // Set/Change password button event listener
  document.getElementById("set-password-button").addEventListener("click", function () {
    const newPassword = document.getElementById("new-admin-password").value;
    if (!newPassword) {
      document.getElementById("password-message").textContent = "Please enter a password.";
      return;
    }
    fetch("http://localhost:5000/admin/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => { throw new Error(data.error); });
        }
        return response.json();
      })
      .then(data => {
        document.getElementById("password-message").textContent = data.message;
      })
      .catch(err => {
        document.getElementById("password-message").textContent = err.message;
      });
  });
});
