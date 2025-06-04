function initMapSystem() {
  if (document.readyState === 'complete') {
    setupMap();
  } else {
    window.addEventListener('load', setupMap);
  }
}

function setupMap() {
  const iframe = document.getElementById('google-map');
  const langRadios = document.querySelectorAll('input[name="language"]');

  if (!iframe) {
    console.error('Iframe карты не найден');
    return;
  }

  iframe.style.height = '400px'; 
  
  const baseUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d964.7470789527478!2d-117.0022376781427!3d46.72853796075635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54a027785ba2194d%3A0x595c19f48b793280!2sFresenius%20Kidney%20Care%20Palouse!5e0!3m2!1s{lang}!2sby!4v1747831188698!5m2!1s{lang}!2sby';

  const updateMapLanguage = (lang) => {
    const langCode = lang === 'rus' ? 'ru' : 'en';
    iframe.src = baseUrl.replace(/{lang}/g, langCode);
  };

  langRadios.forEach(radio => {
    radio.addEventListener('change', (e) => updateMapLanguage(e.target.value));
  });

  const defaultLang = document.querySelector('input[name="language"]:checked')?.value || 'en';
  updateMapLanguage(defaultLang);
}

initMapSystem();

 const shopButton = document.querySelector('.block1 .btn');
         if (shopButton) {
        shopButton.addEventListener('click', () => {
            window.location.href = '/catalog/catalog.html';
        });
    } 