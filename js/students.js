document.addEventListener('DOMContentLoaded', function () {
  fetchStudents();
});

function fetchStudents() {
  fetch('http://localhost:5000/students')
      .then(response => response.json())
      .then(data => {
          renderStudents(data);
      })
      .catch(error => console.error('Error:', error));
}

function renderStudents(data) {
  const tbody = document.getElementById('student-data');
  tbody.innerHTML = data.map((student, index) => `
      <tr>
          <td>${index + 1}</td>
          <td>${student.name} ${student.surname}</td>
          <td>${student.phone}</td>
          <td>${student.hall}</td>
          <td>${student.seat_number}</td>
          <td>${new Date(student.registration_date).toLocaleDateString('en-GB')}</td>
          <td>${student.remaining_fees === 'yes' ? student.fees_amount : 'No'}</td>
          <td>${student.seat_type}</td>
          <td>
              <button onclick="editStudent(${student.id})">Edit</button>
              <button onclick="deleteStudent(${student.id})">Delete</button>
          </td>
      </tr>
  `).join('');
}

function filterStudents() {
  const searchText = document.getElementById('search-bar').value.toLowerCase();
  const filterMonth = document.getElementById('filter-month').value;
  const filterHall = document.getElementById('filter-hall').value;
  const filterSeatType = document.getElementById('filter-seat-type').value;

  fetch('http://localhost:5000/students')
      .then(response => response.json())
      .then(data => {
          const filteredData = data.filter(student => {
              const matchesSearch = student.name.toLowerCase().includes(searchText) ||
                                    student.phone.includes(searchText) ||
                                    (student.email && student.email.toLowerCase().includes(searchText)) ||
                                    student.seat_number.toString().includes(searchText);
              
              const matchesMonth = filterMonth ? 
                  new Date(student.registration_date).toLocaleString('default', { month: 'long' }) === filterMonth : true;
              const matchesHall = filterHall !== 'all' ? student.hall === filterHall : true;
              const matchesSeatType = filterSeatType ? student.seat_type === filterSeatType : true;

              return matchesSearch && matchesMonth && matchesHall && matchesSeatType;
          });

          renderStudents(filteredData);
      })
      .catch(error => console.error('Error:', error));
}

// Helper function to verify admin password via backend
function verifyAdmin() {
  return new Promise((resolve, reject) => {
      const adminPass = prompt("Enter Admin Password:");
      if (!adminPass) {
          alert("Admin password is required.");
          reject();
          return;
      }
      fetch("http://localhost:5000/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: adminPass })
      })
      .then(response => {
          if (!response.ok) {
              return response.json().then(data => { 
                  throw new Error(data.error || "Incorrect password");
              });
          }
          return response.json();
      })
      .then(() => { resolve(); })
      .catch(err => {
          alert(err.message);
          reject();
      });
  });
}

// Edit student: require admin verification then redirect to registration page with the edit query parameter
function editStudent(id) {
  verifyAdmin().then(() => {
      window.location.href = `registration.html?edit=${id}`;
  }).catch(() => {});
}

// Delete student: require admin verification then perform deletion
function deleteStudent(id) {
  verifyAdmin().then(() => {
      if (confirm('Are you sure you want to delete this student?')) {
          fetch(`http://localhost:5000/students/${id}`, { method: 'DELETE' })
              .then(response => response.json())
              .then(data => {
                  alert(data.message);
                  fetchStudents(); // Refresh the table
              })
              .catch(error => console.error('Error:', error));
      }
  }).catch(() => {});
}

// Add event listeners for filters
document.getElementById('search-bar').addEventListener('input', filterStudents);
document.getElementById('filter-month').addEventListener('change', filterStudents);
document.getElementById('filter-hall').addEventListener('change', filterStudents);
document.getElementById('filter-seat-type').addEventListener('change', filterStudents);
