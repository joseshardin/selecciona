document.addEventListener('DOMContentLoaded', () => {
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
    const form = document.getElementById('dynamicForm');
    let currentQuestion = data.find(q => q.ID === 'q1');

    function renderQuestion(question) {
      form.innerHTML = `
        <div id="logo">
          <img src="https://onbrappi.netlify.app/rappi-logo-1.png" alt="Rappi Logo">
        </div>
        <label>${question.Pregunta.replace(/\n/g, '<br>')}</label>
      `;

      if (question.Tipo === 'select') {
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
        form.appendChild(select);

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
        form.appendChild(p);
      }

      const restartButton = document.createElement('button');
      restartButton.textContent = 'Volver al inicio';
      restartButton.className = 'rappi-button';
      restartButton.addEventListener('click', () => {
        currentQuestion = data.find(q => q.ID === 'q1');
        renderQuestion(currentQuestion);
      });
      form.appendChild(restartButton);
    }

    function renderEndMessage(message) {
      form.innerHTML = `
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
      form.appendChild(restartButton);
    }

    renderQuestion(currentQuestion);
  }
});
