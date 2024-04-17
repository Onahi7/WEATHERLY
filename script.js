
const apiKey = "9470f162a34d93086760b16d1426a9ed";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

const searchBox = document.querySelector(".search input");
const searchButton = document.querySelector(".search button");

// Check if the user is logged in
const user = JSON.parse(sessionStorage.getItem('user'));
if (!user) {
    window.location.href = 'login.html';
}

async function getWeather(city) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?units=metric&q=${city}&appid=${apiKey}`);
    const data = await response.json();

    if (response.status === 404) {
        let img = document.querySelector("#icon");
        img.style.width = "30rem";
        document.querySelector(".detail").style.display = "none";
        document.querySelector(".temp2").style.display = "none";

        img.src = 'images/404.png';
        let temp = document.querySelector(".temp").innerHTML = "Error! 404";
        let name = document.querySelector(".name").innerHTML = "City Not Found";
        document.getElementById("temp").style.fontSize = "3rem";
        return;
    } else {
        const { lat, lon } = data.coord;
        const alertsResponse = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${apiKey}`);
        const alertsData = await alertsResponse.json();

        // Check if there are any weather alerts
        if (alertsData.alerts && alertsData.alerts.length > 0) {
            const alerts = alertsData.alerts.map(alert => alert.event);
            alert(`Severe Weather Alerts:\n${alerts.join('\n')}`);

            // Send email notification for high alerts
            const highAlerts = alertsData.alerts.filter(alert => alert.severity === 'High');
            if (highAlerts.length > 0) {
                const emailBody = `
                    <h2>High Severe Weather Alerts</h2>
                    <p>Dear ${user.name},</p>
                    <p>There are high severe weather alerts for your location:</p>
                    <ul>
                        ${highAlerts.map(alert => `<li>${alert.event}</li>`).join('')}
                    </ul>
                    <p>Please take necessary precautions.</p>
                `;
                sendEmail(user.email, 'High Severe Weather Alerts', emailBody);
            }
        }

        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`);
        const forecastData = await forecastResponse.json();

        document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°c";
        document.querySelector(".name").innerHTML = data.name + ", " + data.sys.country;
        document.querySelector(".mintemp").innerHTML = Math.round(data.main.temp_min) + "°c";
        document.querySelector(".maxtemp").innerHTML = Math.round(data.main.temp_max) + "°c";

        document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
        document.querySelector(".wind").innerHTML = Math.round(data.wind.speed) + " km/h";

        let img = document.querySelector("#icon");
        switch (data.weather[0].main) {
            case 'Clear':
                img.src = 'images/clear.png';
                break;
            case 'Rain':
                img.src = 'images/rain.png';
                break;
            case 'Snow':
                img.src = 'images/snow.png';
                break;
            case 'Clouds':
                img.src = 'images/cloud.png';
                break;
            case 'Mist':
                img.src = 'images/mist.png';
                break;
            case 'Haze':
                img.src = 'images/mist.png';
                break;
            default:
                img.src = 'images/cloud.png';
                break;
        }

        document.querySelector(".detail").style.display = "flex";
        document.querySelector(".temp2").style.display = "flex";
        document.getElementById("temp").style.fontSize = "5.2rem";
        img.style.width = "16rem";

        // Update UI with 5-day forecast data
        const forecastContainer = document.querySelector('.forecast');
        forecastContainer.innerHTML = '';
        forecastData.daily.slice(1, 6).forEach(day => {
            const forecastDay = document.createElement('div');
            forecastDay.classList.add('forecast-day');
            const date = new Date(day.dt * 1000).toLocaleDateString();
            const icon = `https://openweathermap.org/img/w/${day.weather[0].icon}.png`;
            const temp = `${Math.round(day.temp.day)}°C`;
            forecastDay.innerHTML = `
                <div>${date}</div>
                <img src="${icon}" alt="${day.weather[0].description}">
                <div>${temp}</div>
            `;
            forecastContainer.appendChild(forecastDay);
        });
    }
}

searchButton.addEventListener("click", function () {
    getWeather(searchBox.value);
});

// Automatically update weather every 10 minutes
setInterval(() => {
    getWeather(searchBox.value);
}, 600000);

function sendEmail(to, subject, body) {
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
        to: to,
        subject: subject,
        body: body
    })
    .then(() => {
        console.log('Email sent successfully');
    }, (error) => {
        console.error('Failed to send email:', error);
    });
}