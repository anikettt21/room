// Global variables for hall seat management
let hall = "";
let soldSeats = [];                 // Seats that are sold (fetched from server)
let removedSeats = [];              // Seats temporarily removed (yellow, but can be restored)
let permanentlyRemovedSeats = [];   // Seats marked as permanently removed
let totalSeats = 50;                // Default capacity

// Fetch the sold seats from the server and then render the seat layout
function fetchAndRenderSeats() {
  hall = window.location.pathname.includes('hall1') ? 'hall1' : 'hall2';

  // Retrieve stored totalSeats for this hall from localStorage if any
  const storedTotal = parseInt(localStorage.getItem('totalSeats_' + hall)) || 50;

  fetch(`http://localhost:5000/seats/${hall}`)
    .then(response => response.json())
    .then(data => {
      // If the endpoint returns objects, extract seat numbers:
      soldSeats = data.map(item => item.seat_number);

      // Extend totalSeats if a sold seat exceeds the default capacity
      const maxSold = soldSeats.length > 0 ? Math.max(...soldSeats) : 0;
      totalSeats = Math.max(storedTotal, 50, maxSold);

      renderSeats();
    })
    .catch(error => console.error('Error:', error));
}

// Render the seat layout with the current status for each seat
function renderSeats() {
  const seatLayout = document.getElementById('seat-layout');
  seatLayout.innerHTML = '';

  for (let i = 1; i <= totalSeats; i++) {
    const seat = document.createElement('div');
    seat.classList.add('seat');
    seat.textContent = i;

    // Determine the status of the seat and add appropriate classes
    if (soldSeats.includes(i)) {
      seat.classList.add('sold');
    } else if (permanentlyRemovedSeats.includes(i)) {
      seat.classList.add('removed-permanent');
      addEditIcon(seat, i);
    } else if (removedSeats.includes(i)) {
      seat.classList.add('removed');
      addEditIcon(seat, i);
    } else {
      seat.classList.add('available');
    }
    
    seatLayout.appendChild(seat);
  }
}

// Helper: Add a pencil (edit) icon to a seat that is removed
function addEditIcon(seatElement, seatNumber) {
  const editIcon = document.createElement('span');
  editIcon.className = 'edit-icon';
  editIcon.innerHTML = '&#9998;'; // Unicode pencil icon
  editIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    handleEditSeat(seatNumber);
  });
  seatElement.appendChild(editIcon);
}

// Function to handle the edit icon click for a given seat number
function handleEditSeat(seatNumber) {
  const choice = prompt(
    `For seat ${seatNumber}:\nEnter 1 to restore this seat (make available again).\nEnter 2 to mark this seat permanently removed.`
  );
  if (choice === "1") {
    removedSeats = removedSeats.filter(num => num !== seatNumber);
    permanentlyRemovedSeats = permanentlyRemovedSeats.filter(num => num !== seatNumber);
  } else if (choice === "2") {
    removedSeats = removedSeats.filter(num => num !== seatNumber);
    if (!permanentlyRemovedSeats.includes(seatNumber)) {
      permanentlyRemovedSeats.push(seatNumber);
    }
  }
  renderSeats();
}

// Helper: Verify admin password via backend
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

// PLUS button: Allow admin to add/restore a seat after verification
document.getElementById('add-seat-button').addEventListener('click', function () {
  verifyAdmin().then(() => {
    const seatInput = prompt("Enter the seat number to add/restore:");
    if (seatInput === null) return; // Cancelled
    const seatNumber = parseInt(seatInput, 10);
    if (isNaN(seatNumber) || seatNumber < 1) {
      alert("Invalid seat number.");
      return;
    }
    if (soldSeats.includes(seatNumber)) {
      alert("This seat is sold and cannot be restored.");
      return;
    }
    if (seatNumber > totalSeats) {
      totalSeats = seatNumber;
      localStorage.setItem('totalSeats_' + hall, totalSeats);
    } else {
      if (!removedSeats.includes(seatNumber) && !permanentlyRemovedSeats.includes(seatNumber)) {
        alert("This seat is already available.");
        return;
      }
      removedSeats = removedSeats.filter(num => num !== seatNumber);
      permanentlyRemovedSeats = permanentlyRemovedSeats.filter(num => num !== seatNumber);
    }
    renderSeats();
  }).catch(() => {});
});

// MINUS button: Allow admin to remove a seat after verification
document.getElementById('remove-seat-button').addEventListener('click', function () {
  verifyAdmin().then(() => {
    const seatInput = prompt("Enter the seat number you want to remove:");
    if (seatInput === null) return;
    const seatNumber = parseInt(seatInput, 10);
    if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > totalSeats) {
      alert("Invalid seat number.");
      return;
    }
    if (soldSeats.includes(seatNumber)) {
      alert(`Seat ${seatNumber} is sold and cannot be removed.`);
      return;
    }
    if (removedSeats.includes(seatNumber) || permanentlyRemovedSeats.includes(seatNumber)) {
      alert(`Seat ${seatNumber} is already removed.`);
      return;
    }
    removedSeats.push(seatNumber);
    renderSeats();
  }).catch(() => {});
});

// ------------------ Monthly Report Functionality ------------------

// Call this function when a month is selected from the dropdown
function showMonthlySeatReport(month) {
  // Fetch sold seats for the specified month
  fetch(`http://localhost:5000/seats/${hall}?month=${month}`)
    .then(response => response.json())
    .then(data => {
      // data is an array of objects { seat_number, registration_date }
      const soldCount = data.length;
      // removedSeats and permanentlyRemovedSeats are maintained locally (not month-specific)
      const removedCount = removedSeats.length + permanentlyRemovedSeats.length;
      const availableCount = totalSeats - soldCount - removedCount;
      
      // Display the report in the designated report div
      const reportDiv = document.getElementById("monthly-report");
      reportDiv.innerHTML = `
        <h3>Monthly Report for ${month}</h3>
        <p>Sold Seats: ${soldCount}</p>
        <p>Removed Seats: ${removedCount}</p>
        <p>Available Seats: ${availableCount}</p>
      `;
    })
    .catch(err => {
      console.error("Error fetching monthly report:", err);
    });
}

// Handler for month dropdown change
function handleMonthChange() {
  const month = document.getElementById("month-select").value;
  if(month) {
    showMonthlySeatReport(month);
  } else {
    document.getElementById("monthly-report").innerHTML = "";
  }
}

// Initialize seat layout on page load
document.addEventListener('DOMContentLoaded', fetchAndRenderSeats);
