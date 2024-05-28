document.addEventListener('DOMContentLoaded', () => {
  const welcomeModal = document.getElementById('welcomeModal');
  const formContainer = document.getElementById('formContainer');
  const homeButtonContainer = document.getElementById('homeButtonContainer');

  const hasShownModal = sessionStorage.getItem('hasShownModal');

  if (!hasShownModal) {
    welcomeModal.style.display = 'block';
    sessionStorage.setItem('hasShownModal', true);
  }

  const closeBtn = document.querySelector('.close');
  const ingresarBtn = document.getElementById('ingresarBtn');

  const closeModal = () => {
    welcomeModal.style.display = 'none';
    formContainer.classList.add('show');
  };

  closeBtn.addEventListener('click', closeModal);
  ingresarBtn.addEventListener('click', closeModal);

  window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('hasShownModal');
    welcomeModal.style.display = 'block';
  });

  // Solamente cambiar esta URL, nada más.
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQChIIMh-HVXcHLNO5GGkmWLeszRQVOfWv3iO5_GkynFVG8F4tVRphmL8V6qBtp79rI3sLsSPu4lYp4/pub?output=csv';

  fetch(csvUrl)
    .then(response => response.text())
    .then(data => {
      const parsedData = parseCSV(data);
      initializeForm(parsedData);
    });

  function parseCSV(data) {
    const results = Papa.parse(data, {
      header: true,
      skipEmptyLines: true
    });

    return results.data.map(row => {
      row.Condiciones = row.Condiciones ? JSON.parse(row.Condiciones.replace(/""/g, '"')) : {};
      row.Opciones = row.Opciones ? row.Opciones.split(',').map(option => option.trim()) : [];
      return row;
    });
  }

  function initializeForm(data) {
    let currentQuestion = data.find(q => q.ID === 'q1');

    function renderQuestion(question) {
      formContainer.innerHTML = `
        <div id="homeButtonContainer" style="display: ${currentQuestion.ID === 'q1' ? 'none' : 'block'};">
          <span id="homeButton">🏠</span>
        </div>
        <div id="logo">
          <img src="https://onbrappi.netlify.app/rappi-logo-1.png" alt="Rappi Logo">
        </div>
      `;

      const homeButton = formContainer.querySelector('#homeButton');
      if (homeButton) {
        homeButton.addEventListener('click', resetForm);
      }

      if (question.Tipo === 'select') {
        const label = document.createElement('label');
        label.innerHTML = question.Pregunta.replace(/\n/g, '<br>');
        formContainer.appendChild(label);

        const select = document.createElement('select');
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecciona una opción';
        select.appendChild(defaultOption);

        question.Opciones.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option;
          optionElement.textContent = option;
          select.appendChild(optionElement);
        });
        formContainer.appendChild(select);

        if (question.F) {
          const additionalContent = document.createElement('div');
          additionalContent.className = 'additional-content';
          additionalContent.innerHTML = question.F.replace(/\n/g, '<br>');
          formContainer.appendChild(additionalContent);
        }

        const nextButtonContainer = document.createElement('div');
        nextButtonContainer.className = 'button-container';

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.className = 'button';
        nextButtonContainer.appendChild(nextButton);

        formContainer.appendChild(nextButtonContainer);

        nextButton.addEventListener('click', () => {
          const nextQuestionId = question.Condiciones[select.value];
          const nextQuestion = data.find(q => q.ID === nextQuestionId);
          if (nextQuestion) {
            currentQuestion = nextQuestion;
            renderQuestion(nextQuestion);
          } else {
            renderEndMessage(question.Pregunta, question.Path);
          }
        });
      } else if (question.Tipo === 'text') {
        const p = document.createElement('p');
        p.innerHTML = question.Pregunta.replace(/\n/g, '<br>');
        formContainer.appendChild(p);

        if (question.F) {
          const additionalContent = document.createElement('div');
          additionalContent.className = 'additional-content';
          additionalContent.innerHTML = question.F.replace(/\n/g, '<br>');
          formContainer.appendChild(additionalContent);
        }

        renderEndMessage(question.Pregunta, question.Path);
      }
    }

    function renderEndMessage(message, path) {
      const baseUrl = window.location.origin;
      const updatedUrl = path ? `${baseUrl}/${path}` : baseUrl;

      formContainer.innerHTML = `
        <div id="homeButtonContainer" style="display: block;">
          <span id="homeButton">🏠</span>
        </div>
        <div id="logo">
          <img src="https://onbrappi.netlify.app/rappi-logo-1.png" alt="Rappi Logo">
        </div>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `;

      const restartButtonContainer = document.createElement('div');
      restartButtonContainer.className = 'button-container';

      const restartButton = document.createElement('button');
      restartButton.textContent = 'Volver al inicio';
      restartButton.className = 'button';

      restartButton.addEventListener('click', () => {
        resetForm(); // No redirige, solo resetea el formulario
      });

      restartButtonContainer.appendChild(restartButton);
      formContainer.appendChild(restartButtonContainer);

      // Envía un evento personalizado a Google Analytics
      gtag('event', 'page_view', {
        'page_location': updatedUrl,
        'page_path': updatedUrl
      });

      // Actualizar la URL en la barra de direcciones del navegador
      history.replaceState({}, '', updatedUrl);
    }

    function resetForm() {
      const firstQuestion = data.find(q => q.ID === 'q1');
      currentQuestion = firstQuestion;
      renderQuestion(firstQuestion);
    }

    renderQuestion(currentQuestion);
  }
});
