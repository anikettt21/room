document.getElementById('registration-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    const formData = {
        name: document.getElementById('name').value,
        surname: document.getElementById('surname').value,
        email: document.getElementById('email').value, // email is optional now
        phone: document.getElementById('phone').value,
        hall: document.getElementById('hall').value,
        seat_number: parseInt(document.getElementById('seat').value),
        seat_type: document.getElementById('seat-type').value,
        payment_method: document.getElementById('payment-method').value,
        remaining_fees: document.getElementById('remaining-fees').value,
        fees_amount: document.getElementById('remaining-fees').value === 'yes' ? 
            parseInt(document.getElementById('fees').value) : 0,
        registration_date: document.getElementById('registration-date').value
    };

    const endpoint = editId ? 
        `http://localhost:5000/students/${editId}` : 
        'http://localhost:5000/register';

    const method = editId ? 'PUT' : 'POST';

    fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            window.location.href = 'students.html';
        }
    })
    .catch(error => console.error('Error:', error));
});
