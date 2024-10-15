'use strict';
/* 

وقتی داریم از روش شی گرایی برای کدنویسی خودمون استفاده میکنیم به این شکل است که نیاز داریم کلمه ی دیس به خود ابجکت اشاره کنه برای همین در اکثر مواقع مخصوصا توی ایونت لیسنر ها نیاز داریم که از متد بایند استفاده کنیم حالا زمانی این نکته خیلی مهمه که توی اون کدها یا اون متد از دیس استفاده کرده باشیم و اگر استفاده نکرده باشیم نیاز به استفاده از بایند نیست و فقط تابع رو جایگذاری میکنیم


وقتی قراره یه اپی یا سایتی چیزی رو بسازیم اول میایم به همون روش ساده کدنویسی میکنیم و کدها اولش خیلی به هم ریخته است و بعدش که کل یا اکثر لاجیک و منطق پروژه رو پیاده سازی کردیم یا هر زمان که صلاح دونستیم میایم وکدمون رو ریفکتور میکنیم چون خیلی سخته که از همون اول بیایم مثلا به روش شی گرایی کد بنویسیم یا اینکه مثلا بیایم به روش فانکشنال بنویسیم

یک نکته ی جالبی که هست و قابلیت خوب استفاده از ایونت دلیگیشن رو نشون میده اینکه خیلی از مواقع ما میخوایم یه یونتی رو روی یه المنتی انجام بدیم که هنوز ساخته نشده و استفاده از ایونت دلیگیشن به ما این امکان رو میده که خیلی ساده و بدون فکر کردن زیاد این کارو انجام بدیم


*/

/* Elements */
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  // just to create an unique id
  id = Date.now().toString().slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._setDescription();
    this.calcPace();
  }

  calcPace() {
    // min / km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling'; // is the same we write tihs.type = 'cycling' in constructor function
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._setDescription();
    this.calcSpeed();
  }

  calcSpeed() {
    // km / h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/*------------------------------ APPLICATION ARCHITECTURE ------------------------------*/
class App {
  // Private class fields
  #map;
  #mapEvent;
  #workouts = [];

  // All codes in constructor immediatly execute when the instance create so we put our Top-Level codes in there
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveTopPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // success callback
        this._loadMap.bind(this),
        // error callback
        function () {
          alert(`Couldn't access to your location`);
        }
      );
    }
  }

  _loadMap(position) {
    // Get current position of data
    const { latitude, longitude } = position.coords;
    // Display map at user position
    this.#map = L.map('map').setView([latitude, longitude], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // User click on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // just a helper function to check valid inputs
    const validInputs = (...inputs) => {
      return inputs.every(inp => {
        return Number.isFinite(+inp) && inp > 0;
      });
    };

    // 1. Get data from a from
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // 3. If activity be running , create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // use Guard Clause
      if (!validInputs(distance, duration, cadence)) {
        alert('Inputs must be a number and positive number');
        return;
      }

      workout = new Running([lat, lng], distance, duration, cadence);
      this.#workouts.push(workout);
    }
    // 4. If activity be cycling , create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (!validInputs(distance, duration)) {
        alert('Inputs must be a number and positive number');
        return;
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.#workouts.push(workout);
    }

    // 6. Render workout on a map as a marker
    this.renderWorkoutMarker(workout);

    // 7. Render workout on list
    this._renderWorkout(workout);

    // 8. Hide form and clear inputs
    this._hideForm();
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🏔️</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    // just a trick to better UI in app ( use animation )
    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _moveTopPopup(e) {
    const workoutEl = e.target.closest('.workout');

    // use Guard Clause to handle this method instead of simple if else
    if (!workoutEl) return;

    const workoutId = +e.target.closest('.workout').dataset.id;
    const workoutCoords = this.#workouts.find(
      item => item.id == workoutId
    ).coords;

    // Go to position
    this.#map.flyTo(workoutCoords, 13);
  }
}

const app = new App();
