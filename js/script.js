// Find the date inputs, button, gallery, and page controls
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.getElementById('getImagesButton');
const gallery = document.getElementById('gallery');
const spaceFact = document.getElementById('spaceFact');
const pagination = document.getElementById('pagination');
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModalButton');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const imagesPerPage = 6;
let currentImages = [];
let currentPage = 0;
const spaceFacts = [
  'A day on Venus is longer than its year.',
  'Neutron stars can spin hundreds of times every second.',
  'Footprints left by Apollo astronauts can last millions of years on the Moon.',
  'Saturn is less dense than water, so it would float in a large enough ocean.',
  'Sunlight takes about eight minutes to reach Earth.'
];

spaceFact.textContent = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
setupDateInputs(startInput, endInput);
getImagesButton.addEventListener('click', getSpaceImages);
closeModalButton.addEventListener('click', () => imageModal.close());
imageModal.addEventListener('click', (event) => {
  if (event.target === imageModal) {
    imageModal.close();
  }
});
getSpaceImages();

async function getSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showMessage('Choose both a start date and an end date.');
    return;
  }

  if (startDate > endDate) {
    showMessage('The start date must be before the end date.');
    return;
  }

  getImagesButton.disabled = true;
  pagination.hidden = true;
  showMessage('🔄 Loading space photos…');

  try {
    const dateFrom = startDate.slice(2).replaceAll('-', '');
    const dateTo = endDate.slice(2).replaceAll('-', '');
    const apiUrls = [
      'https://science.nasa.gov/wp-json/wp/v2/apod-basic?page=1&per_page=5',
      `https://science.nasa.gov/wp-json/wp/v2/apod-basic?date_from=${dateFrom}&date_to=${dateTo}`
    ];
    const responses = await Promise.all(apiUrls.map((apiUrl) => fetch(apiUrl)));

    const failedResponse = responses.find((response) => !response.ok);
    if (failedResponse) {
      throw new Error(`NASA's APOD endpoint returned an error (${failedResponse.status}).`);
    }

    const imageCollections = await Promise.all(
      responses.map((response) => response.json())
    );
    if (imageCollections.some((collection) => !Array.isArray(collection))) {
      throw new Error('NASA returned an unexpected APOD response.');
    }

    const imageByDate = new Map();
    imageCollections.flat().forEach((item) => {
      if (item.date >= startDate && item.date <= endDate) {
        imageByDate.set(item.date, item);
      }
    });

    displayImages([...imageByDate.values()].sort((first, second) => (
      second.date.localeCompare(first.date)
    )));
  } catch (error) {
    console.error('Unable to load NASA space images:', error);
    showMessage(`Unable to load space images. ${error.message}`);
  } finally {
    getImagesButton.disabled = false;
  }
}

function displayImages(images) {
  currentImages = images.filter((item) => (
    item.media_type === 'image' &&
    item.hdurl &&
    item.title &&
    item.date
  ));
  currentPage = 0;

  if (currentImages.length === 0) {
    pagination.hidden = true;
    showMessage('No APOD images were returned for those dates.');
    return;
  }

  renderGalleryPage();
}

function renderGalleryPage() {
  gallery.replaceChildren();
  const firstImageIndex = currentPage * imagesPerPage;
  const pageImages = currentImages.slice(firstImageIndex, firstImageIndex + imagesPerPage);

  pageImages.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'gallery-item';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View ${item.title}, ${item.date}`);
    card.addEventListener('click', () => openImageModal(item));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openImageModal(item);
      }
    });

    const image = document.createElement('img');
    image.src = item.hdurl;
    image.alt = item.title;
    image.loading = 'lazy';

    const title = document.createElement('h2');
    title.textContent = item.title;

    const date = document.createElement('p');
    date.className = 'image-date';
    date.textContent = item.date;

    card.append(image, title, date);
    gallery.append(card);
  });

  renderPagination();
}

function openImageModal(item) {
  modalImage.src = item.hdurl;
  modalImage.alt = item.title;
  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = new DOMParser()
    .parseFromString(item.explanation || '', 'text/html')
    .body.textContent.trim() || 'No explanation is available for this image.';
  imageModal.showModal();
}

function renderPagination() {
  pagination.replaceChildren();
  const pageCount = Math.ceil(currentImages.length / imagesPerPage);
  pagination.hidden = pageCount <= 1;

  if (pagination.hidden) {
    return;
  }

  const previousButton = document.createElement('button');
  previousButton.type = 'button';
  previousButton.textContent = 'Previous';
  previousButton.disabled = currentPage === 0;
  previousButton.addEventListener('click', () => {
    currentPage -= 1;
    renderGalleryPage();
  });

  const pageStatus = document.createElement('span');
  pageStatus.textContent = `Page ${currentPage + 1} of ${pageCount}`;

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.textContent = 'Next';
  nextButton.disabled = currentPage === pageCount - 1;
  nextButton.addEventListener('click', () => {
    currentPage += 1;
    renderGalleryPage();
  });

  pagination.append(previousButton, pageStatus, nextButton);
}

function showMessage(message) {
  const placeholder = document.createElement('div');
  placeholder.className = 'placeholder';
  placeholder.textContent = message;
  gallery.replaceChildren(placeholder);
  pagination.hidden = true;
}
