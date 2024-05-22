document.addEventListener('DOMContentLoaded', () => {
  const welcomeModal = document.getElementById('welcomeModal');
  const formContainer = document.getElementById('formContainer');


  // Verificar si ya se ha mostrado el modal
  const hasShownModal = sessionStorage.getItem('hasShownModal');

  // Si no se ha mostrado, mostrar el modal y marcarlo como mostrado
  if (!hasShownModal) {
    welcomeModal.style.display = 'block';
    sessionStorage.setItem('hasShownModal', true);
  }

  // Cerrar el modal al hacer clic en la 'X' o en "Ingresar", auqneu ya 'X' no se muestra u.u
  const closeBtn = document.querySelector('.close');
  const ingresarBtn = document.getElementById('ingresarBtn');

  const closeModal = () => {
    welcomeModal.style.display = 'none';
    formContainer.classList.add('show');
  };

  closeBtn.addEventListener('click', closeModal);
  ingresarBtn.addEventListener('click', closeModal);

  // Mostrar el modal al salir de la página
  window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('hasShownModal');
    welcomeModal.style.display = 'block';
  });

  // URL con link del drive (google sheets). Cambiar de ser necesario!!! 
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
      // Limpieza de todo
      formContainer.innerHTML = `
        <div id="logo">
          <img src="https://onbrappi.netlify.app/rappi-logo-1.png" alt="Rappi Logo">
        </div>
      `;

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

        // Contenido adicional de la columna F. Esta vaina no está funcionando bien, por corregir
        if (question.F) {
          const additionalContent = document.createElement('div');
          additionalContent.className = 'additional-content';
          additionalContent.innerHTML = question.F.replace(/\n/g, '<br>');
          formContainer.appendChild(additionalContent);
        }

        select.addEventListener('change', () => {
          const nextQuestionId = question.Condiciones[select.value];
          const nextQuestion = data.find(q => q.ID === nextQuestionId);
          if (nextQuestion) {
            renderQuestion(nextQuestion);
          } else {
            renderEndMessage(question.Pregunta);
          }
        });
      } else if (question.Tipo === 'text') {
        const p = document.createElement('p');
        p.innerHTML = question.Pregunta.replace(/\n/g, '<br>');
        formContainer.appendChild(p);

        // Mostrar el contenido adicional de la columna F. Esta vaina no está funcionando bien, por corregir
        if (question.F) {
          const additionalContent = document.createElement('div');
          additionalContent.className = 'additional-content';
          additionalContent.innerHTML = question.F.replace(/\n/g, '<br>');
          formContainer.appendChild(additionalContent);
        }
      }

      const restartButton = document.createElement('button');
      restartButton.textContent = 'Volver al inicio';
      restartButton.className = 'rappi-button';
      restartButton.addEventListener('click', () => {
        currentQuestion = data.find(q => q.ID === 'q1');
        renderQuestion(currentQuestion);
      });
      formContainer.appendChild(restartButton);
    }

    function renderEndMessage(message) {
      // Limpiar
      formContainer.innerHTML = `
        <div id="logo">
          <img src="https://onbrappi.netlify.app/rappi-logo-1.png" alt="Rappi Logo">
        </div>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `;

      const restartButton = document.createElement('button');
      restartButton.textContent = 'Volver al inicio';
      restartButton.className = 'rappi-button';
      restartButton.addEventListener('click', () => {
        currentQuestion = data.find(q => q.ID === 'q1');
        renderQuestion(currentQuestion);
      });
      formContainer.appendChild(restartButton);
    }

    renderQuestion(currentQuestion);
  }
});
